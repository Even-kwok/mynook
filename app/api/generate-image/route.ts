import { NextRequest } from 'next/server';
import { adaptVercelHandler } from '../_lib/vercel-adapter';
import handler from '../../../api/generate-image';

export const runtime = 'nodejs';
export const maxDuration = 100;

export async function POST(request: NextRequest) {
  return adaptVercelHandler(request, handler);
}
