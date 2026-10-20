Recursos gráficos locales de Paraíso Termal.

Las imágenes termales-piscina.png, spa-bienestar.png, pasaporte-epico.jpg y camping-naturaleza.png son copias guardadas desde el sitio anterior para que el diseño no dependa de que esa web siga activa. Las fotos de catálogo que la API del PMS devuelve en webImage o roomType.images se siguen leyendo desde el PMS; copia aquí las fotos del PMS si también necesitas conservarlas sin conexión a ese servicio.

ImagePlaceholder.tsx asocia fotos locales con etiquetas de piscina, spa, pasaportes y camping. El componente usa URL de imagen de la API cuando el plan trae una; si no, usa las fotos locales o muestra un fondo editorial. Mantén un texto alternativo descriptivo para las imágenes visibles.
