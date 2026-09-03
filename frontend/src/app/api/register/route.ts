import { NextRequest, NextResponse } from 'next/server';
import { computeLandmarkRegistration } from '../../../lib/math/kabsch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fixedPoints, movingPoints, method = 'kabsch-svd' } = body;

    if (!fixedPoints || !movingPoints || fixedPoints.length < 3 || movingPoints.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 paired fiducial landmark points are required.' },
        { status: 400 }
      );
    }

    const result = computeLandmarkRegistration(fixedPoints, movingPoints, method);

    return NextResponse.json({
      status: 'success',
      source: 'svd-quaternion-solver-exact',
      solverMethod: result.solverMethod,
      pairedLandmarks: result.pairedLandmarks,
      targetRegistrationErrorMm: result.targetRegistrationErrorMm,
      translationVectorMm: result.translationVectorMm,
      isClinicallyAcceptable: result.isClinicallyAcceptable
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
