import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const apiUrl = process.env.ML_FIND_HOSPITALS_URL;

    if (!apiUrl) {
      console.error('[HOSPITALS] ML API URL not configured.');
      return NextResponse.json({ error: 'ML API not configured' }, { status: 500 });
    }

    console.log('[HOSPITALS] Calling ML API:', apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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
        console.error('[HOSPITALS] ML API failed with status:', response.status);
        console.error('[HOSPITALS] ML API error response:', errorText);
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
        console.error('[HOSPITALS] ML API timeout');
        return NextResponse.json(
          { error: 'ML API timeout', details: 'Request took longer than 60 seconds' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[HOSPITALS] Error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}
