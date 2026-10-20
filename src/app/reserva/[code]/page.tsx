'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, CircleAlert, X } from 'lucide-react';
import SiteHeader from '../../../components/SiteHeader';
import { getCheckout, type PublicCheckout } from '../../../lib/api';

export default function CheckoutResultPage() {
  const { code } = useParams<{ code: string }>(); const [checkout, setCheckout] = useState<PublicCheckout | null>(null); const [error, setError] = useState('');
  useEffect(() => {
    // El retorno de Wompi no confirma el pago: consultar al PMS y repetir solo en OPEN/error temporal.
    let active = true; let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => { try { const status = await getCheckout(code); if (!active) return; setCheckout(status); setError(''); if (status.status === 'OPEN') timer = setTimeout(poll, 4000); } catch (e) { if (!active) return; setError(e instanceof Error ? e.message : 'No se pudo consultar el estado.'); timer = setTimeout(poll, 6000); } };
    void poll(); return () => { active = false; if (timer) clearTimeout(timer); };
  }, [code]);
  const review = checkout?.status === 'PAID' && checkout.needsReview;
  return <main className="inner-page reserve-page"><SiteHeader/><section className="reserve-shell checkout-result"><Link href="/"><ArrowLeft size={14}/> Volver al inicio</Link><span className="eyebrow">ESTADO DEL CHECKOUT</span>{!checkout && <><Clock3/><h1>Consultando tu pago</h1><p>{error || 'Estamos verificando el resultado del pago. El regreso desde Wompi no confirma por sí solo la reserva.'}</p></>}
    {checkout?.status === 'OPEN' && <><Clock3/><h1>Pago pendiente</h1><p>El checkout sigue abierto. Esta página seguirá consultando el estado actualizado del pago.</p><small>Vence: {checkout.expiresAt ? new Date(checkout.expiresAt).toLocaleString('es-CO') : 'en un máximo de dos horas'}</small></>}
    {checkout?.status === 'PAID' && !review && <><Check/><h1>Pago aprobado</h1><p>El pago fue aprobado y la reserva quedó confirmada.</p>{checkout.confirmationNumber && <div className="confirmation-reference"><span>Número de reserva</span><strong>{checkout.confirmationNumber}</strong></div>}</>}
    {review && <><CircleAlert/><h1>Pago recibido, confirmación pendiente</h1><p>El pago fue recibido, pero el hotel debe revisar y confirmar la disponibilidad antes de dar la reserva por lista.</p></>}
    {checkout?.status === 'FAILED' && <><X/><h1>Pago no aprobado</h1><p>El pago fue rechazado, anulado o no pudo completarse. No se creó una reserva.</p><Link className="forest-button" href="/reservar">Intentar otra vez</Link></>}
    {checkout?.status === 'EXPIRED' && <><Clock3/><h1>Checkout vencido</h1><p>El plazo de pago terminó y no se confirmó la reserva.</p><Link className="forest-button" href="/reservar">Iniciar una nueva reserva</Link></>}
    {error && checkout?.status === 'OPEN' && <p role="status">{error} Reintentando consulta…</p>}
    {checkout && <div className="confirmation-reference"><span>{checkout.rateName} · {checkout.checkIn}{checkout.checkOut ? ` al ${checkout.checkOut}` : ''}</span><strong>{new Intl.NumberFormat('es-CO',{style:'currency',currency:checkout.currency,maximumFractionDigits:0}).format(checkout.total)}</strong></div>}
  </section><footer className="inner-footer"><Link href="/"><ArrowLeft size={15}/> Volver a Paraíso Termal</Link></footer></main>;
}
