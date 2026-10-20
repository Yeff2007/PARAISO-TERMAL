import { publicApi } from '@/lib/server/public-api';
import { errorResponse, successResponse, validationError } from '@/lib/server/public-api-response';
export const dynamic = 'force-dynamic';
const documentTypes = new Set(['CC','CE','PA','TI','NIT']);
/** Valida el titular en el servidor y crea el checkout en el PMS; no crea reservas localmente. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const guest = body?.guest as Record<string, unknown> | undefined;
  if (!body || typeof body.rateId !== 'string' || !body.rateId || typeof body.checkIn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkIn) || (body.checkOut !== undefined && (typeof body.checkOut !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkOut))) || (body.specialRequests !== undefined && typeof body.specialRequests !== 'string') || !Number.isInteger(body.adults) || Number(body.adults) < 1 || !Number.isInteger(body.children) || Number(body.children) < 0 || !guest || !['firstName','lastName','email','documentType','documentId'].every((key) => typeof guest[key] === 'string' && String(guest[key]).trim()) || (guest.phone !== undefined && typeof guest.phone !== 'string') || !documentTypes.has(String(guest.documentType))) return validationError('Completa los datos obligatorios del titular y los huéspedes.');
  const payload = { rateId: body.rateId, checkIn: body.checkIn, ...(typeof body.checkOut === 'string' ? { checkOut: body.checkOut } : {}), adults: body.adults, children: body.children, ...(typeof body.specialRequests === 'string' && body.specialRequests ? { specialRequests: body.specialRequests } : {}), guest: { firstName: guest.firstName, lastName: guest.lastName, email: guest.email, phone: typeof guest.phone === 'string' ? guest.phone : '', documentType: guest.documentType, documentId: guest.documentId } };
  try { return successResponse(await publicApi.checkout(payload), 201); }
  catch (error) { return errorResponse(error); }
}
