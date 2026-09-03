"""Reproducible 3D U-Net Training Pipeline for MediVision (MSD Task02_Heart)."""
import os
import time
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from monai.data import Dataset, CacheDataset, decollate_batch
from monai.metrics import DiceMetric
from monai.transforms import AsDiscrete, Compose

from backend.app.config import get_config
from backend.app.services.data_service import download_msd_heart, get_dataset_split
from backend.app.services.preprocess_service import get_monai_transforms
from backend.app.services.segment_service import build_3d_unet, get_loss_function


def train_medivision_unet(
    max_epochs: int = 100,
    batch_size: int = 2,
    lr: float = 2e-4,
    val_interval: int = 2,
    cache_rate: float = 1.0,
    device_str: str = "auto",
):
    """
    Train 3D U-Net on Task02_Heart with automatic checkpointing on best validation Dice score.
    """
    cfg = get_config()
    device = torch.device("cuda" if (device_str == "auto" and torch.cuda.is_available()) or device_str == "cuda" else "cpu")
    print(f"[MediVision Training] Starting training on device: {device}")

    # 1. Prepare data
    data_dir = download_msd_heart(cfg["dataset"]["data_dir"])
    train_files, val_files = get_dataset_split(data_dir, val_split=cfg["dataset"]["val_split"])
    print(f"[MediVision Training] Loaded {len(train_files)} training cases, {len(val_files)} validation cases.")

    # 2. Transforms & DataLoaders
    roi_size = tuple(cfg["preprocessing"]["roi_size"])
    train_transforms = get_monai_transforms(train=True, roi_size=roi_size)
    val_transforms = get_monai_transforms(train=False)

    train_ds = CacheDataset(data=train_files, transform=train_transforms, cache_rate=cache_rate, num_workers=2)
    val_ds = CacheDataset(data=val_files, transform=val_transforms, cache_rate=cache_rate, num_workers=1)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=1, shuffle=False, num_workers=0)

    # 3. Model, Loss, Optimizer, Metric
    b_cfg = cfg["model"]["baseline"]
    model = build_3d_unet(
        in_channels=b_cfg["in_channels"],
        out_channels=b_cfg["out_channels"],
        channels=tuple(b_cfg["channels"]),
        strides=tuple(b_cfg["strides"]),
        num_res_units=b_cfg["num_res_units"],
    ).to(device)

    loss_function = get_loss_function()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=cfg["training"]["weight_decay"])
    scaler = torch.cuda.amp.GradScaler(enabled=(device.type == "cuda"))

    dice_metric = DiceMetric(include_background=False, reduction="mean")
    post_pred = Compose([AsDiscrete(argmax=True, to_onehot=2)])
    post_label = Compose([AsDiscrete(to_onehot=2)])

    # Output directory for best model
    model_dir = Path(cfg["hub"]["local_checkpoint_dir"])
    model_dir.mkdir(parents=True, exist_ok=True)
    best_model_path = model_dir / cfg["hub"]["checkpoint_filename"]

    best_metric = -1.0
    best_metric_epoch = -1
    epoch_loss_values = []
    metric_values = []

    start_time = time.time()
    print("[MediVision Training] Beginning epoch loop...")

    for epoch in range(1, max_epochs + 1):
        model.train()
        epoch_loss = 0.0
        step = 0

        for batch_data in train_loader:
            step += 1
            inputs, labels = batch_data["image"].to(device), batch_data["label"].to(device)
            optimizer.zero_grad()

            with torch.cuda.amp.autocast(enabled=(device.type == "cuda")):
                outputs = model(inputs)
                loss = loss_function(outputs, labels)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            epoch_loss += loss.item()

        epoch_loss /= max(1, step)
        epoch_loss_values.append(epoch_loss)

        if epoch % val_interval == 0 or epoch == max_epochs:
            model.eval()
            with torch.no_grad():
                for val_data in val_loader:
                    val_inputs, val_labels = val_data["image"].to(device), val_data["label"].to(device)
                    # Sliding window evaluation
                    from monai.inferers import sliding_window_inference
                    val_outputs = sliding_window_inference(
                        val_inputs, roi_size=roi_size, sw_batch_size=2, predictor=model, overlap=0.25, mode="gaussian"
                    )
                    val_outputs = [post_pred(i) for i in decollate_batch(val_outputs)]
                    val_labels = [post_label(i) for i in decollate_batch(val_labels)]
                    dice_metric(y_pred=val_outputs, y=val_labels)

                metric = dice_metric.aggregate().item()
                dice_metric.reset()
                metric_values.append(metric)

                if metric > best_metric:
                    best_metric = metric
                    best_metric_epoch = epoch
                    torch.save(model.state_dict(), str(best_model_path))
                    print(f"Epoch {epoch:03d}/{max_epochs:03d} | Train Loss: {epoch_loss:.4f} | Val Dice: {metric:.4f} -> [NEW BEST CHECKPOINT SAVED]")
                else:
                    print(f"Epoch {epoch:03d}/{max_epochs:03d} | Train Loss: {epoch_loss:.4f} | Val Dice: {metric:.4f}")

    total_time = time.time() - start_time
    print(f"[MediVision Training] Completed in {total_time/60:.2f} min. Best Val Dice: {best_metric:.4f} at epoch {best_metric_epoch}")
    return str(best_model_path), best_metric


def upload_checkpoint_to_hub(checkpoint_path: str, best_dice: float) -> None:
    """Upload the best checkpoint to the configured Hugging Face Hub repo."""
    from huggingface_hub import HfApi

    cfg = get_config()
    repo_id = cfg["hub"]["repo_id"]
    filename = cfg["hub"]["checkpoint_filename"]

    if not os.environ.get("HF_TOKEN"):
        print("[MediVision Training] Skipping HF upload: HF_TOKEN not set in environment.")
        return

    api = HfApi()
    api.create_repo(repo_id=repo_id, repo_type="model", private=True, exist_ok=True)
    api.upload_file(
        path_or_fileobj=checkpoint_path,
        path_in_repo=filename,
        repo_id=repo_id,
        repo_type="model",
        commit_message=f"Best checkpoint - Val Dice {best_dice:.4f}",
    )
    print(f"[MediVision Training] Uploaded best checkpoint (Dice {best_dice:.4f}) to {repo_id}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="MediVision 3D U-Net Training")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=2, help="Batch size")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--no-upload", action="store_true", help="Skip Hugging Face Hub upload after training")
    args = parser.parse_args()

    print(f"[MediVision Training] Initialized with {args.epochs} epochs, batch_size={args.batch_size}, lr={args.lr}")
    ckpt_path, best_dice = train_medivision_unet(max_epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)

    if not args.no_upload:
        upload_checkpoint_to_hub(ckpt_path, best_dice)
