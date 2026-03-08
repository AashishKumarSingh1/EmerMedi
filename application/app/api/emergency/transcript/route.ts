import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const apiUrl = process.env.ML_GENERATE_TRANSCRIPT_URL;

    if (!apiUrl) {
      console.error('[TRANSCRIPT] ML API URL not configured.');
      return NextResponse.json({ error: 'ML API not configured' }, { status: 500 });
    }

    console.log('[TRANSCRIPT] Calling ML API:', apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TRANSCRIPT] ML API failed with status:', response.status);
        console.error('[TRANSCRIPT] ML API error response:', errorText);
        return NextResponse.json(
          { error: 'ML API failed', details: errorText, status: response.status },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[TRANSCRIPT] ML API timeout');
        return NextResponse.json(
          { error: 'ML API timeout', details: 'Request took longer than 120 seconds' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[TRANSCRIPT] Error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
