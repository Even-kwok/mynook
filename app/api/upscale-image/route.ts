import { NextRequest } from 'next/server';
import { adaptVercelHandler } from '../_lib/vercel-adapter';
import handler from '../../../api/upscale-image';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return adaptVercelHandler(request, handler);
}

