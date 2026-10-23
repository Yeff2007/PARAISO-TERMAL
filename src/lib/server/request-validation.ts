import { PublicApiError } from './public-api';
import { isValidDate, isValidStay, isValidVisitDate } from './validation-core';
export { isValidDate, isValidStay, isValidVisitDate } from './validation-core';

export async function readJsonObject(request: Request, maxBytes = 16_384): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) throw new PublicApiError('La solicitud es demasiado grande.', 413, 'VALIDATION_ERROR');
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new PublicApiError('La solicitud es demasiado grande.', 413, 'VALIDATION_ERROR');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let raw: string;
  try { raw = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return null; }
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
}

type RateEntry = { count: number; resetAt: number };
const buckets = new Map<string, RateEntry>();

/** Límite best-effort por proceso; el proxy de hosting debe aplicar el límite distribuido. */
export function rateLimit(request: Request, key: string, limit: number, windowMs = 60_000): boolean {
  const configuredHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.toLowerCase();
  const trustedValue = configuredHeader && /^[a-z0-9-]+$/.test(configuredHeader)
    ? request.headers.get(configuredHeader)?.trim()
    : undefined;
  // Without an ingress header that is stripped and rewritten by the proxy,
  // apply a shared per-route bucket instead of trusting a client-supplied IP.
  const address = trustedValue && trustedValue.length <= 80 ? trustedValue : 'shared';
  const now = Date.now();
  for (const [id, entry] of buckets) if (entry.resetAt <= now) buckets.delete(id);
  const id = `${key}:${address}`;
  const entry = buckets.get(id);
  if (!entry && buckets.size >= 10_000) return false;
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
