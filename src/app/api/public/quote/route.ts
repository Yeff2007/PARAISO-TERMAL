import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
import { isValidDate, isValidStay, isValidVisitDate, readJsonObject, rateLimit, validGuestText } from '@/lib/server/request-validation';
export const dynamic = 'force-dynamic';
/** Valida huéspedes y tarifa antes de solicitar al PMS una cotización no vinculante. */
export async function POST(request: Request) {
  if (!rateLimit(request, 'quote', 20)) return Response.json({ success: false, error: { code: 'PUBLIC_BOOKING', message: 'Demasiadas cotizaciones. Inténtalo de nuevo en un minuto.' } }, { status: 429 });
  let body: Record<string, unknown> | null;
  try { body = await readJsonObject(request); } catch (error) { return errorResponse(error); }
  const validDates = isValidVisitDate(body?.checkIn) && (body?.checkOut === undefined ? isValidDate(body.checkIn) : isValidStay(body.checkIn, body.checkOut));
  if (!body || !validGuestText(body.rateId, 120) || !validDates || !Number.isInteger(body.adults) || !Number.isInteger(body.children) || Number(body.adults) < 1 || Number(body.adults) > 99 || Number(body.children) < 0 || Number(body.children) > 30) return validationError('Los datos para cotizar están incompletos o tienen un formato inválido.');
  const quote = { rateId: body.rateId, checkIn: body.checkIn, ...(typeof body.checkOut === 'string' ? { checkOut: body.checkOut } : {}), adults: body.adults, children: body.children };
  try { return successResponse(await publicApi.quote(quote)); }
  catch (error) { return errorResponse(error); }
}
