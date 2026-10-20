import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse } from '@/lib/server/public-api-response';
export const dynamic = 'force-dynamic';
/** Consulta el estado autoritativo del checkout; no interpreta parámetros de retorno. */
export async function GET(_request: Request, context: { params: { code: string } }) {
  try { return successResponse(await publicApi.checkoutStatus(context.params.code)); }
  catch (error) { return errorResponse(error); }
}
