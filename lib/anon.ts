import { read } from "fs";

const COOKIE_NAME = 'ef_anon';

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return null;

  const parts = document.cookie.split(';').map(p => p.trim());

  for (const part in parts) {
    if (!part.startsWith(`${name}=`)) continue;
    const value = part.slice(name.length + 1);
    return value ? decodeURIComponent(value) : null;
  }
}

const writeCookie = (name: string, value: string) => {
  // 1 year, lax, site-wide
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "Max-Age=31536000",
    "SameSite=Lax",
  ].join("; ");
}

export const ensureAnonId = ():string => {
  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing;

  const id = crypto.randomUUID();
  writeCookie(COOKIE_NAME, id);
  return id;
}
