import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
import { isValidStay, isValidVisitDate, rateLimit } from '@/lib/server/request-validation';
export const dynamic = 'force-dynamic';
/** BFF de disponibilidad: conserva solo los parámetros definidos por el contrato. */
export async function GET(request: Request) {
  if (!rateLimit(request, 'availability', 30)) return Response.json({ success: false, error: { code: 'PUBLIC_BOOKING', message: 'Demasiadas consultas. Inténtalo de nuevo en un minuto.' } }, { status: 429 });
  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  for (const key of ['checkIn','checkOut','adults','children','roomTypeId']) { const value = incoming.get(key); if (value) params.set(key, value); }
  if (!isValidVisitDate(params.get('checkIn')) || !isValidStay(params.get('checkIn'), params.get('checkOut')) || !/^[1-9]\d{0,2}$/.test(params.get('adults') || '') || !/^\d{1,2}$/.test(params.get('children') || '') || Number(params.get('children')) > 30 || (params.has('roomTypeId') && (params.get('roomTypeId') || '').length > 120)) return validationError('Indica fechas futuras y cantidad de huéspedes válidas.');
  try { return successResponse(await publicApi.availability(params)); }
  catch (error) { return errorResponse(error); }
}
