import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'MediVision Unified Next.js API',
    version: '1.4.0',
    timestamp: new Date().toISOString()
  });
}
