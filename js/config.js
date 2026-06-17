/* ===========================================================================
   CONFIG.JS  —  PANEL DE CONTROL DEL VISOR DE ÁRBOLES SINGULARES
   ===========================================================================
   Este es el ÚNICO archivo que necesitás tocar para personalizar el sistema:
   colores, categorías, textos, posición del mapa, campos de la ficha, etc.

   Regla de oro: NO hace falta saber programar para editar esto.
   Solo respetá las comillas, las comas y las llaves { } como están.
   Si algo se rompe, suele ser por una coma de más o una comilla sin cerrar.

   Todo está agrupado en un único objeto llamado CONFIG.
   =========================================================================== */

const CONFIG = {

  /* -------------------------------------------------------------------------
     1) TEXTOS DE LA INTERFAZ
     Cambiá acá todos los rótulos visibles. No toques las "claves" de la
     izquierda (titulo, subtitulo, ...), solo el texto entre comillas.
     ------------------------------------------------------------------------- */
  textos: {
    titulo:           "Árboles Singulares",
    subtitulo:        "Dirección de Arbolado Público · La Plata",
    placeholderBusqueda: "Buscar por nombre, especie o categoría…",
    rotuloFiltros:    "Categorías",
    rotuloLista:      "Ejemplares",
    sinResultados:    "No se encontraron árboles con ese criterio.",
    botonTodos:       "Todas",
    creditosFooter:   "Inventario de patrimonio arbóreo · uso interno",
    // Texto que aparece cuando un árbol no tiene fotos cargadas:
    sinFoto:          "Sin fotografía disponible"
  },

  /* -------------------------------------------------------------------------
     2) MAPA BASE
     - centro: [latitud, longitud] donde se posiciona el mapa al abrir.
     - zoomInicial: cuanto más alto, más cerca (12 ciudad, 16 manzana).
     - zoomAlSeleccionar: a qué nivel acerca al hacer clic en un árbol.
     ------------------------------------------------------------------------- */
  mapa: {
    centro:            [-34.9214, -57.9544],  // Plaza Moreno, La Plata
    zoomInicial:       14,
    zoomMinimo:        11,
    zoomMaximo:        19,
    zoomAlSeleccionar: 18
  },

  /* -------------------------------------------------------------------------
     3) CAPAS BASE (fondos de mapa gratuitos)
     Podés ofrecer varias y el usuario elige con el control de capas.
     La primera de la lista es la que se muestra al abrir.
     "url" y "atribucion" vienen del proveedor; no los inventes.
     ------------------------------------------------------------------------- */
  capasBase: [
    {
      nombre:     "Callejero (OSM)",
      url:        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      atribucion: "© OpenStreetMap"
    },
    {
      nombre:     "Satélite (Esri)",
      url:        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      atribucion: "© Esri, Maxar, Earthstar Geographics"
    },
    {
      nombre:     "Claro (Carto)",
      url:        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      atribucion: "© OpenStreetMap © CARTO"
    }
  ],

  /* -------------------------------------------------------------------------
     4) CATEGORÍAS DE ÁRBOL  ← lo que más vas a editar
     Cada categoría define:
       - id     : identificador interno SIN espacios ni acentos (clave técnica).
                  Debe coincidir EXACTAMENTE con el campo "categoria" del GeoJSON.
       - rotulo : nombre visible para el usuario.
       - color  : color del marcador y de la etiqueta (en formato #RRGGBB).

     Para AGREGAR una categoría nueva: copiá un bloque { ... }, cambiá los
     tres valores y agregalo a la lista (con su coma al final).
     ------------------------------------------------------------------------- */
  categorias: [
    { id: "notable",  rotulo: "Notable",   color: "#A8324A" },
    { id: "histórico",    rotulo: "Histórico",     color: "#2E6F8E" },
    { id: "semillero",    rotulo: "Semillero",     color: "#4E7C46" },
  ],

  /* Color de respaldo si un árbol tiene una categoría no listada arriba: */
  colorCategoriaDesconocida: "#5C5C5C",

  /* -------------------------------------------------------------------------
     5) ORIGEN DE LOS DATOS
     Ruta al archivo GeoJSON con los árboles. Si renombrás el archivo o lo
     movés de carpeta, actualizá esta ruta.
     ------------------------------------------------------------------------- */
  datos: {
    rutaGeoJSON: "datos/arboles.geojson",
    // Carpeta donde guardás las fotos (las rutas en el GeoJSON son relativas a ella):
    carpetaImagenes: "img/"
  },

  /* -------------------------------------------------------------------------
     6) CAMPOS DE LA FICHA
     Define QUÉ atributos se muestran en la ficha de cada árbol y CÓMO se
     rotulan. El orden de esta lista es el orden en que aparecen.

       - campo  : nombre EXACTO de la propiedad en el GeoJSON.
       - rotulo : etiqueta visible.
       - sufijo : (opcional) unidad que se agrega al valor, ej. " m", " cm".
       - tipo   : (opcional) "fecha" para formatear, "texto" por defecto.

     Para mostrar un atributo nuevo: agregalo al GeoJSON Y agregá su línea acá.
     Si un árbol no tiene ese dato, la fila simplemente no se muestra.
     ------------------------------------------------------------------------- */
  camposFicha: [
    { campo: "nombre_cientifico", rotulo: "Nombre científico" },
    { campo: "especie",           rotulo: "Especie" },
    { campo: "ubicacion",         rotulo: "Ubicación" },
    { campo: "altura_m",          rotulo: "Altura",          sufijo: " m" },
    { campo: "diametro_cm",       rotulo: "Diámetro (DAP)",  sufijo: " cm" },
    { campo: "edad_estimada",     rotulo: "Edad estimada" },
    { campo: "fecha_plantacion",  rotulo: "Fecha de plantación", tipo: "fecha" },
    { campo: "estado_sanitario",  rotulo: "Estado sanitario" },
    { campo: "valor_patrimonial", rotulo: "Valor patrimonial" },
    { campo: "codigo",            rotulo: "Código interno" }
  ],

  /* -------------------------------------------------------------------------
     7) AJUSTES VARIOS
     ------------------------------------------------------------------------- */
  opciones: {
    // ¿Mostrar el panel lateral abierto al cargar en escritorio?
    sidebarAbiertaInicio: true,
    // ¿Agrupar marcadores cercanos en racimos? (útil con muchos árboles)
    // true = se agrupan; false = se ven todos sueltos.
    agruparMarcadores: false
  }
};
