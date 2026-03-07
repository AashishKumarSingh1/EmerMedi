import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { encryptData, decryptData } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const records = await db.collection('medical_records').findOne({ userId: session.userId });

    if (!records) {
      return NextResponse.json({ records: null }, { status: 200 });
    }

    const decryptedRecords = {
      ...records,
      oldDiseases: records.oldDiseases ? records.oldDiseases.map((d: any) => ({
        _id: d._id,
        name: decryptData(d.name),
        diagnosedDate: decryptData(d.diagnosedDate),
        notes: d.notes ? decryptData(d.notes) : '',
      })) : [],
      currentDiseases: records.currentDiseases ? records.currentDiseases.map((d: any) => ({
        _id: d._id,
        name: decryptData(d.name),
        stage: decryptData(d.stage),
        diagnosedDate: decryptData(d.diagnosedDate),
        notes: d.notes ? decryptData(d.notes) : '',
      })) : [],
      ongoingTreatments: records.ongoingTreatments ? records.ongoingTreatments.map((t: any) => ({
        _id: t._id,
        name: decryptData(t.name),
        startDate: decryptData(t.startDate),
        doctor: decryptData(t.doctor),
        hospital: decryptData(t.hospital),
        notes: t.notes ? decryptData(t.notes) : '',
      })) : [],
      currentMedicines: records.currentMedicines ? records.currentMedicines.map((m: any) => ({
        _id: m._id,
        name: decryptData(m.name),
        dosage: decryptData(m.dosage),
        frequency: decryptData(m.frequency),
        prescribedBy: decryptData(m.prescribedBy),
        startDate: decryptData(m.startDate),
        notes: m.notes ? decryptData(m.notes) : '',
      })) : [],
      recentSurgeries: records.recentSurgeries ? records.recentSurgeries.map((s: any) => ({
        _id: s._id,
        name: decryptData(s.name),
        date: decryptData(s.date),
        hospital: decryptData(s.hospital),
        surgeon: decryptData(s.surgeon),
        notes: s.notes ? decryptData(s.notes) : '',
      })) : [],
    };

    return NextResponse.json({ records: decryptedRecords }, { status: 200 });
  } catch (error) {
    console.error('Medical records fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { oldDiseases, currentDiseases, ongoingTreatments, currentMedicines, recentSurgeries } = data;

    const encryptedRecords = {
      userId: session.userId,
      oldDiseases: oldDiseases ? oldDiseases.map((d: any) => ({
        _id: d._id,
        name: encryptData(d.name),
        diagnosedDate: encryptData(d.diagnosedDate),
        notes: d.notes ? encryptData(d.notes) : '',
      })) : [],
      currentDiseases: currentDiseases ? currentDiseases.map((d: any) => ({
        _id: d._id,
        name: encryptData(d.name),
        stage: encryptData(d.stage),
        diagnosedDate: encryptData(d.diagnosedDate),
        notes: d.notes ? encryptData(d.notes) : '',
      })) : [],
      ongoingTreatments: ongoingTreatments ? ongoingTreatments.map((t: any) => ({
        _id: t._id,
        name: encryptData(t.name),
        startDate: encryptData(t.startDate),
        doctor: encryptData(t.doctor),
        hospital: encryptData(t.hospital),
        notes: t.notes ? encryptData(t.notes) : '',
      })) : [],
      currentMedicines: currentMedicines ? currentMedicines.map((m: any) => ({
        _id: m._id,
        name: encryptData(m.name),
        dosage: encryptData(m.dosage),
        frequency: encryptData(m.frequency),
        prescribedBy: encryptData(m.prescribedBy),
        startDate: encryptData(m.startDate),
        notes: m.notes ? encryptData(m.notes) : '',
      })) : [],
      recentSurgeries: recentSurgeries ? recentSurgeries.map((s: any) => ({
        _id: s._id,
        name: encryptData(s.name),
        date: encryptData(s.date),
        hospital: encryptData(s.hospital),
        surgeon: encryptData(s.surgeon),
        notes: s.notes ? encryptData(s.notes) : '',
      })) : [],
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    await db.collection('medical_records').updateOne(
      { userId: session.userId },
      { $set: encryptedRecords },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Medical records updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Medical records update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
