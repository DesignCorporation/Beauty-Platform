import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'beauty-platform-landing-page',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 6004,
    version: '1.0.0'
  })
}