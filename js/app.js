/* ===========================================================================
   APP.JS  —  Lógica del visor de Árboles Singulares
   ---------------------------------------------------------------------------
   No necesitás editar este archivo para el uso normal. Toda la personalización
   vive en config.js y en datos/arboles.geojson.
   El código está dividido en secciones numeradas para que puedas seguirlo.
   =========================================================================== */

/* ---------------------------------------------------------------------------
   ESTADO de la aplicación: la "memoria" de lo que está pasando ahora.
   --------------------------------------------------------------------------- */
const estado = {
  arboles:        [],     // lista de árboles ya procesados
  marcadores:     {},     // { id -> marcador de Leaflet }
  itemsLista:     {},     // { id -> elemento <li> de la lista }
  filtroCategoria: null,  // null = todas; o el id de una categoría
  textoBusqueda:  "",     // lo que el usuario escribió en el buscador
  seleccionado:   null    // id del árbol actualmente seleccionado
};

let mapa; // referencia al mapa de Leaflet (se crea en iniciarMapa)


/* ===========================================================================
   1) ARRANQUE
   =========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  aplicarTextos();      // vuelca los textos de config.js a la pantalla
  construirChips();     // genera los filtros por categoría
  conectarEventos();    // botones, buscador, cierre de ficha, etc.

  // El mapa se inicia dentro de un try/catch: si Leaflet no estuviera
  // disponible por algún motivo, la lista de árboles sigue funcionando
  // y se muestra un aviso en el área del mapa (en vez de pantalla en blanco).
  try {
    iniciarMapa();      // crea el mapa y las capas base
  } catch (e) {
    console.error("No se pudo iniciar el mapa:", e);
    mostrarErrorMapa();
  }

  cargarDatos();        // descarga el GeoJSON y dibuja todo
});

/* Aviso amable si el mapa no pudo cargar (la lista sigue disponible) */
function mostrarErrorMapa() {
  document.getElementById("mapa").innerHTML =
    '<div style="max-width:420px;margin:60px auto;padding:24px;text-align:center;' +
    'font-family:var(--texto);color:var(--corteza)">' +
    'No se pudo cargar el componente de mapa. La lista de árboles de la izquierda ' +
    'funciona igual. Si publicaste el sitio, verificá que la carpeta <b>vendor/</b> ' +
    'se haya subido completa.</div>';
}


/* ===========================================================================
   2) TEXTOS DE INTERFAZ  (desde config.textos)
   =========================================================================== */
function aplicarTextos() {
  const t = CONFIG.textos;
  document.getElementById("tituloApp").textContent     = t.titulo;
  document.getElementById("subtituloApp").textContent  = t.subtitulo;
  document.getElementById("busqueda").placeholder      = t.placeholderBusqueda;
  document.getElementById("rotuloFiltros").textContent = t.rotuloFiltros;
  document.getElementById("rotuloLista").textContent   = t.rotuloLista;
  document.title = t.titulo;
}


/* ===========================================================================
   3) MAPA Y CAPAS BASE
   =========================================================================== */
function iniciarMapa() {
  mapa = L.map("mapa", {
    center: CONFIG.mapa.centro,
    zoom:   CONFIG.mapa.zoomInicial,
    minZoom: CONFIG.mapa.zoomMinimo,
    maxZoom: CONFIG.mapa.zoomMaximo,
    zoomControl: true
  });

  // Construimos las capas base definidas en config.js
  const capas = {};
  CONFIG.capasBase.forEach((c, i) => {
    const capa = L.tileLayer(c.url, {
      attribution: c.atribucion,
      maxZoom: CONFIG.mapa.zoomMaximo
    });
    capas[c.nombre] = capa;
    if (i === 0) capa.addTo(mapa); // la primera se muestra al abrir
  });

  // Si hay más de una capa, ofrecemos el selector
  if (CONFIG.capasBase.length > 1) {
    L.control.layers(capas, null, { position: "topright" }).addTo(mapa);
  }
}


/* ===========================================================================
   4) CARGA DE DATOS (GeoJSON)
   =========================================================================== */
