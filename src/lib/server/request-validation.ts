import { PublicApiError } from './public-api';
import { isValidDate, isValidStay, isValidVisitDate } from './validation-core';
export { isValidDate, isValidStay, isValidVisitDate } from './validation-core';

export async function readJsonObject(request: Request, maxBytes = 16_384): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) throw new PublicApiError('La solicitud es demasiado grande.', 413, 'VALIDATION_ERROR');
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new PublicApiError('La solicitud es demasiado grande.', 413, 'VALIDATION_ERROR');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
}

type RateEntry = { count: number; resetAt: number };
const buckets = new Map<string, RateEntry>();

/** Límite best-effort por proceso; el proxy de hosting debe aplicar el límite distribuido. */
export function rateLimit(request: Request, key: string, limit: number, windowMs = 60_000): boolean {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded && forwarded.length < 80 ? forwarded : 'unknown';
  const now = Date.now();
  for (const [id, entry] of buckets) if (entry.resetAt <= now) buckets.delete(id);
  const id = `${key}:${address}`;
  const entry = buckets.get(id);
  if (!entry || entry.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function validGuestText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}
