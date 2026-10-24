// Where to go after login/register. Only same-site paths are allowed (no open redirect).
export function getRedirectTarget(query, fallback = '/') {
  const target = Array.isArray(query?.redirect) ? query.redirect[0] : query?.redirect;
  if (typeof target !== 'string') return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/auth')) return fallback;
  return target;
}