function cargarDatos() {
  fetch(CONFIG.datos.rutaGeoJSON)
    .then(resp => {
      if (!resp.ok) throw new Error("No se pudo leer el archivo de datos");
      return resp.json();
    })
    .then(geojson => {
      // Normalizamos cada Feature a un objeto más cómodo de usar
      estado.arboles = geojson.features.map((f, i) => {
        const p = f.properties || {};
        const coords = f.geometry.coordinates; // [longitud, latitud]
        return {
          id:    p.codigo || ("arbol-" + i),
          lat:   coords[1],
          lng:   coords[0],
          props: p
        };
      });
      dibujarMarcadores();
      renderizarLista();
    })
    .catch(err => {
      console.error(err);
      document.getElementById("lista").innerHTML =
        '<li class="lista-vacia">No se pudieron cargar los datos.<br>' +
        'Revisá la ruta en config.js y que el GeoJSON sea válido.</li>';
    });
}


/* ===========================================================================
   5) MARCADORES EN EL MAPA
   =========================================================================== */
function dibujarMarcadores() {
  if (!mapa) return; // si el mapa no se pudo crear, no hay dónde dibujar

  // Capa contenedora de los marcadores. Si el usuario activó el agrupamiento
  // y el plugin de clusters está disponible, lo usamos; si no, capa normal.
  let capa;
  if (CONFIG.opciones.agruparMarcadores && window.L.markerClusterGroup) {
    capa = L.markerClusterGroup();
  } else {
    capa = L.layerGroup();
  }

  estado.arboles.forEach(arbol => {
    const color = colorCategoria(arbol.props.categoria);
    const marcador = L.marker([arbol.lat, arbol.lng], {
      icon: crearIcono(color)
    });
    // Al hacer clic en el marcador: seleccionar y abrir la ficha
    marcador.on("click", () => seleccionar(arbol.id, { mover: false }));
    estado.marcadores[arbol.id] = marcador;
    capa.addLayer(marcador);
  });

  capa.addTo(mapa);
  estado.capaMarcadores = capa;
}

/* Crea el ícono de gota/hoja coloreado según la categoría */
function crearIcono(color) {
  return L.divIcon({
    className: "",                 // sin clase por defecto de Leaflet
    html: `<div class="marcador"><div class="marcador-gota" style="--c:${color}"></div></div>`,
    iconSize:   [26, 26],
    iconAnchor: [13, 24],          // la punta de la gota apunta a la coordenada
    popupAnchor:[0, -22]
  });
}


/* ===========================================================================
   6) FILTROS POR CATEGORÍA (chips)
   =========================================================================== */
function construirChips() {
  const cont = document.getElementById("chips");

  // Chip "Todas" (quita el filtro)
  cont.appendChild(crearChip(null, CONFIG.textos.botonTodos, null, true));

  // Un chip por cada categoría de config.js
  CONFIG.categorias.forEach(cat => {
    cont.appendChild(crearChip(cat.id, cat.rotulo, cat.color, false));
  });
}

function crearChip(id, rotulo, color, activo) {
  const chip = document.createElement("button");
  chip.className = "chip" + (activo ? " activo" : "");
  chip.dataset.categoria = id === null ? "" : id;
  chip.innerHTML = (color
        ? `<span class="punto" style="background:${color}"></span>` : "")
        + escaparHTML(rotulo);

  chip.addEventListener("click", () => {
    estado.filtroCategoria = id;
    // actualizar el aspecto "activo" de los chips
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("activo"));
    chip.classList.add("activo");
    renderizarLista();
  });
  return chip;
}


/* ===========================================================================
   7) LISTA LATERAL  (+ búsqueda + filtro)
   =========================================================================== */
