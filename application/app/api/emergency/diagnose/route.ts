import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file || !type || !['audio', 'image'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    console.log('[DIAGNOSIS] Starting for user:', session.userId);
    console.log('[DIAGNOSIS] File type:', type, 'File name:', file.name, 'File size:', file.size);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `diagnosis/${session.userId}/${Date.now()}-${file.name}`;
    const s3Url = await uploadToS3(fileBuffer, fileName, file.type);
    console.log('[DIAGNOSIS] Uploaded to S3:', s3Url);

    const mlFormData = new FormData();
    mlFormData.append('file', file);

    const apiUrl = type === 'audio' ? process.env.ML_AUDIO_API_URL : process.env.ML_IMAGE_API_URL;
    
    if (!apiUrl) {
      console.error('[DIAGNOSIS] ML API URL not configured for type:', type);
      return NextResponse.json({ error: 'ML API not configured' }, { status: 500 });
    }

    console.log('[DIAGNOSIS] Calling ML API:', apiUrl);
    
    const timeoutMs = type === 'audio' ? 120000 : 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(apiUrl, { 
        method: 'POST', 
        body: mlFormData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DIAGNOSIS] ML API failed with status:', response.status);
        console.error('[DIAGNOSIS] ML API error response:', errorText);
        return NextResponse.json({ 
          error: 'ML API failed', 
          details: errorText,
          status: response.status 
        }, { status: 500 });
      }

      const result = await response.json();
      console.log('[DIAGNOSIS] ML result:', JSON.stringify(result, null, 2));

      let diagnosisResult;
      if (type === 'audio') {
        diagnosisResult = {
          type: 'audio',
          emotion: result.detected_emotion,
          category: result.emergency_category,
          isEmergency: result.emergency_category === 'Emergency',
          rawData: result
        };
      } else {
        const isEmergency = result.emergency_level === 'critical' || 
                           result.emergency_level === 'urgent' || 
                           result.call_ambulance === true;
        
        const labels = result.rekognition?.labels || result.detected_labels || [];
        const reason = result.dispatcher_report || result.reasoning || result.scene_description || 'Analysis complete';
        
        diagnosisResult = {
          type: 'image',
          status: result.emergency_level || (isEmergency ? 'emergency' : 'non-emergency'),
          reason: reason,
          labels: labels,
          isEmergency: isEmergency,
          triage: result,
          rawData: result
        };
      }

      const db = await getDatabase();
      await db.collection('diagnosis_history').insertOne({
        userId: session.userId,
        type,
        result: diagnosisResult,
        fileUrl: s3Url,
        fileName: file.name,
        isEmergency: diagnosisResult.isEmergency,
        createdAt: new Date(),
      });

      console.log('[DIAGNOSIS] Saved successfully, isEmergency:', diagnosisResult.isEmergency);

      return NextResponse.json(diagnosisResult);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[DIAGNOSIS] ML API timeout after', timeoutMs, 'ms');
        return NextResponse.json({ 
          error: 'ML API timeout', 
          details: `Request took longer than ${timeoutMs/1000} seconds`
        }, { status: 504 });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[DIAGNOSIS] Error:', error);
    return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
  }
}