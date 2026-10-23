import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse } from '@/lib/server/public-api-response';
import { rateLimit } from '@/lib/server/request-validation';
export const dynamic = 'force-dynamic';
/** Consulta el estado autoritativo del checkout; no interpreta parámetros de retorno. */
export async function GET(request: Request, context: { params: { code: string } }) {
  if (!rateLimit(request, 'checkout-status', 30)) return Response.json({ success: false, error: { code: 'PUBLIC_BOOKING', message: 'Demasiadas consultas de estado. Inténtalo de nuevo en un minuto.' } }, { status: 429 });
  if (!context.params.code || context.params.code.length > 120 || /[\\/\s]/.test(context.params.code)) {
    return Response.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El código de checkout no es válido.' } }, { status: 400 });
  }
  try { return successResponse(await publicApi.checkoutStatus(context.params.code)); }
  catch (error) { return errorResponse(error); }
}
