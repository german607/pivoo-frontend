import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get('authorization');

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const matchesUrl = process.env.NEXT_PUBLIC_MATCHES_API_URL;
  const serviceKey = process.env.SERVICE_KEY;

  if (!matchesUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing env vars: NEXT_PUBLIC_MATCHES_API_URL or SERVICE_KEY' }, { status: 500 });
  }

  const res = await fetch(`${matchesUrl}/api/v1/matches/expire-past`, {
    method: 'PATCH',
    headers: { 'x-service-key': serviceKey },
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: body }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, ...data });
}