function renderizarLista() {
  const ul = document.getElementById("lista");
  ul.innerHTML = "";
  estado.itemsLista = {};

  const visibles = estado.arboles.filter(coincideConFiltros);

  // Contador
  document.getElementById("contador").textContent = visibles.length;

  // Mostrar/ocultar marcadores según el filtro
  sincronizarMarcadoresVisibles(visibles);

  if (visibles.length === 0) {
    ul.innerHTML = `<li class="lista-vacia">${CONFIG.textos.sinResultados}</li>`;
    return;
  }

  visibles.forEach(arbol => {
    ul.appendChild(crearItemLista(arbol));
  });

  // Re-aplicar el resaltado si había algo seleccionado
  if (estado.seleccionado) marcarSeleccionEnLista(estado.seleccionado);
}

/* ¿El árbol pasa el filtro de categoría y el texto de búsqueda? */
function coincideConFiltros(arbol) {
  const p = arbol.props;

  // Filtro por categoría
  if (estado.filtroCategoria && p.categoria !== estado.filtroCategoria) {
    return false;
  }

  // Filtro por texto (nombre, especie, científico, categoría)
  const texto = estado.textoBusqueda.trim().toLowerCase();
  if (texto === "") return true;

  const cat = categoriaPorId(p.categoria);
  const campos = [
    p.nombre_comun, p.especie, p.nombre_cientifico,
    p.descripcion, cat ? cat.rotulo : ""
  ].join(" ").toLowerCase();

  return campos.includes(texto);
}

function crearItemLista(arbol) {
  const p = arbol.props;
  const cat = categoriaPorId(p.categoria);
  const color = colorCategoria(p.categoria);

  const li = document.createElement("li");
  li.className = "item";
  li.dataset.id = arbol.id;

  const meta = [];
  if (p.altura_m)    meta.push(`${p.altura_m} m`);
  if (p.diametro_cm) meta.push(`Ø ${p.diametro_cm} cm`);

  li.innerHTML = `
    <span class="item-barra" style="background:${color}"></span>
    <div>
      <div class="item-nombre">${escaparHTML(p.nombre_comun || "Sin nombre")}</div>
      ${p.nombre_cientifico ? `<div class="item-cientifico">${escaparHTML(p.nombre_cientifico)}</div>` : ""}
      ${meta.length ? `<div class="item-meta">${meta.map(escaparHTML).join(" · ")}</div>` : ""}
      <span class="item-categoria" style="background:${color}">${escaparHTML(cat ? cat.rotulo : p.categoria || "")}</span>
    </div>`;

  li.addEventListener("click", () => seleccionar(arbol.id, { mover: true }));

  estado.itemsLista[arbol.id] = li;
  return li;
}

/* Muestra solo los marcadores que pasan el filtro actual */
function sincronizarMarcadoresVisibles(visibles) {
  if (!estado.capaMarcadores) return;
  const idsVisibles = new Set(visibles.map(a => a.id));
  estado.arboles.forEach(arbol => {
    const m = estado.marcadores[arbol.id];
    if (!m) return;
    const estaEnMapa = estado.capaMarcadores.hasLayer(m);
    if (idsVisibles.has(arbol.id) && !estaEnMapa) {
      estado.capaMarcadores.addLayer(m);
    } else if (!idsVisibles.has(arbol.id) && estaEnMapa) {
      estado.capaMarcadores.removeLayer(m);
    }
  });
}


/* ===========================================================================
   8) SELECCIÓN SINCRONIZADA  (lista ⇄ mapa ⇄ ficha)
   =========================================================================== */
function seleccionar(id, opciones = {}) {
  const arbol = estado.arboles.find(a => a.id === id);
  if (!arbol) return;

  estado.seleccionado = id;

  // Resaltar en el mapa
  marcarSeleccionEnMapa(id);
  // Resaltar en la lista
  marcarSeleccionEnLista(id);

  // Centrar el mapa en el árbol (al venir desde la lista)
  if (opciones.mover && mapa) {
    mapa.flyTo([arbol.lat, arbol.lng], CONFIG.mapa.zoomAlSeleccionar, {
      duration: 0.8
    });
    // En móvil, cerrar el panel para ver el mapa
    if (window.innerWidth <= 760) togglePanel(false);
  }

  // Abrir y completar la ficha
  abrirFicha(arbol);
}

