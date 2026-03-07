import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { encryptData, decryptData, hashSensitiveId } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const profile = await db.collection('profiles').findOne({ userId: session.userId });

    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const decryptedProfile = {
      ...profile,
      name: profile.name ? decryptData(profile.name) : '',
      dob: profile.dob ? decryptData(profile.dob) : '',
      gender: profile.gender ? decryptData(profile.gender) : '',
      bloodGroup: profile.bloodGroup ? decryptData(profile.bloodGroup) : '',
      phoneNumber: profile.phoneNumber ? decryptData(profile.phoneNumber) : '',
      emergencyContact1: profile.emergencyContact1 ? decryptData(profile.emergencyContact1) : '',
      emergencyContact2: profile.emergencyContact2 ? decryptData(profile.emergencyContact2) : '',
      aadharCard: profile.aadharCard ? '****-****-' + decryptData(profile.aadharCard).slice(-4) : '',
      ayushmanCard: profile.ayushmanCard ? decryptData(profile.ayushmanCard) : '',
      profileImage: profile.profileImage || '',
      familyRelations: profile.familyRelations ? profile.familyRelations.map((rel: any) => ({
        name: decryptData(rel.name),
        relation: decryptData(rel.relation),
        mobile: decryptData(rel.mobile),
        _id: rel._id,
      })) : [],
    };

    return NextResponse.json({ profile: decryptedProfile }, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
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
    const { name, dob, gender, bloodGroup, phoneNumber, emergencyContact1, emergencyContact2, aadharCard, ayushmanCard, familyRelations, profileImage } = data;

    const encryptedProfile = {
      userId: session.userId,
      name: name ? encryptData(name) : '',
      dob: dob ? encryptData(dob) : '',
      gender: gender ? encryptData(gender) : '',
      bloodGroup: bloodGroup ? encryptData(bloodGroup) : '',
      phoneNumber: phoneNumber ? encryptData(phoneNumber) : '',
      emergencyContact1: emergencyContact1 ? encryptData(emergencyContact1) : '',
      emergencyContact2: emergencyContact2 ? encryptData(emergencyContact2) : '',
      aadharCard: aadharCard ? encryptData(aadharCard) : '',
      aadharHash: aadharCard ? hashSensitiveId(aadharCard) : '',
      ayushmanCard: ayushmanCard ? encryptData(ayushmanCard) : '',
      profileImage: profileImage || '',
      familyRelations: familyRelations ? familyRelations.map((rel: any) => ({
        _id: rel._id || new ObjectId().toString(),
        name: encryptData(rel.name),
        relation: encryptData(rel.relation),
        mobile: encryptData(rel.mobile),
      })) : [],
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    await db.collection('profiles').updateOne(
      { userId: session.userId },
      { $set: encryptedProfile },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
