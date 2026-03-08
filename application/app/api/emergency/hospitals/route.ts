import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

type CandidateHospital = {
  name: string;
  place_id: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
};

type GooglePlaceResult = {
  name?: string;
  place_id?: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
};

type GooglePlacesNearbyResponse = {
  status?: string;
  error_message?: string;
  results?: GooglePlaceResult[];
};

type GooglePlaceDetailsResponse = {
  status?: string;
  error_message?: string;
  result?: {
    formatted_phone_number?: string;
    international_phone_number?: string;
  };
};

async function fetchHospitalPhoneGoogle(placeId: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  if (!placeId || placeId.startsWith('static-')) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'formatted_phone_number,international_phone_number');
  url.searchParams.set('key', apiKey);

  const resp = await fetch(url.toString(), { method: 'GET' });
  const data: unknown = await resp.json();
  const payload = data as GooglePlaceDetailsResponse;

  if (!resp.ok) {
    console.error('[HOSPITALS] Google Place Details HTTP error:', resp.status, payload);
    return null;
  }

  if (payload.status && payload.status !== 'OK') {
    // Commonly: REQUEST_DENIED, INVALID_REQUEST, NOT_FOUND
    console.error('[HOSPITALS] Google Place Details status:', payload.status, payload.error_message);
    return null;
  }

  return payload.result?.international_phone_number || payload.result?.formatted_phone_number || null;
}

function getStaticHospitalsFallback(lat?: number, lng?: number): CandidateHospital[] {
  const baseLat = lat ?? 25.6099;
  const baseLng = lng ?? 85.1447;

  return [
    {
      name: 'Patna Medical College Hospital',
      place_id: 'static-pmch-1',
      address: 'Patna, Bihar',
      location: { lat: baseLat, lng: baseLng },
      types: ['hospital'],
      rating: 4.1,
      user_ratings_total: 1000,
    },
    {
      name: 'AIIMS Patna',
      place_id: 'static-aiims-1',
      address: 'Phulwarisharif, Patna, Bihar',
      location: { lat: baseLat - 0.0125, lng: baseLng - 0.0567 },
      types: ['hospital'],
      rating: 4.3,
      user_ratings_total: 1500,
    },
    {
      name: 'IGIMS Patna',
      place_id: 'static-igims-1',
      address: 'Sheikhpura, Patna, Bihar',
      location: { lat: baseLat + 0.018, lng: baseLng - 0.006 },
      types: ['hospital'],
      rating: 4.0,
      user_ratings_total: 900,
    },
    {
      name: 'NMCH Patna',
      place_id: 'static-nmch-1',
      address: 'Agam Kuan, Patna, Bihar',
      location: { lat: baseLat + 0.011, lng: baseLng + 0.019 },
      types: ['hospital'],
      rating: 3.8,
      user_ratings_total: 700,
    },
    {
      name: 'Paras HMRI Hospital Patna',
      place_id: 'static-paras-1',
      address: 'Patliputra Industrial Area, Patna, Bihar',
      location: { lat: baseLat - 0.006, lng: baseLng - 0.021 },
      types: ['hospital'],
      rating: 4.2,
      user_ratings_total: 1200,
    },
  ];
}

async function fetchNearbyHospitalsGoogle(params: {
  lat: number;
  lng: number;
  radiusMeters?: number;
}): Promise<CandidateHospital[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  const radiusMeters = params.radiusMeters ?? 30000;

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${params.lat},${params.lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('type', 'hospital');
  url.searchParams.set('key', apiKey);

  const resp = await fetch(url.toString(), { method: 'GET' });
  const data: unknown = await resp.json();

  if (!resp.ok) {
    console.error('[HOSPITALS] Google Places HTTP error:', resp.status, data);
    return [];
  }

  const payload = data as GooglePlacesNearbyResponse;
  if (payload.status && payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS') {
    console.error('[HOSPITALS] Google Places API status:', payload.status, payload.error_message);
    return [];
  }

  const results = Array.isArray(payload.results) ? payload.results : [];
  return results
    .map((r) => ({
      name: r.name ?? 'Unknown',
      place_id: r.place_id ?? '',
      address: r.vicinity ?? r.formatted_address ?? 'Unknown',
      location: {
        lat: r.geometry?.location?.lat ?? NaN,
        lng: r.geometry?.location?.lng ?? NaN,
      },
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      types: r.types,
    }))
    .filter(
      (h: CandidateHospital) =>
        h.place_id.length > 0 && Number.isFinite(h.location.lat) && Number.isFinite(h.location.lng)
    );
}

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

    const coords = payload?.logistics?.coordinates;
    const lat = typeof coords?.latitude === 'number' ? coords.latitude : undefined;
    const lng = typeof coords?.longitude === 'number' ? coords.longitude : undefined;

    const radiusMetersFromPayload =
      typeof payload?.logistics?.radius_meters === 'number'
        ? payload.logistics.radius_meters
        : typeof payload?.logistics?.radius_km === 'number'
          ? payload.logistics.radius_km * 1000
          : 30000;

    let candidateHospitals: CandidateHospital[] = [];
    if (typeof lat === 'number' && typeof lng === 'number') {
      candidateHospitals = await fetchNearbyHospitalsGoogle({ lat, lng, radiusMeters: radiusMetersFromPayload });
    }
    if (candidateHospitals.length === 0) {
      candidateHospitals = getStaticHospitalsFallback(lat, lng);
    }

    const mlPayload = {
      ...payload,
      candidate_hospitals: candidateHospitals,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlPayload),
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

      // Optional enrichment: add phone numbers for recommended hospitals.
      // This keeps the API key server-side and makes it easy for the UI to show a tel: link.
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const recs = (result as { hospital_list?: { recommended_hospitals?: Array<Record<string, unknown>> } })
        ?.hospital_list?.recommended_hospitals;
      if (apiKey && Array.isArray(recs) && recs.length > 0) {
        await Promise.all(
          recs.slice(0, 5).map(async (h) => {
            const placeId = typeof h.place_id === 'string' ? h.place_id : '';
            if (!placeId) return;
            if (typeof h.phone === 'string' && h.phone.length > 0) return;
            if (typeof h.formatted_phone_number === 'string' && h.formatted_phone_number.length > 0) return;

            const phone = await fetchHospitalPhoneGoogle(placeId);
            if (phone) {
              h.formatted_phone_number = phone;
            }
          })
        );
      }

      return NextResponse.json(result);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[HOSPITALS] ML API timeout');
        return NextResponse.json(
          { error: 'ML API timeout', details: 'Request took longer than 60 seconds' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('[HOSPITALS] Error:', error);
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