function marcarSeleccionEnMapa(id) {
  // Quitar el resaltado anterior
  Object.values(estado.marcadores).forEach(m => {
    const el = m.getElement();
    if (el) el.querySelector(".marcador")?.classList.remove("activo");
  });
  // Resaltar el actual
  const m = estado.marcadores[id];
  const el = m && m.getElement();
  if (el) el.querySelector(".marcador")?.classList.add("activo");
}

function marcarSeleccionEnLista(id) {
  document.querySelectorAll(".item.seleccionado")
          .forEach(i => i.classList.remove("seleccionado"));
  const li = estado.itemsLista[id];
  if (li) {
    li.classList.add("seleccionado");
    li.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}


/* ===========================================================================
   9) FICHA DESCRIPTIVA
   =========================================================================== */
function abrirFicha(arbol) {
  const p = arbol.props;
  const cat = categoriaPorId(p.categoria);
  const color = colorCategoria(p.categoria);

  // Cabecera
  const cab = document.getElementById("fichaCab");
  cab.style.background = `linear-gradient(160deg, ${color}, ${mezclarOscuro(color)})`;
  document.getElementById("fichaCategoria").textContent = cat ? cat.rotulo : (p.categoria || "");
  document.getElementById("fichaNombre").textContent = p.nombre_comun || "Sin nombre";
  document.getElementById("fichaCientifico").textContent = p.nombre_cientifico || "";

  // Cuerpo
  document.getElementById("fichaCuerpo").innerHTML =
      bloqueGaleria(p) + bloqueDatos(p) + bloqueTextos(p) + bloqueAdjuntos(p);

  // Conectar el zoom de las fotos (lightbox)
  document.querySelectorAll("#fichaCuerpo .galeria-foto").forEach(img => {
    img.addEventListener("click", () => abrirLightbox(img.src));
  });

  // Mostrar el panel de la ficha
  const ficha = document.getElementById("ficha");
  ficha.classList.add("abierta");
  ficha.setAttribute("aria-hidden", "false");
}

function cerrarFicha() {
  const ficha = document.getElementById("ficha");
  ficha.classList.remove("abierta");
  ficha.setAttribute("aria-hidden", "true");
}

/* --- Galería de fotos --- */
function bloqueGaleria(p) {
  const fotos = Array.isArray(p.fotos) ? p.fotos : [];
  if (fotos.length === 0) {
    return `<div class="galeria-vacia">🌿 ${CONFIG.textos.sinFoto}</div>`;
  }
  const imgs = fotos.map(nombre => {
    const ruta = CONFIG.datos.carpetaImagenes + nombre;
    // Si la imagen no existe, se oculta sola (onerror)
    return `<img class="galeria-foto" src="${ruta}" alt="${escaparHTML(p.nombre_comun || "")}"
                 onerror="this.style.display='none'">`;
  }).join("");
  return `<div class="galeria">${imgs}</div>`;
}

/* --- Tabla de datos (según config.camposFicha) --- */
function bloqueDatos(p) {
  const filas = CONFIG.camposFicha.map(c => {
    let valor = p[c.campo];
    if (valor === undefined || valor === null || valor === "") return ""; // omitir vacíos
    if (c.tipo === "fecha") valor = formatearFecha(valor);
    if (c.sufijo) valor = valor + c.sufijo;
    const claseMono = (c.campo === "codigo") ? ' class="mono"' : "";
    return `<tr><th>${escaparHTML(c.rotulo)}</th><td${claseMono}>${escaparHTML(String(valor))}</td></tr>`;
  }).join("");
  return filas ? `<table class="datos-tabla">${filas}</table>` : "";
}

/* --- Descripción e información histórica --- */
function bloqueTextos(p) {
  let html = "";
  if (p.descripcion) {
    html += `<div class="ficha-bloque"><h4>Descripción</h4><p>${escaparHTML(p.descripcion)}</p></div>`;
  }
  if (p.info_historica) {
    html += `<div class="ficha-bloque"><h4>Información histórica</h4><p>${escaparHTML(p.info_historica)}</p></div>`;
  }
  return html;
}

/* --- Adjuntos: video, PDF, enlaces externos --- */
function bloqueAdjuntos(p) {
  let items = "";

  // Video (si es YouTube, se incrusta; si no, se ofrece como enlace)
  if (p.video_url) {
    const embed = aEmbedYouTube(p.video_url);
    if (embed) {
      items += `<iframe class="video-embed" src="${embed}" allowfullscreen></iframe>`;
    } else {
      items += enlace(p.video_url, "▶ Ver video");
    }
  }
  // PDF
  if (p.pdf_url) items += enlace(p.pdf_url, "📄 Documento (PDF)");

  // Enlaces externos
  if (Array.isArray(p.enlaces)) {
    p.enlaces.forEach(e => {
      if (e && e.url) items += enlace(e.url, "🔗 " + (e.titulo || e.url));
    });
  }

  return items ? `<div class="ficha-bloque"><h4>Material complementario</h4>
                    <div class="adjuntos">${items}</div></div>` : "";
}

function enlace(url, texto) {
  return `<a class="adjunto" href="${encodeURI(url)}" target="_blank" rel="noopener">${escaparHTML(texto)}</a>`;
}


/* ===========================================================================
   10) LIGHTBOX (ampliar fotos)
   =========================================================================== */
function abrirLightbox(src) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightbox").classList.add("abierto");
}
function cerrarLightbox() {
  document.getElementById("lightbox").classList.remove("abierto");
}


