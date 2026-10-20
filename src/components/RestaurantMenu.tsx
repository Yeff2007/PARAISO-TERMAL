import { Download, ExternalLink, Utensils } from 'lucide-react';

/** Sección del restaurante con acceso al menú completo en una pestaña aparte. */
export default function RestaurantMenu() {
  return (
    <section className="section restaurant-menu" id="restaurante" aria-labelledby="restaurant-title">
      <div className="section-heading">
        <div><span className="eyebrow">RESTAURANTE · BAR</span><h2 id="restaurant-title">Sabores para disfrutar <em>sin prisa.</em></h2></div>
        <p>Conoce nuestra carta de platos, porciones y bebidas.</p>
      </div>
      <div className="restaurant-menu-layout">
        <img className="restaurant-menu-photo" src="/menu/restaurante-churrasco.jpg" alt="Plato de churrasco con arroz, ensalada y papas" loading="lazy"/>
        <div className="restaurant-menu-content">
          <div className="restaurant-menu-note"><span className="menu-note-icon"><Utensils aria-hidden="true"/></span><div><strong>Una mesa para todos los gustos</strong><p>Carnes, pescados, pollo, cerdo, cenas, comidas rápidas, porciones y bebidas para acompañar tu visita.</p></div></div>
          <div className="restaurant-menu-actions">
            <a className="menu-download" href="/menu/carta-paraiso-termal.pdf" target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Ver menú</a>
            <a className="menu-download menu-download-secondary" href="/menu/carta-paraiso-termal.pdf" download="carta-paraiso-termal.pdf"><Download size={16}/> Descargar PDF</a>
          </div>
        </div>
      </div>
    </section>
  );
}
