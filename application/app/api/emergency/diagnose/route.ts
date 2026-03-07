import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'audio' or 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['audio', 'image'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "audio" or "image"' }, { status: 400 });
    }

    // Prepare form data for ML API
    const mlFormData = new FormData();
    mlFormData.append('file', file);

    // Select the appropriate ML API endpoint
    const apiUrl = type === 'audio' 
      ? process.env.ML_AUDIO_API_URL 
      : process.env.ML_IMAGE_API_URL;

    if (!apiUrl) {
      return NextResponse.json({ 
        error: 'ML API URL not configured. Please set ML_AUDIO_API_URL and ML_IMAGE_API_URL in .env' 
      }, { status: 500 });
    }

    // Call the ML API
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: mlFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        error: 'ML API error', 
        details: errorData 
      }, { status: response.status });
    }

    const result = await response.json();

    // Format response based on type
    if (type === 'audio') {
      return NextResponse.json({
        type: 'audio',
        emotion: result.detected_emotion,
        category: result.emergency_category,
        isEmergency: result.emergency_category === 'Emergency',
        rawData: result
      });
    } else {
      return NextResponse.json({
        type: 'image',
        status: result.status,
        reason: result.reason,
        labels: result.detected_labels,
        isEmergency: result.status === 'emergency',
        rawData: result
      });
    }

  } catch (error: any) {
    console.error('Emergency diagnosis error:', error);
    return NextResponse.json({ 
      error: 'Failed to process emergency diagnosis', 
      details: error.message 
    }, { status: 500 });
  }
}
