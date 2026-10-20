import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
export const dynamic = 'force-dynamic';
/** Valida huéspedes y tarifa antes de solicitar al PMS una cotización no vinculante. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.rateId !== 'string' || !body.rateId || typeof body.checkIn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkIn) || (body.checkOut !== undefined && (typeof body.checkOut !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkOut))) || !Number.isInteger(body.adults) || !Number.isInteger(body.children) || Number(body.adults) < 1 || Number(body.children) < 0) return validationError('Los datos para cotizar están incompletos o tienen un formato inválido.');
  const quote = { rateId: body.rateId, checkIn: body.checkIn, ...(typeof body.checkOut === 'string' ? { checkOut: body.checkOut } : {}), adults: body.adults, children: body.children };
  try { return successResponse(await publicApi.quote(quote)); }
  catch (error) { return errorResponse(error); }
}
