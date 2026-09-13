import { COOKIE_NAME, ownerCookieValue } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const secret = process.env.APP_SHARED_SECRET;
  if (!secret) return Response.json({ error: 'server not configured' }, { status: 500 });
  if (password !== secret) return Response.json({ error: 'senha errada' }, { status: 401 });

  const res = Response.json({ ok: true });
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${ownerCookieValue()}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 365}`
  );
  return res;
}
