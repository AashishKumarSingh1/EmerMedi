import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Fetch diagnosis history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const emergencyOnly = searchParams.get('emergencyOnly') === 'true';

    const db = await getDatabase();
    const query: any = { userId: session.userId };
    
    if (emergencyOnly) {
      query.isEmergency = true;
    }

    const history = await db
      .collection('diagnosis_history')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching diagnosis history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// POST - Save diagnosis result
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, result, fileUrl, fileName } = body;

    if (!type || !result) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDatabase();
    const diagnosisRecord = {
      userId: session.userId,
      type, // 'audio' or 'image'
      result, // Full diagnosis result JSON
      fileUrl, // S3 URL
      fileName,
      isEmergency: result.isEmergency || false,
      createdAt: new Date(),
    };

    const insertResult = await db.collection('diagnosis_history').insertOne(diagnosisRecord);

    return NextResponse.json({
      success: true,
      id: insertResult.insertedId,
      record: diagnosisRecord,
    });
  } catch (error: any) {
    console.error('Error saving diagnosis:', error);
    return NextResponse.json({ error: 'Failed to save diagnosis' }, { status: 500 });
  }
}

// DELETE - Delete a diagnosis record
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing diagnosis ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection('diagnosis_history').deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Diagnosis not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting diagnosis:', error);
    return NextResponse.json({ error: 'Failed to delete diagnosis' }, { status: 500 });
  }
}
