import { NextResponse } from 'next/server';
import { PublicApiError } from './public-api';

/** Mantiene el mismo sobre `success/data` y `success:false/error` del contrato PMS. */
export const successResponse = <T>(data: T, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

/** Devuelve solo códigos de error definidos por la API pública del PMS. */
export function errorResponse(error: unknown, fallbackStatus = 502) {
  if (error instanceof PublicApiError) {
    return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
  }
  return NextResponse.json({ success: false, error: { code: 'PUBLIC_BOOKING', message: 'El sistema de reservas no pudo completar la solicitud.' } }, { status: fallbackStatus });
}

/** Respuesta de validación local con el código estándar del contrato. */
export const validationError = (message: string) =>
  NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message } }, { status: 400 });
