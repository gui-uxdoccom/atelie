import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Deliberately minimal: she is the only person who ever signs in.
 *
 * The point of this is NOT to be a hardened auth system — it's to stop the
 * Replicate token being spendable by anyone who finds the URL. The token
 * itself never leaves the server either way, which is the property that
 * actually matters. Swap for Supabase Auth the day a second person needs in.
 */
const COOKIE = 'atelie_owner';

const sign = (secret) =>
  crypto.createHmac('sha256', secret).update('owner').digest('hex');

export function ownerCookieValue() {
  return sign(process.env.APP_SHARED_SECRET ?? '');
}

export function isOwner() {
  const secret = process.env.APP_SHARED_SECRET;
  if (!secret) return false;
  const got = cookies().get(COOKIE)?.value;
  if (!got) return false;
  const want = sign(secret);
  // constant-time compare; lengths match by construction (hex sha256)
  return got.length === want.length &&
    crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export const COOKIE_NAME = COOKIE;
