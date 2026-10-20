'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Users } from 'lucide-react';
import { createCheckout, getPlans, getQuote, searchAvailability, type PublicAvailability, type PublicPlan, type PublicQuote, type PublicSection } from '../../lib/api';
import SiteHeader from '../../components/SiteHeader';

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const nextDay = (value: string) => { const date = new Date(`${value || today()}T00:00:00`); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); };
const sections: Array<{ id: PublicSection; label: string }> = [{ id: 'HOSPEDAJE', label: 'Hospedaje' }, { id: 'PASADIA', label: 'Pasadía' }, { id: 'PASANOCHE', label: 'Pasanoche' }, { id: 'CAMPING', label: 'Camping' }, { id: 'SPA', label: 'Spa' }, { id: 'PASAPORTE', label: 'Pasaportes' }, { id: 'VECINOS', label: 'Vecinos' }, { id: 'ARENERO', label: 'Arenero para niños' }];
const money = (amount: number, currency = 'COP') => new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
// Spa, pasadía, camping y pasaportes usan una fecha de visita sin consultar habitaciones.
const lodging = (plan: PublicPlan) => !(['SPA', 'PASADIA', 'CAMPING', 'PASAPORTE', 'VECINOS', 'ARENERO'] as PublicSection[]).includes(plan.webSection)
  && (plan.type === 'PER_NIGHT' || plan.type === 'PER_PERSON');

