"""3D U-Net Segmentation service and inference engine for MediVision."""
import os
from pathlib import Path
from typing import Dict, Tuple, Optional, Any

import numpy as np
import torch
import torch.nn as nn
from monai.networks.nets import UNet
from monai.losses import DiceCELoss
from monai.inferers import sliding_window_inference
from huggingface_hub import hf_hub_download

from backend.app.config import get_config
from backend.app.services.data_service import load_medical_image, save_nifti


def build_3d_unet(
    in_channels: int = 1,
    out_channels: int = 2,
    channels: Tuple[int, ...] = (16, 32, 64, 128, 256),
    strides: Tuple[int, ...] = (2, 2, 2, 2),
    num_res_units: int = 2,
    dropout: float = 0.1,
) -> UNet:
    """
    Construct a 3D U-Net with residual connections and instance normalization.

    Args:
        in_channels: 1 for standard intensity, 4 for multichannel (intensity+sobel+laplacian+gabor).
        out_channels: 2 (0: background, 1: left atrium).
        channels: Feature map channels at each resolution layer.
        strides: Convolution strides at each downsampling step.
        num_res_units: Number of residual units per block.
        dropout: Dropout probability.

    Returns:
        Instantiated monai.networks.nets.UNet model.
    """
    model = UNet(
        spatial_dims=3,
        in_channels=in_channels,
        out_channels=out_channels,
        channels=channels,
        strides=strides,
        num_res_units=num_res_units,
        norm="INSTANCE",
        dropout=dropout,
    )
    return model


def get_loss_function() -> DiceCELoss:
    """Return composite Dice + Cross-Entropy loss for binary segmentation."""
    return DiceCELoss(to_onehot_y=True, softmax=True, lambda_dice=1.0, lambda_ce=1.0)


def load_or_fetch_checkpoint(
    model: nn.Module,
    checkpoint_path: Optional[str | Path] = None,
    device: str = "cpu",
) -> Tuple[nn.Module, bool]:
    """
    Load trained weights from local disk or Hugging Face Hub.

    Args:
        model: PyTorch module.
        checkpoint_path: Optional local path to .pth weights file.
        device: "cuda" or "cpu".

    Returns:
        (model, is_trained_weights_loaded)
    """
    cfg = get_config()
    target_path = Path(checkpoint_path) if checkpoint_path else Path(cfg["hub"]["local_checkpoint_dir"]) / cfg["hub"]["checkpoint_filename"]

    # 1. Check local path
    if target_path.is_file():
        state_dict = torch.load(str(target_path), map_location=device, weights_only=True)
        model.load_state_dict(state_dict)
        print(f"[MediVision ML] Loaded local checkpoint from: {target_path}")
        return model, True

    # 2. Attempt download from Hugging Face Hub (if repository exists)
    repo_id = cfg["hub"]["repo_id"]
    filename = cfg["hub"]["checkpoint_filename"]
    try:
        print(f"[MediVision ML] Checking Hugging Face Hub repository {repo_id} for {filename}...")
        downloaded_file = hf_hub_download(repo_id=repo_id, filename=filename)
        state_dict = torch.load(downloaded_file, map_location=device, weights_only=True)
        model.load_state_dict(state_dict)
        print(f"[MediVision ML] Successfully downloaded and loaded HF weights from: {downloaded_file}")
        return model, True
    except Exception as e:
        print(f"[MediVision ML] Note: No remote checkpoint found ({e}). Operating with initialized model weights.")
        return model, False


def run_segmentation_inference(
    volume: np.ndarray,
    model: Optional[nn.Module] = None,
    roi_size: Tuple[int, int, int] = (96, 96, 96),
    sw_batch_size: int = 2,
    overlap: float = 0.25,
    device: Optional[str] = None,
) -> Tuple[np.ndarray, float]:
    """
    Execute 3D sliding-window volumetric inference.

    Args:
        volume: 3D float32 array of shape (D, H, W).
        model: Optional pre-loaded model (builds baseline if None).
        roi_size: Sub-volume patch size for sliding window.
        sw_batch_size: Batch size of patches evaluated in parallel.
        overlap: Overlap fraction between adjacent patches.
        device: Compute device ("cuda" or "cpu").

    Returns:
        binary_mask: np.ndarray of shape (D, H, W) with values {0, 1}.
        volume_cm3: Estimated anatomical volume in cubic centimeters.
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    if model is None:
        cfg = get_config()
        b_cfg = cfg["model"]["baseline"]
        model = build_3d_unet(
            in_channels=b_cfg["in_channels"],
            out_channels=b_cfg["out_channels"],
            channels=tuple(b_cfg["channels"]),
            strides=tuple(b_cfg["strides"]),
            num_res_units=b_cfg["num_res_units"],
        )
        model, _ = load_or_fetch_checkpoint(model, device=device)

    model.to(device)
    model.eval()

    # Shape preparation: (1, 1, D, H, W)
    input_tensor = torch.from_numpy(volume).unsqueeze(0).unsqueeze(0).float().to(device)

    with torch.no_grad():
        # MONAI sliding-window inference with Gaussian blending
        val_outputs = sliding_window_inference(
            inputs=input_tensor,
            roi_size=roi_size,
            sw_batch_size=sw_batch_size,
            predictor=model,
            overlap=overlap,
            mode="gaussian",
        )
        # Apply argmax over class probabilities (channel dimension)
        pred_mask = torch.argmax(val_outputs, dim=1).squeeze(0).cpu().numpy().astype(np.uint8)

    # Calculate segmented organ volume in cm3 (assuming 1.0mm isotropic voxels -> 1 voxel = 0.001 cm3)
    voxel_count = int(np.sum(pred_mask == 1))
    volume_cm3 = voxel_count * 0.001

    return pred_mask, volume_cm3


def segment_volume_file(
    input_file: str | Path,
    output_mask_file: Optional[str | Path] = None,
    device: Optional[str] = None,
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Load preprocessed scan, run 3D U-Net segmentation, and optionally save mask.

    Returns:
        (binary_mask, affine, metadata)
    """
    volume, affine, meta = load_medical_image(input_file)
    mask, vol_cm3 = run_segmentation_inference(volume, device=device)

    out_meta = {
        "input_file": str(input_file),
        "mask_shape": list(mask.shape),
        "voxels_segmented": int(np.sum(mask == 1)),
        "volume_cm3": round(vol_cm3, 3),
        "classes": [0, 1],
    }

    if output_mask_file is not None:
        save_nifti(mask, affine, output_mask_file)
        out_meta["saved_mask_path"] = str(output_mask_file)

    return mask, affine, out_meta


if __name__ == "__main__":
    print("Testing 3D U-Net Segmentation Engine...")
    model = build_3d_unet()
    print(f"3D U-Net instantiated: Total parameters = {sum(p.numel() for p in model.parameters()):,}")

    # Forward pass test with dummy batch
    dummy_input = np.random.normal(0, 1, size=(64, 64, 64)).astype(np.float32)
    mask, vol_cm3 = run_segmentation_inference(dummy_input, model=model)
    print(f"Inference verified successfully: Output mask shape={mask.shape}, Volume={vol_cm3:.2f} cm3")
