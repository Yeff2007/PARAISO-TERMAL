import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
import { isValidDate, isValidStay, isValidVisitDate, readJsonObject, rateLimit, validGuestText } from '@/lib/server/request-validation';
export const dynamic = 'force-dynamic';
const documentTypes = new Set(['CC','CE','PA','TI','NIT']);
/** Valida el titular en el servidor y crea el checkout en el PMS; no crea reservas localmente. */
export async function POST(request: Request) {
  if (!rateLimit(request, 'checkout', 5)) return Response.json({ success: false, error: { code: 'PUBLIC_BOOKING', message: 'Demasiados intentos de reserva. Inténtalo de nuevo en un minuto.' } }, { status: 429 });
  let body: Record<string, unknown> | null;
  try { body = await readJsonObject(request); } catch (error) { return errorResponse(error); }
  const guest = body?.guest as Record<string, unknown> | undefined;
  const validDates = isValidVisitDate(body?.checkIn) && (body?.checkOut === undefined ? isValidDate(body.checkIn) : isValidStay(body.checkIn, body.checkOut));
  const validEmail = typeof guest?.email === 'string' && guest.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email);
  if (!body || !validGuestText(body.rateId, 120) || !validDates || (body.specialRequests !== undefined && (typeof body.specialRequests !== 'string' || body.specialRequests.length > 2000)) || !Number.isInteger(body.adults) || Number(body.adults) < 1 || Number(body.adults) > 99 || !Number.isInteger(body.children) || Number(body.children) < 0 || Number(body.children) > 30 || !guest || !validGuestText(guest.firstName, 100) || !validGuestText(guest.lastName, 100) || !validEmail || !documentTypes.has(String(guest.documentType)) || !validGuestText(guest.documentId, 40) || (guest.phone !== undefined && (typeof guest.phone !== 'string' || guest.phone.length > 40))) return validationError('Completa los datos obligatorios del titular y los huéspedes.');
  const payload = { rateId: body.rateId, checkIn: body.checkIn, ...(typeof body.checkOut === 'string' ? { checkOut: body.checkOut } : {}), adults: body.adults, children: body.children, ...(typeof body.specialRequests === 'string' && body.specialRequests ? { specialRequests: body.specialRequests } : {}), guest: { firstName: guest.firstName, lastName: guest.lastName, email: guest.email, phone: typeof guest.phone === 'string' ? guest.phone : '', documentType: guest.documentType, documentId: guest.documentId } };
  try {
    const result = await publicApi.checkout(payload) as Record<string, unknown>;
    if (typeof result?.paymentUrl !== 'string') return errorResponse(new Error('Invalid checkout payment URL'));
    const paymentUrl = new URL(result.paymentUrl);
    if (paymentUrl.protocol !== 'https:' || paymentUrl.username || paymentUrl.password) return errorResponse(new Error('Invalid checkout payment URL'));
    return successResponse(result, 201);
  }
  catch (error) { return errorResponse(error); }
}