export default function ReservePage() {
  const [section, setSection] = useState<PublicSection>('HOSPEDAJE');
  const [plans, setPlans] = useState<PublicPlan[]>([]); const [selected, setSelected] = useState<PublicPlan | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('');
  const [checkIn, setCheckIn] = useState(''); const [checkOut, setCheckOut] = useState(''); const [adults, setAdults] = useState('2'); const [children, setChildren] = useState('0');
  const [availability, setAvailability] = useState<PublicAvailability | null>(null); const [quote, setQuote] = useState<PublicQuote | null>(null); const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState('');
  const appliedInitialQuery = useRef(false);
  useEffect(() => {
    // Aplica el enlace directo al plan antes de consultar, para no hacer una petición extra a otra sección.
    if (!appliedInitialQuery.current) {
      appliedInitialQuery.current = true;
      const params = new URLSearchParams(window.location.search);
      const requestedSection = params.get('section');
      setCheckIn(params.get('checkIn') || ''); setCheckOut(params.get('checkOut') || '');
      setAdults(params.get('adults') || '2'); setChildren(params.get('children') || '0');
      if (sections.some((item) => item.id === requestedSection) && requestedSection !== section) {
        setSection(requestedSection as PublicSection);
        return;
      }
    }
    setPlans([]); setSelected(null); setAvailability(null); setQuote(null); setStep(1); setLoading(true);
    void getPlans(section)
      .then(async (items) => {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('plan');
        const requestedRoomTypeId = params.get('roomTypeId');
        const offeredPlans = requestedRoomTypeId && section === 'HOSPEDAJE'
          ? items.filter((item) => item.roomType?.id === requestedRoomTypeId)
          : items;
        setPlans(offeredPlans);
        const plan = offeredPlans.find((item) => item.id === requested) || null;
        if (plan) { setSelected(plan); setSelectedRoomTypeId(plan.roomType?.id || ''); }
        const quoteCheckIn = params.get('checkIn') || '';
        const quoteCheckOut = params.get('checkOut') || '';
        const quoteAdults = Number(params.get('adults') || 2);
        const quoteChildren = Number(params.get('children') || 0);
        if (!plan || !quoteCheckIn || (lodging(plan) && !quoteCheckOut)) return;
        try {
          if (lodging(plan)) {
            if (!plan.roomType) throw new Error('Este plan de hospedaje no tiene un tipo de habitación publicado.');
            const options = await searchAvailability({ checkIn: quoteCheckIn, checkOut: quoteCheckOut, adults: quoteAdults, children: quoteChildren, roomTypeId: plan.roomType.id });
            const match = options.find((item) => item.id === plan.roomType?.id && item.available > 0);
            if (!match) throw new Error('No hay habitaciones disponibles para esas fechas y huéspedes.');
            setAvailability(match);
          }
          const result = await getQuote({ rateId: plan.id, checkIn: quoteCheckIn, ...(lodging(plan) ? { checkOut: quoteCheckOut } : {}), adults: quoteAdults, children: quoteChildren });
          setQuote(result); setStep(2);
        } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo consultar disponibilidad y precio.'); }
      })
      .catch((error: unknown) => setMessage(section === 'ARENERO'
        ? 'La sección del arenero está preparada. El PMS debe habilitar ARENERO y publicar sus planes antes de mostrar cupos o tarifas.'
        : error instanceof Error ? error.message : 'No se pudieron cargar los planes.'))
      .finally(() => setLoading(false));
  }, [section]);
  const isLodging = selected ? lodging(selected) : section === 'HOSPEDAJE';
  const canQuote = Boolean(selected && checkIn && (!isLodging || (checkOut && checkOut > checkIn)) && (!isLodging || (availability && availability.available > 0)));
  const dateFields = useMemo(() => <><label><span><CalendarDays size={15}/> Fecha de visita</span><input type="date" min={today()} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setQuote(null); setAvailability(null); }} required/></label>{isLodging && <label><span><CalendarDays size={15}/> Salida</span><input type="date" min={nextDay(checkIn)} value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setQuote(null); setAvailability(null); }} required/></label>}<label><span><Users size={15}/> Adultos</span><select value={adults} onChange={(e) => { setAdults(e.target.value); setAvailability(null); setQuote(null); }}>{[1,2,3,4,5,6].map((n)=><option key={n} value={n}>{n} {n===1?'adulto':'adultos'}</option>)}</select></label><label><span><Users size={15}/> Niños</span><select value={children} onChange={(e) => { setChildren(e.target.value); setAvailability(null); setQuote(null); }}>{[0,1,2,3,4].map((n)=><option key={n} value={n}>{n===0?'Sin niños':`${n} ${n===1?'niño':'niños'}`}</option>)}</select></label></>, [adults, children, checkIn, checkOut, isLodging]);
  /** Sigue el flujo de la API: primero confirma cupo y luego solicita la cotización. */
  async function getPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; setMessage(''); setLoading(true); setQuote(null);
    try {
      if (isLodging) {
        if (!selected.roomType || !selectedRoomTypeId) throw new Error('Selecciona una habitación para este plan.');
        const options = await searchAvailability({ checkIn, checkOut, adults: Number(adults), children: Number(children), roomTypeId: selectedRoomTypeId });
        const match = options.find((item) => item.id === selectedRoomTypeId && item.available > 0);
        if (!match) { setAvailability(null); throw new Error('No hay habitaciones disponibles para esas fechas y huéspedes.'); }
        setAvailability(match);
      }
      const result = await getQuote({ rateId: selected.id, checkIn, ...(isLodging ? { checkOut } : {}), adults: Number(adults), children: Number(children) });
      setQuote(result); setStep(2);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cotizar este plan.'); }
    finally { setLoading(false); }
  }
  /** Envía los datos al BFF; el PMS calcula el total final y entrega el link de pago. */
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || !quote) return; const form = new FormData(event.currentTarget); setMessage('Creando el checkout seguro…'); setLoading(true);
    try {
      const result = await createCheckout({ rateId: selected.id, checkIn, ...(isLodging ? { checkOut } : {}), adults: Number(adults), children: Number(children), specialRequests: String(form.get('specialRequests') || ''), guest: { firstName: String(form.get('firstName')), lastName: String(form.get('lastName')), email: String(form.get('email')), phone: String(form.get('phone')), documentType: String(form.get('documentType')) as 'CC'|'CE'|'PA'|'TI'|'NIT', documentId: String(form.get('documentId')) } });
      if (!result.paymentUrl) throw new Error('El sistema no devolvió el enlace de pago.'); window.location.assign(result.paymentUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo iniciar el checkout.'); setLoading(false); }
  }
  return <main className="inner-page reserve-page"><SiteHeader actionHref="/habitaciones" actionLabel="Ver habitaciones"/><section className="reserve-shell"><div className="reserve-top"><Link href="/"><ArrowLeft size={14}/> Volver al inicio</Link><span className="eyebrow">TU PRÓXIMA ESCAPADA</span><h1>{section === 'ARENERO' ? 'Un plan para los más pequeños' : 'Reserva tu estadía'}</h1><p>{section === 'ARENERO' ? 'Elige la fecha para disfrutar el arenero en familia. El PMS mostrará sus tarifas y cupos cuando se publique esta nueva sección.' : 'Elige tu habitación o plan, revisa fechas y consulta el precio actualizado con el sistema de reservas.'}</p></div>
    <div className="booking-steps reserve-steps" aria-label="Pasos de la reserva">{['Plan y fechas','Cotización','Titular','Pago'].map((label,index)=><div className={step > index + 1 ? 'complete' : step === index + 1 ? 'current' : ''} key={label}><span>{step > index + 1 ? <Check size={13}/> : index + 1}</span><b>{label}</b></div>)}</div>
    <label className="reserve-section-select">Sección<select value={section} onChange={(e)=>setSection(e.target.value as PublicSection)}>{sections.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    {step === 1 && <><section className="reserve-results"><div className="reserve-section-title"><div><span className="eyebrow">PASO 1 · ELIGE TU EXPERIENCIA</span><h2>{section === 'HOSPEDAJE' ? plans[0]?.roomType ? `Elige una tarifa para ${plans[0].roomType.name}` : 'Habitaciones y planes disponibles' : section === 'ARENERO' ? 'Arenero para niños' : 'Planes publicados'}</h2></div><span>{plans.length} opciones</span></div>{loading && <p>Cargando opciones…</p>}{!loading && plans.map((plan)=><button type="button" key={plan.id} className={`reserve-option ${selected?.id===plan.id?'chosen':''}`} onClick={()=>{setSelected(plan);setSelectedRoomTypeId(plan.roomType?.id || '');setAvailability(null);setQuote(null);setMessage('');}}><span><b>{plan.name}</b><small>{plan.description}{plan.roomType ? ` · ${plan.roomType.name}` : ''}{plan.includes?.length ? ` · Incluye: ${plan.includes.join(', ')}` : ''}</small></span><strong>{money(plan.price,plan.currency)}</strong></button>)}{!loading && !plans.length && <p>{section === 'ARENERO' ? 'El arenero ya tiene su sección preparada en la web. Falta que el PMS publique sus tarifas y disponibilidad para habilitar la reserva en línea.' : 'No hay planes publicados para esta habitación.'}</p>}</section>{selected && <form className="reserve-form" onSubmit={getPrice}>{isLodging && selected.roomType && <fieldset className="reserve-room-choice"><legend>Habitación de este plan</legend><label className="reserve-room-choice-card"><input type="radio" name="roomType" value={selected.roomType.id} checked={selectedRoomTypeId === selected.roomType.id} onChange={() => setSelectedRoomTypeId(selected.roomType!.id)}/><span><b>{selected.roomType.name}</b><small>Hasta {selected.roomType.maxAdults} adultos y {selected.roomType.maxChildren} niños</small><small>La disponibilidad se confirma para tus fechas al consultar la cotización.</small></span><Check aria-hidden="true"/></label></fieldset>}<h2>Fechas y huéspedes</h2><div className="reserve-fields">{dateFields}</div>{selected.minStay && <small>Estadía mínima: {selected.minStay} noche(s).</small>}<button className="forest-button" disabled={loading || (isLodging && !selectedRoomTypeId)}>{loading?'Consultando…':isLodging?'Consultar disponibilidad y precio':'Cotizar plan'} <ArrowRight size={15}/></button></form>}</>}
    {step === 2 && selected && quote && <section className="reserve-results"><h2>Tu cotización</h2>{selected.roomType && <p className="selected-room-summary">Habitación elegida: <strong>{selected.roomType.name}</strong></p>}<article className="reserve-option"><div><b>{quote.rateName}</b><p>{checkIn}{isLodging?` al ${checkOut} · ${quote.nights} noche(s)`:''} · {adults} adulto(s), {children} niño(s)</p>{availability && <small>{availability.available} habitación(es) disponibles para esas fechas</small>}</div><strong>{money(quote.total,quote.currency)}</strong></article><p>El total es informativo. El valor final se confirmará antes de completar el pago.</p><button className="forest-button" onClick={()=>setStep(3)}>Continuar con los datos <ArrowRight size={15}/></button><button className="text-link" onClick={()=>setStep(1)}>Cambiar habitación o fechas</button></section>}
    {step === 3 && selected && quote && <section className="reserve-guest"><div className="reserve-step-title"><div><h2>Datos del titular</h2><p>{quote.rateName} · Cotización {money(quote.total,quote.currency)}</p></div><button className="text-link" onClick={()=>setStep(2)}><ArrowLeft size={14}/> Volver</button></div><form className="guest-form" onSubmit={checkout}><div className="guest-fields"><label>Nombre<input name="firstName" autoComplete="given-name" required/></label><label>Apellido<input name="lastName" autoComplete="family-name" required/></label><label>Correo electrónico<input name="email" type="email" autoComplete="email" required/></label><label>Celular<input name="phone" type="tel" autoComplete="tel"/></label><label>Tipo de documento<select name="documentType" required><option value="CC">Cédula de ciudadanía</option><option value="CE">Cédula de extranjería</option><option value="PA">Pasaporte</option><option value="TI">Tarjeta de identidad</option><option value="NIT">NIT</option></select></label><label>Número de documento<input name="documentId" required/></label><label className="full-width">Solicitudes especiales (opcional)<textarea name="specialRequests" rows={3}/></label></div><button className="forest-button" disabled={loading}>{loading?'Preparando checkout…':'Continuar al pago seguro'} <ArrowRight size={15}/></button><small><Check size={13}/> Se preparará el pago seguro y recibirás confirmación al finalizar.</small></form></section>}
    {message && <p className="reserve-message" role="status">{message}</p>}<div className="reserve-trust"><Check size={15}/> Disponibilidad, precio y confirmación se validan antes de completar el pago.</div></section><footer className="inner-footer"><Link href="/"><ArrowLeft size={15}/> Volver a Paraíso Termal</Link><span>El estado de tu pago se actualizará automáticamente.</span></footer></main>;
}
