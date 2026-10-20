import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
// ARENERO queda preparado en la web para cuando el PMS publique esa sección.
const sections = new Set(['HOSPEDAJE','PASADIA','PASANOCHE','CAMPING','SPA','PASAPORTE','VECINOS','ARENERO']);
export const dynamic = 'force-dynamic';
/** BFF del catálogo: valida la sección y reenvía la consulta pública al PMS. */
export async function GET(request: Request) {
  const section = new URL(request.url).searchParams.get('section') || undefined;
  if (section && !sections.has(section)) return validationError('Sección inválida.');
  try { return successResponse(await publicApi.plans(section)); }
  catch (error) { return errorResponse(error); }
}
