/** Secciones del catálogo; ARENERO queda preparada y requiere soporte del PMS para responder. */
export type PublicSection =
  | 'HOSPEDAJE' | 'PASADIA' | 'PASANOCHE' | 'CAMPING' | 'SPA' | 'PASAPORTE' | 'VECINOS' | 'ARENERO';

/** Tarifa publicada para la web. `id` se envía al PMS como `rateId`. */
export type PublicPlan = {
  id: string;
  name: string;
  description: string | null;
  type: 'PER_NIGHT' | 'PER_PERSON' | 'PER_UNIT' | 'FLAT_RATE';
  businessUnit: string;
  webSection: PublicSection;
  webImage: string | null;
  includes: string[];
  currency: string;
  basePrice: number;
  price: number;
  minStay: number | null;
  maxStay: number | null;
  isTaxable: boolean;
  taxRate: number | null;
  priceIncludesTax: boolean;
  roomType: PublicRoomType | null;
};

/** Datos que el PMS publica sobre el tipo de habitación relacionado con el plan. */
export type PublicRoomType = {
  id: string;
  name: string;
  description: string | null;
  maxAdults: number;
  maxChildren: number;
  amenities: string[];
  images: Array<{ url: string }>;
};

/** Cupo de un tipo de habitación para las fechas y ocupación consultadas. */
export type PublicAvailability = PublicRoomType & { available: number };

/** Cotización informativa; el PMS vuelve a calcular el cobro al abrir el checkout. */
export type PublicQuote = { total: number; currency: string; nights: number; rateName: string };

/** Estado devuelto por GET /checkouts/{code}; sus valores son los del contrato PMS. */
export type PublicCheckout = {
  code: string;
  status: 'OPEN' | 'PAID' | 'FAILED' | 'EXPIRED';
  paymentUrl?: string;
  total: number;
  currency: string;
  expiresAt?: string;
  rateName: string;
  guestName?: string;
  checkIn: string;
  checkOut?: string | null;
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
  confirmationNumber?: string | null;
  needsReview?: boolean;
};

/** Solicitud para crear el checkout; no incluye precio porque el PMS lo calcula. */
export type CheckoutDraft = {
  rateId: string;
  checkIn: string;
  checkOut?: string;
  adults: number;
  children: number;
  specialRequests?: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    documentType: 'CC' | 'CE' | 'PA' | 'TI' | 'NIT';
    documentId: string;
  };
};

/** Cliente del navegador para las rutas BFF propias; nunca llama con secretos al PMS. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    // Evita que una caída de red deje la pantalla bloqueada sin fin.
    response = await fetch(path, { ...init, cache: 'no-store', signal: AbortSignal.timeout(12_000) });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error('La consulta está tardando más de lo esperado. Inténtalo de nuevo.');
    }
    throw new Error('No fue posible conectar con el sistema de reservas. Inténtalo de nuevo.');
  }
  const body = await response.json().catch(() => null) as { data?: T; error?: { message?: string } | string } | null;
  if (!response.ok) {
    const message = typeof body?.error === 'object'
      ? body.error.message || 'No se pudo completar la solicitud.'
      : typeof body?.error === 'string'
        ? body.error
        : `La solicitud falló (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return (body && 'data' in body ? body.data : body) as T;
}

/** Convierte un objeto a la petición JSON que esperan las rutas POST del BFF. */
const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// El catálogo casi no cambia durante una navegación. Compartir la lectura evita
// volver a esperar al servidor al pasar de inicio a habitaciones o reservas.
const plansCacheMs = 60_000;
const plansStorageKey = 'paraiso-public-plans-v1';
const plansCache = new Map<string, { expiresAt: number; plans: PublicPlan[] }>();
const plansRequests = new Map<string, Promise<PublicPlan[]>>();

function readStoredPlans(): { savedAt: number; plans: PublicPlan[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.sessionStorage.getItem(plansStorageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { savedAt?: number; plans?: PublicPlan[] };
    if (!Array.isArray(parsed.plans) || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > plansCacheMs) {
      window.sessionStorage.removeItem(plansStorageKey);
      return null;
    }
    return { savedAt: parsed.savedAt, plans: parsed.plans };
  } catch {
    return null;
  }
}

/** Comparte y guarda la lectura completa del catálogo; no almacena cupos ni cotizaciones. */
function fetchAllPlans(): Promise<PublicPlan[]> {
  let pending = plansRequests.get('*');
  if (!pending) {
    pending = request<PublicPlan[]>('/api/public/plans')
      .then((plans) => {
        const savedAt = Date.now();
        plansCache.set('*', { plans, expiresAt: savedAt + plansCacheMs });
        try { window.sessionStorage.setItem(plansStorageKey, JSON.stringify({ savedAt, plans })); } catch { /* La caché en memoria sigue disponible. */ }
        return plans;
      })
      .finally(() => { plansRequests.delete('*'); });
    plansRequests.set('*', pending);
  }
  return pending;
}

/** Lee planes y tarifas; la copia de sesión permite mostrar el catálogo al refrescar. */
export async function getPlans(section?: PublicSection): Promise<PublicPlan[]> {
  const now = Date.now();
  const allPlans = plansCache.get('*');
  if (section && allPlans && allPlans.expiresAt > now) {
    return allPlans.plans.filter((plan) => plan.webSection === section);
  }
  const cacheKey = section || '*';
  const cached = plansCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.plans;

  // Reutiliza una copia reciente de la sesión tras una recarga completa.
  const stored = readStoredPlans();
  if (stored) {
    plansCache.set('*', { plans: stored.plans, expiresAt: stored.savedAt + plansCacheMs });
    return section ? stored.plans.filter((plan) => plan.webSection === section) : stored.plans;
  }

  // Mantén un único catálogo completo durante la visita; las secciones se filtran localmente.
  const plans = await fetchAllPlans();
  const result = section ? plans.filter((plan) => plan.webSection === section) : plans;
  if (section) plansCache.set(section, { plans: result, expiresAt: Date.now() + plansCacheMs });
  return result;
}

/** Consulta cupos para fechas/huéspedes y, si se conoce, el tipo de habitación elegido. */
export const searchAvailability = (query: {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomTypeId?: string;
}) => request<PublicAvailability[]>(`/api/public/availability?${new URLSearchParams(
  Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, String(value)]),
)}`);

/** Obtiene un total informativo; el PMS lo recalcula al crear el checkout. */
export const getQuote = (quote: {
  rateId: string;
  checkIn: string;
  checkOut?: string;
  adults: number;
  children: number;
}) => request<PublicQuote>('/api/public/quote', json(quote));

/** Crea un checkout por medio del BFF; el navegador nunca ve WEB_CHECKOUT_SECRET. */
export const createCheckout = (draft: CheckoutDraft) =>
  request<PublicCheckout>('/api/public/checkouts', json(draft));

/** Consulta el estado real del pago/reserva según el PMS, usando el código de checkout. */
export const getCheckout = (code: string) =>
  request<PublicCheckout>(`/api/public/checkouts/${encodeURIComponent(code)}`);
