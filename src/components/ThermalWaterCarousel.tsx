'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Droplets, FlaskConical, Heart, Waves } from 'lucide-react';
import Link from 'next/link';

type WaterSlide = {
  title: string;
  icon: typeof Waves;
  description: string;
  facts: { label: string; value: string }[];
  benefit: string;
  invitation?: boolean;
};

// Selección breve de datos del análisis del agua para explicar su composición en lenguaje cotidiano.
const slides: WaterSlide[] = [
  {
    title: 'Calor de origen natural', icon: Waves,
    description: 'En su punto de origen, el agua alcanza 47 °C. La temperatura de las piscinas puede variar.',
    facts: [{ label: 'Temperatura en la fuente', value: '47 °C' }, { label: 'Una pausa para', value: 'Relajarte y descansar' }],
    benefit: 'Disfrutas una pausa cálida para desconectarte de la rutina, relajarte y descansar en medio de la naturaleza.',
  },
  {
    title: 'Cloruros: parte de su identidad', icon: FlaskConical,
    description: 'El cloruro es uno de los componentes con mayor presencia en el agua.',
    facts: [{ label: 'Cloruro', value: '228 mg/L' }, { label: 'Presencia en su composición', value: 'Componente predominante' }],
    benefit: 'Junto con los bicarbonatos, define el carácter clorurado-bicarbonatado de estas aguas. Esa combinación es parte de lo que las hace propias de Paraíso Termal.',
  },
  {
    title: 'Bicarbonatos: un sello natural', icon: FlaskConical,
    description: 'El bicarbonato es el componente más abundante de los medidos en el agua.',
    facts: [{ label: 'Bicarbonato', value: '368 mg/L' }, { label: 'Presencia en su composición', value: 'Componente predominante' }],
    benefit: 'Su presencia, junto con el cloruro, le da al agua una composición bicarbonatada que distingue su perfil mineral.',
  },
  {
    title: 'Calcio: el mineral predominante', icon: Droplets,
    description: 'El calcio es el mineral con mayor presencia entre los componentes de carga positiva del agua.',
    facts: [{ label: 'Calcio', value: '89,4 mg/L' }, { label: 'Presencia en su grupo mineral', value: 'Predominante' }],
    benefit: 'Su presencia principal le da al agua su perfil cálcico, una característica distintiva que se suma a la experiencia termal.',
  },
  {
    title: 'También contiene silicio', icon: Droplets,
    description: 'El silicio está presente en el agua en forma de sílice, un compuesto natural.',
    facts: [{ label: 'Sílice (compuesto que contiene silicio)', value: '43,62 mg/L' }, { label: 'pH', value: '6,98 · casi neutro' }],
    benefit: 'La sílice completa su perfil mineral y permite describirla como un agua silícea. Es otro rasgo natural que hace particular su composición.',
  },
  {
    title: 'Ven a vivir la experiencia', icon: Heart,
    description: 'Conoce de cerca el calor y la composición natural de las aguas de Paraíso Termal.',
    facts: [{ label: 'Para disfrutar', value: 'Relajación' }, { label: 'Para regalarte', value: 'Descanso' }, { label: 'Para vivir', value: 'Bienestar y naturaleza' }],
    benefit: 'Ven a probarlas, desconéctate de la rutina y disfruta una pausa cálida entre naturaleza y bienestar.',
    invitation: true,
  },
];

/** Carrusel de contenido promocional con avance automático y controles accesibles. */
export default function ThermalWaterCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[activeIndex];
  const SlideIcon = slide.icon;

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) => setActiveIndex((index) => (index + direction + slides.length) % slides.length);

  return <>
    <section className="section thermal-story" id="dna-agua" aria-labelledby="thermal-title">
      <div className="section-heading thermal-heading">
        <div><span className="eyebrow">PARAÍSO TERMAL · DNA DEL AGUA</span><h2 id="thermal-title">El agua cuenta <em>su historia.</em></h2></div>
        <p>Descubre qué hace especiales nuestras aguas termales y regálate un momento para ti.</p>
      </div>
      <div className="water-carousel" aria-roledescription="carrusel" aria-label="Composición y beneficios de las aguas termales" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
        <div className="water-carousel-top"><span className="water-chapter">{slide.title}</span><span className="water-count">{String(activeIndex + 1).padStart(2, '0')} <i>/</i> {String(slides.length).padStart(2, '0')}</span></div>
        <div className="water-slide" key={activeIndex} aria-live="polite">
          <div className="water-visual water-visual-reserved" aria-label="Espacio reservado para fotografías del agua termal"><div className="water-visual-art" aria-hidden="true"><span>≈</span><i/><i/><i/></div><span className="water-visual-kicker">EL AGUA DE PARAÍSO</span><div><small>{slide.facts[0]?.label}</small><strong>{slide.facts[0]?.value}</strong></div><span className="water-visual-caption">Calor natural · Riqueza mineral</span></div>
          <div className="water-slide-copy"><span className="water-icon"><SlideIcon aria-hidden="true"/></span><span className="water-discovery">DESCUBRE LO QUE LA HACE ÚNICA</span><h3>{slide.title}</h3><p>{slide.description}</p><div className="water-benefit"><strong>¿Qué significa para ti?</strong><p>{slide.benefit}</p></div><div className="water-metrics">{slide.facts.slice(1).map((fact) => <article className="water-metric" key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></article>)}</div>{slide.invitation && <Link className="water-invite-link" href="/reservar">Ven a conocer las aguas <ArrowRight size={15}/></Link>}</div>
        </div>
        <div className="water-carousel-bottom"><div className="water-dots" role="group" aria-label="Elegir contenido">{slides.map((item, index) => <button type="button" key={item.title} className={index === activeIndex ? 'active' : ''} aria-label={`Ver: ${item.title}`} aria-current={index === activeIndex ? 'step' : undefined} onClick={() => setActiveIndex(index)}/>)}</div><div className="water-controls"><button type="button" aria-label="Contenido anterior" onClick={() => move(-1)}><ArrowLeft/></button><button type="button" aria-label="Contenido siguiente" onClick={() => move(1)}><ArrowRight/></button></div></div>
      </div>
    </section>
    <section className="water-safety" aria-labelledby="water-safety-title">
      <div className="water-safety-icon"><Heart aria-hidden="true"/></div>
      <div><span className="eyebrow">DISFRUTA CON CUIDADO</span><h2 id="water-safety-title">Precauciones antes del baño</h2><p>Evita ingresar si tienes fiebre, una enfermedad aguda, sangrado activo o lesiones extensas en la piel. Si tienes una afección cardíaca, pulmonar o renal severa, consulta con tu médico antes de usar las piscinas termales. No bebas ni inhales el agua con fines terapéuticos sin indicación de un profesional de salud.</p></div>
    </section>
  </>;
}
