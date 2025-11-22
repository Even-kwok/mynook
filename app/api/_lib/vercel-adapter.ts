/**
 * Adapter to convert Next.js API Route to Vercel Serverless Function format
 */
import { NextRequest, NextResponse } from 'next/server';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export async function adaptVercelHandler(
  request: NextRequest,
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void> | void
): Promise<NextResponse> {
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Create Vercel-compatible request
    const vercelReq: Partial<VercelRequest> = {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      url: request.url,
    } as any;

    // Create response capture object
    let statusCode = 200;
    const headers: Record<string, string> = {};
    let responseData: any = null;
    let responseSent = false;

    const vercelRes: Partial<VercelResponse> = {
      status: (code: number) => {
        statusCode = code;
        return vercelRes as VercelResponse;
      },
      setHeader: (key: string, value: string | string[]) => {
        headers[key] = Array.isArray(value) ? value.join(', ') : value;
        return vercelRes as VercelResponse;
      },
      json: (data: any) => {
        if (!responseSent) {
          responseData = data;
          responseSent = true;
        }
        return vercelRes as VercelResponse;
      },
      send: (data: any) => {
        if (!responseSent) {
          responseData = data;
          responseSent = true;
        }
        return vercelRes as VercelResponse;
      },
      end: (data?: any) => {
        if (!responseSent && data !== undefined) {
          responseData = data;
          responseSent = true;
        }
        return vercelRes as VercelResponse;
      },
    } as any;

    // Execute the handler
    await handler(vercelReq as VercelRequest, vercelRes as VercelResponse);

    // Return Next.js response
    if (typeof responseData === 'string') {
      return new NextResponse(responseData, {
        status: statusCode,
        headers: headers,
      });
    }

    return NextResponse.json(responseData || {}, {
      status: statusCode,
      headers: headers,
    });
  } catch (error) {
    console.error('[API Adapter] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

