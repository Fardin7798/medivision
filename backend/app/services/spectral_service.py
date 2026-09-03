"""Memory-Efficient Multichannel & Derived Spectral Feature Extraction Service for MediVision."""
import gc
from pathlib import Path
from typing import Dict, Tuple, Optional, Any, List

import numpy as np
import scipy.ndimage

from backend.app.services.data_service import load_medical_image, save_nifti


def compute_3d_sobel_gradient(volume: np.ndarray) -> np.ndarray:
    """
    Compute 3D Sobel spatial gradient magnitude: ||grad(I)|| = sqrt(Gz^2 + Gy^2 + Gx^2).
    Captures anatomical boundary edges and tissue transitions.
    """
    vol = volume.astype(np.float32)
    gz = scipy.ndimage.sobel(vol, axis=0, mode="reflect")
    gy = scipy.ndimage.sobel(vol, axis=1, mode="reflect")
    gx = scipy.ndimage.sobel(vol, axis=2, mode="reflect")
    grad_mag = np.sqrt(gz ** 2 + gy ** 2 + gx ** 2)
    mean, std = np.mean(grad_mag), np.std(grad_mag)
    return ((grad_mag - mean) / (std + 1e-6)).astype(np.float32)


def compute_3d_laplacian(volume: np.ndarray) -> np.ndarray:
    """
    Compute 3D Laplacian second derivative (curvature & ridge response).
    """
    vol = volume.astype(np.float32)
    lap = scipy.ndimage.laplace(vol, mode="reflect")
    mean, std = np.mean(lap), np.std(lap)
    return ((lap - mean) / (std + 1e-6)).astype(np.float32)


def compute_3d_gabor_texture(
    volume: np.ndarray,
    sigma: float = 1.5,
    freq: float = 0.2,
) -> np.ndarray:
    """
    Compute 3D Gabor spatial texture frequency response.
    Captures directional myocardial fibers and spatial tissue textures.
    """
    vol = volume.astype(np.float32)
    radius = int(np.ceil(2 * sigma))
    z, y, x = np.mgrid[-radius:radius+1, -radius:radius+1, -radius:radius+1]
    
    gaussian_envelope = np.exp(-(x**2 + y**2 + z**2) / (2.0 * sigma**2))
    carrier = np.cos(2.0 * np.pi * freq * (x + y + z) / np.sqrt(3))
    kernel = (gaussian_envelope * carrier).astype(np.float32)
    kernel -= np.mean(kernel)

    filtered = scipy.ndimage.convolve(vol, kernel, mode="reflect")
    mean, std = np.mean(filtered), np.std(filtered)
    return ((filtered - mean) / (std + 1e-6)).astype(np.float32)


def compute_single_channel(volume: np.ndarray, channel_idx: int) -> np.ndarray:
    """Compute a single spectral feature map on-demand without memory accumulation."""
    if channel_idx == 0:
        vol = volume.astype(np.float32)
        return ((vol - np.mean(vol)) / (np.std(vol) + 1e-6)).astype(np.float32)
    elif channel_idx == 1:
        return compute_3d_sobel_gradient(volume)
    elif channel_idx == 2:
        return compute_3d_laplacian(volume)
    elif channel_idx == 3:
        return compute_3d_gabor_texture(volume)
    else:
        raise ValueError(f"Invalid channel index: {channel_idx}. Must be 0, 1, 2, or 3.")


def extract_multichannel_volume(volume: np.ndarray) -> np.ndarray:
    """
    Stack raw intensity and derived features into a 4-channel tensor of shape (4, D, H, W).
    - Channel 0: Normalized voxel intensity
    - Channel 1: 3D Sobel spatial gradient magnitude
    - Channel 2: 3D Laplacian second derivative
    - Channel 3: 3D Gabor spatial texture energy
    """
    ch0 = compute_single_channel(volume, 0)
    ch1 = compute_single_channel(volume, 1)
    ch2 = compute_single_channel(volume, 2)
    ch3 = compute_single_channel(volume, 3)

    multichannel = np.stack([ch0, ch1, ch2, ch3], axis=0)
    gc.collect()
    return multichannel.astype(np.float32)


def extract_multichannel_file(
    input_file: str | Path,
    output_dir: str | Path = "./outputs",
    file_prefix: str = "multichannel",
) -> Dict[str, Any]:
    """Load volumetric NIfTI scan, extract 4 spectral channels, and save each channel."""
    data, affine, meta = load_medical_image(input_file)
    mc_tensor = extract_multichannel_volume(data)

    out_d = Path(output_dir)
    out_d.mkdir(parents=True, exist_ok=True)

    channel_names = [
        "01_normalized_intensity",
        "02_sobel_gradient_magnitude",
        "03_laplacian_curvature",
        "04_gabor_texture_energy",
    ]

    saved_paths = []
    for idx, name in enumerate(channel_names):
        ch_path = out_d / f"{file_prefix}_{name}.nii.gz"
        save_nifti(mc_tensor[idx], affine, ch_path)
        saved_paths.append(str(ch_path.resolve()))

    return {
        "input_file": str(input_file),
        "channels": channel_names,
        "tensor_shape": list(mc_tensor.shape),
        "saved_channel_paths": saved_paths,
        "num_channels": 4,
    }


if __name__ == "__main__":
    print("Testing Optimized Multichannel & Spectral Feature Extraction Service...")
    test_vol = np.random.normal(50, 15, size=(48, 48, 48)).astype(np.float32)
    mc_array = extract_multichannel_volume(test_vol)
    print(f"4-Channel Spectral Tensor generated: Shape = {mc_array.shape}")
    print(f"  Ch0 (Intensity): Mean={np.mean(mc_array[0]):.2f}, Std={np.std(mc_array[0]):.2f}")
    print(f"  Ch1 (Sobel):     Mean={np.mean(mc_array[1]):.2f}, Std={np.std(mc_array[1]):.2f}")
    print(f"  Ch2 (Laplacian): Mean={np.mean(mc_array[2]):.2f}, Std={np.std(mc_array[2]):.2f}")
    print(f"  Ch3 (Gabor):     Mean={np.mean(mc_array[3]):.2f}, Std={np.std(mc_array[3]):.2f}")
