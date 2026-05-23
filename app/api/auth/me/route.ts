import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/server';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      {
        success: false,
        message: 'Not authenticated',
        errorCode: 'AUTH_UNAUTHORIZED',
      },
      { status: 401 },
    );
  }
  return NextResponse.json({
    success: true,
    message: 'Request successful',
    data: admin,
  });
}
