export function sanitizeAuthNextPath(
  nextParam: string | null | undefined,
  fallback = '/workspace'
): string {
  if (!nextParam) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(nextParam);
  } catch {
    return fallback;
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) return fallback;

  const guardOrigin = 'https://ubuntu-town.invalid';
  const resolved = new URL(decoded, guardOrigin);
  if (resolved.origin !== guardOrigin) return fallback;

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

export function buildRecoveryRedirectTo(
  siteOrigin: string,
  next = '/update-password'
): string {
  const url = new URL('/auth/recover', siteOrigin);
  url.searchParams.set('next', sanitizeAuthNextPath(next, '/update-password'));
  return url.toString();
}
