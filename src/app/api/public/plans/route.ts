import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
import { rateLimit } from '@/lib/server/request-validation';
// ARENERO queda preparado en la web para cuando el PMS publique esa sección.
const sections = new Set(['HOSPEDAJE','PASADIA','PASANOCHE','CAMPING','SPA','PASAPORTE','VECINOS','ARENERO']);
export const dynamic = 'force-dynamic';
/** BFF del catálogo: valida la sección y reenvía la consulta pública al PMS. */
export async function GET(request: Request) {
  if (!rateLimit(request, 'plans', 60)) return Response.json({ success: false, error: { code: 'PUBLIC_BOOKING', message: 'Demasiadas consultas. Inténtalo de nuevo en un minuto.' } }, { status: 429 });
  const section = new URL(request.url).searchParams.get('section') || undefined;
  if (section && !sections.has(section)) return validationError('Sección inválida.');
  try { return successResponse(await publicApi.plans(section)); }
  catch (error) { return errorResponse(error); }
}
