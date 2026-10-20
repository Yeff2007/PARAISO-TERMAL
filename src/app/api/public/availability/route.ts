import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
export const dynamic = 'force-dynamic';
/** BFF de disponibilidad: conserva solo los parámetros definidos por el contrato. */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  for (const key of ['checkIn','checkOut','adults','children','roomTypeId']) { const value = incoming.get(key); if (value) params.set(key, value); }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.get('checkIn') || '') || !/^\d{4}-\d{2}-\d{2}$/.test(params.get('checkOut') || '') || !/^([1-9]\d*)$/.test(params.get('adults') || '') || !/^\d+$/.test(params.get('children') || '')) return validationError('Indica fechas y cantidad de huéspedes válidas.');
  try { return successResponse(await publicApi.availability(params)); }
  catch (error) { return errorResponse(error); }
}
