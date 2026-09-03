import { NextRequest, NextResponse } from 'next/server';
import { PRESET_CASES } from '../../../../data/presetCases';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const selectedCase = PRESET_CASES.find(c => c.id === id);
  if (!selectedCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }
  return NextResponse.json(selectedCase);
}
