import { NextResponse } from 'next/server';
import { PRESET_CASES } from '../../../data/presetCases';

export async function GET() {
  return NextResponse.json(PRESET_CASES);
}
