import 'server-only';
import { getPublicApiConfig } from './config';

export class PublicApiError extends Error {
  constructor(message: string, public status = 502, public code: 'PUBLIC_BOOKING' | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'GONE' = 'PUBLIC_BOOKING') { super(message); }
}
/**
 * Llama al backend del PMS desde el servidor. El secreto se añade solo cuando
 * la operación lo exige (creación del checkout) y nunca se devuelve al cliente.
 */
async function call<T>(path: string, init?: RequestInit, secret = false): Promise<T> {
  const config = getPublicApiConfig();
  if (secret && !config.webCheckoutSecret) throw new PublicApiError('Falta configurar WEB_CHECKOUT_SECRET en el servidor del sitio.', 503, 'PUBLIC_BOOKING');
  let response: Response;
  try {
    response = await fetch(`${config.backendUrl}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
      headers: { 'Content-Type': 'application/json', ...(secret ? { 'X-Web-Secret': config.webCheckoutSecret! } : {}), ...init?.headers },
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new PublicApiError(timedOut
      ? 'El sistema de reservas está tardando más de lo esperado. Inténtalo de nuevo.'
      : 'No fue posible conectar con el sistema de reservas. Inténtalo de nuevo.');
  }
  const result = await response.json().catch(() => null) as { success?: boolean; data?: T; error?: { code?: string; message?: string } } | null;
  if (!response.ok || !result?.success || result.data === undefined) {
    const code = result?.error?.code === 'VALIDATION_ERROR' || result?.error?.code === 'UNAUTHORIZED' || result?.error?.code === 'GONE'
      ? result.error.code as PublicApiError['code']
      : 'PUBLIC_BOOKING';
    const publicMessages: Record<PublicApiError['code'], string> = {
      PUBLIC_BOOKING: 'El sistema de reservas no pudo completar la solicitud. Inténtalo más tarde.',
      VALIDATION_ERROR: 'No se pudieron validar los datos de la reserva. Revísalos e inténtalo de nuevo.',
      UNAUTHORIZED: 'El sistema de reservas no está disponible para esta operación. Contacta al hotel.',
      GONE: 'Esta opción de reserva ya no está disponible. Actualiza la página e inténtalo de nuevo.',
    };
    throw new PublicApiError(publicMessages[code], response.status || 502, code);
  }
  return result.data;
}
export const publicApi = {
  /** Métodos que corresponden uno a uno con los endpoints de api-publica-web.md. */
  plans: (section?: string) => call<unknown[]>(`/plans${section ? `?section=${encodeURIComponent(section)}` : ''}`),
  availability: (query: URLSearchParams) => call<unknown[]>(`/availability?${query.toString()}`),
  quote: (body: unknown) => call<unknown>('/quote', { method: 'POST', body: JSON.stringify(body) }),
  checkout: (body: unknown) => call<unknown>('/checkouts', { method: 'POST', body: JSON.stringify(body) }, true),
  checkoutStatus: (code: string) => call<unknown>(`/checkouts/${encodeURIComponent(code)}`),
};
