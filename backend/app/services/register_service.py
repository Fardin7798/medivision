"""Medical Image Registration Service using SimpleITK for MediVision."""
from pathlib import Path
from typing import Dict, Tuple, Optional, Any

import numpy as np
import SimpleITK as sitk

from backend.app.services.data_service import load_medical_image, save_nifti


def register_3d_images(
    fixed_image_path: str | Path,
    moving_image_path: str | Path,
    transform_type: str = "rigid",
    output_path: Optional[str | Path] = None,
    num_iterations: int = 150,
) -> Dict[str, Any]:
    """
    Execute 3D multi-resolution image registration using SimpleITK.

    Args:
        fixed_image_path: Reference anatomical scan (e.g. atlas or baseline scan).
        moving_image_path: Patient scan to be spatially aligned to the fixed image.
        transform_type: "rigid" (Euler3D: 6 DOF) or "affine" (12 DOF).
        output_path: Destination path for registered NIfTI scan.
        num_iterations: Max optimizer iterations.

    Returns:
        Dictionary containing translation (mm), rotation (degrees), final metric value, and output paths.
    """
    # 1. Read images via SimpleITK
    fixed_img = sitk.ReadImage(str(fixed_image_path), sitk.sitkFloat32)
    moving_img = sitk.ReadImage(str(moving_image_path), sitk.sitkFloat32)

    # 2. Initialize spatial transform
    if transform_type.lower() == "affine":
        initial_transform = sitk.AffineTransform(3)
    else:
        initial_transform = sitk.Euler3DTransform()

    # Center-of-mass alignment initializer
    initial_transform = sitk.CenteredTransformInitializer(
        fixed_img,
        moving_img,
        initial_transform,
        sitk.CenteredTransformInitializerFilter.GEOMETRY,
    )

    # 3. Setup Registration Method
    registration_method = sitk.ImageRegistrationMethod()

    # Similarity Metric: Mattes Mutual Information
    registration_method.SetMetricAsMattesMutualInformation(numberOfHistogramBins=50)
    registration_method.SetMetricSamplingStrategy(registration_method.RANDOM)
    registration_method.SetMetricSamplingPercentage(0.20)

    # Interpolator
    registration_method.SetInterpolator(sitk.sitkLinear)

    # Optimizer: Regular Step Gradient Descent
    registration_method.SetOptimizerAsRegularStepGradientDescent(
        learningRate=2.0,
        minStep=0.001,
        numberOfIterations=num_iterations,
        gradientMagnitudeTolerance=1e-5,
    )
    registration_method.SetOptimizerScalesFromPhysicalShift()

    # Multi-resolution Gaussian Pyramid (3 levels: 4x downsample -> 2x -> 1x full resolution)
    registration_method.SetShrinkFactorsPerLevel(shrinkFactors=[4, 2, 1])
    registration_method.SetSmoothingSigmasPerLevel(smoothingSigmas=[2, 1, 0])
    registration_method.SmoothingSigmasAreSpecifiedInPhysicalUnitsOn()

    registration_method.SetInitialTransform(initial_transform, inPlace=False)

    # 4. Execute Registration Optimization
    final_transform = registration_method.Execute(fixed_img, moving_img)

    # 5. Resample moving image into fixed coordinate space
    resampled_moving = sitk.Resample(
        moving_img,
        fixed_img,
        final_transform,
        sitk.sitkLinear,
        0.0,
        moving_img.GetPixelID(),
    )

    # 6. Extract spatial parameters
    rot_x_deg = 0.0
    rot_y_deg = 0.0
    rot_z_deg = 0.0
    translation_mm = [0.0, 0.0, 0.0]

    if isinstance(final_transform, sitk.Euler3DTransform):
        rot_x_deg = round(float(np.degrees(final_transform.GetAngleX())), 2)
        rot_y_deg = round(float(np.degrees(final_transform.GetAngleY())), 2)
        rot_z_deg = round(float(np.degrees(final_transform.GetAngleZ())), 2)
        translation_mm = [round(float(t), 2) for t in final_transform.GetTranslation()]
    elif isinstance(final_transform, sitk.CompositeTransform):
        # Extract back from composite
        sub_t = final_transform.GetNthTransform(0)
        if hasattr(sub_t, "GetTranslation"):
            translation_mm = [round(float(t), 2) for t in sub_t.GetTranslation()]

    final_metric = float(registration_method.GetMetricValue())
    num_iters = int(registration_method.GetOptimizerIteration())
    stop_condition = str(registration_method.GetOptimizerStopConditionDescription())

    # 7. Save output if requested
    out_file_str = ""
    if output_path is not None:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        sitk.WriteImage(resampled_moving, str(out_p))
        out_file_str = str(out_p.resolve())

    return {
        "transform_type": transform_type,
        "final_metric_value": round(final_metric, 5),
        "optimizer_iterations": num_iters,
        "stop_condition": stop_condition,
        "rotation_deg": {
            "x": rot_x_deg,
            "y": rot_y_deg,
            "z": rot_z_deg,
        },
        "translation_mm": {
            "x": translation_mm[0],
            "y": translation_mm[1],
            "z": translation_mm[2],
        },
        "registered_image_path": out_file_str,
    }


def create_perturbed_scan_pair(
    output_dir: str | Path = "./data/registration_test",
) -> Tuple[str, str]:
    """
    Generate a fixed synthetic cardiac scan and a synthetically rotated/translated
    moving scan for local registration verification.
    """
    from backend.app.services.data_service import create_synthetic_sample, load_medical_image, save_nifti
    import scipy.ndimage

    out_d = Path(output_dir)
    out_d.mkdir(parents=True, exist_ok=True)
    fixed_path = out_d / "fixed_atlas.nii.gz"
    moving_path = out_d / "moving_patient.nii.gz"

    img_p, _ = create_synthetic_sample(output_dir=out_d)
    data, affine, _ = load_medical_image(img_p)

    save_nifti(data, affine, fixed_path)

    # Shift moving scan by 4 voxels and rotate slightly (5 degrees)
    shifted = scipy.ndimage.shift(data, shift=[3, -2, 2], mode="nearest")
    rotated = scipy.ndimage.rotate(shifted, angle=5.0, axes=(1, 2), reshape=False, mode="nearest")

    save_nifti(rotated, affine, moving_path)
    return str(fixed_path.resolve()), str(moving_path.resolve())


if __name__ == "__main__":
    print("Testing SimpleITK Medical Image Registration Service...")
    fixed_p, moving_p = create_perturbed_scan_pair()
    print(f"Test pair generated: Fixed={fixed_p}, Moving={moving_p}")

    res = register_3d_images(
        fixed_p,
        moving_p,
        transform_type="rigid",
        output_path="./outputs/registered_patient.nii.gz",
        num_iterations=80,
    )
    print("Registration executed successfully:")
    print(f"  Final Metric Value: {res["final_metric_value"]}")
    print(f"  Iterations: {res["optimizer_iterations"]}")
    print(f"  Rotation: {res["rotation_deg"]}")
    print(f"  Translation: {res["translation_mm"]}")
    print(f"  Output: {res["registered_image_path"]}")
