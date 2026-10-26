export interface JwtClaims {
  sub?: string;
  userId?: number;
  iat?: number;
  exp?: number;
}

/**
 * Décode (sans vérifier la signature : c'est le rôle du serveur) le payload d'un JWT.
 * Le backend y place : sub (email), userId, iat, exp. Il n'y a pas de rôle.
 */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 10): boolean {
  const exp = decodeJwt(token)?.exp;
  if (!exp) return true;
  return Date.now() / 1000 >= exp - skewSeconds;
}