/* ===========================================================================
   11) EVENTOS DE INTERFAZ
   =========================================================================== */
function conectarEventos() {
  // Buscador (se actualiza mientras se escribe)
  document.getElementById("busqueda").addEventListener("input", e => {
    estado.textoBusqueda = e.target.value;
    renderizarLista();
  });

  // Botón mostrar/ocultar panel
  document.getElementById("botonPanel").addEventListener("click", () => togglePanel());

  // Cerrar ficha
  document.getElementById("fichaCerrar").addEventListener("click", cerrarFicha);

  // Cerrar lightbox al hacer clic o con Escape
  document.getElementById("lightbox").addEventListener("click", cerrarLightbox);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { cerrarLightbox(); cerrarFicha(); }
  });

  // Estado inicial del panel
  if (!CONFIG.opciones.sidebarAbiertaInicio || window.innerWidth <= 760) {
    togglePanel(false);
  }
}

/* Muestra u oculta el panel lateral. Sin argumento = alterna. */
function togglePanel(forzar) {
  const panel = document.getElementById("panel");
  const ocultar = (forzar === undefined) ? !panel.classList.contains("oculto") : !forzar;
  panel.classList.toggle("oculto", ocultar);
  // El mapa necesita recalcular su tamaño tras la animación
  setTimeout(() => mapa && mapa.invalidateSize(), 320);
}


/* ===========================================================================
   12) UTILIDADES
   =========================================================================== */

/* Devuelve el objeto categoría a partir de su id (o null) */
function categoriaPorId(id) {
  return CONFIG.categorias.find(c => c.id === id) || null;
}

/* Devuelve el color de una categoría (o el color de respaldo) */
function colorCategoria(id) {
  const cat = categoriaPorId(id);
  return cat ? cat.color : CONFIG.colorCategoriaDesconocida;
}

/* Convierte "2025-08-01" en "1 de agosto de 2025" */
function formatearFecha(valor) {
  const d = new Date(valor);
  if (isNaN(d)) return valor; // si no es una fecha válida, lo deja igual
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

/* Convierte una URL de YouTube en su versión para incrustar (o null) */
function aEmbedYouTube(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/* Oscurece un color #RRGGBB para el degradado de la ficha */
function mezclarOscuro(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 30);
  const g = Math.max(0, ((n >> 8) & 255) - 30);
  const b = Math.max(0, (n & 255) - 30);
  return `rgb(${r},${g},${b})`;
}

/* Evita que comillas o signos rompan el HTML (seguridad básica) */
function escaparHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
