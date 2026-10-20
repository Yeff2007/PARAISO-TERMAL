'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Menu, Search, X } from 'lucide-react';

export default function SiteHeader({ actionHref = '/reservar', actionLabel = 'Reservar ahora' }: { actionHref?: string; actionLabel?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="header inner-header"><Link className="brand" href="/"><span className="brand-symbol"><img className="brand-mark" src="/images/logo-eden-mark.svg" alt=""/></span><span className="brand-copy"><span className="brand-name">PARAÍSO TERMAL</span><small>NATURALEZA · BIENESTAR · DESCANSO</small></span></Link><button className="mobile-toggle" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button><nav className={menuOpen ? 'nav nav-open' : 'nav'}>{[['Inicio','/#inicio'],['Habitaciones','/habitaciones'],['Experiencias','/#experiencias'],['Arenero','/#arenero'],['Restaurante','/#restaurante'],['Promociones','/#pasaportes'],['Galería','/#galeria'],['Nosotros','/#termales'],['Contacto','/#llegar']].map(([label,href])=><Link key={label} href={href} onClick={()=>setMenuOpen(false)}>{label}</Link>)}</nav><div className="header-actions"><Link className="header-icon-link" href="/habitaciones" aria-label="Buscar habitaciones"><Search size={16}/></Link><Link className="header-icon-link" href="/reservar" aria-label="Iniciar reserva"><CalendarDays size={16}/></Link></div><Link className="gold-button header-button" href={actionHref} onClick={()=>setMenuOpen(false)}>{actionLabel} <ArrowRight size={16}/></Link></header>;
}
