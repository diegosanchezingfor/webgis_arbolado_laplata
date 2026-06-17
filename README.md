# 🌳 Visor de Árboles Singulares

Visor web interactivo para inventariar y difundir árboles de interés especial
(patrimoniales, históricos, semilleros, monumentales, etc.) sobre un mapa.

Hecho con tecnologías **gratuitas y de código abierto**. **No requiere servidor
ni base de datos**: son archivos estáticos que se publican gratis y se mantienen
editando un solo archivo de datos.

---

## 1. Estructura de carpetas

```
arboles-singulares/
├── index.html              ← página principal (no se suele tocar)
├── css/
│   └── estilos.css         ← apariencia (colores base, tipografías)
├── js/
│   ├── config.js           ← ⭐ TODO lo configurable (categorías, textos, mapa)
│   └── app.js              ← lógica de la app (no se toca para el uso normal)
├── datos/
│   └── arboles.geojson     ← ⭐ LOS DATOS de los árboles (lo que más editás)
├── img/                    ← fotos de los árboles (.jpg / .webp)
│   └── LEEME.txt
├── vendor/                 ← librería Leaflet (incluida; no se toca)
└── README.md               ← este manual
```

Los dos archivos que vas a usar en el día a día son los marcados con ⭐:
`datos/arboles.geojson` (para cargar árboles) y `js/config.js` (para ajustes).

---

## 2. Probar la app en tu computadora

Como la app lee un archivo de datos, **no alcanza con abrir `index.html` haciendo
doble clic** (el navegador lo bloquea por seguridad). Necesitás un servidor local,
que se levanta con una sola línea. Abrí una terminal en la carpeta del proyecto y:

```bash
# Si tenés Python (viene en la mayoría de las PC):
python -m http.server 8000
```

Luego abrí en el navegador: **http://localhost:8000**

(Para cortar el servidor: `Ctrl + C` en la terminal.)
Alternativa sin terminal: en VS Code instalá la extensión **Live Server** y hacé
clic derecho sobre `index.html` → *Open with Live Server*.

---

## 3. Cómo agregar o editar un árbol

Abrí `datos/arboles.geojson` con un editor de texto (Bloc de notas, VS Code) o,
mejor aún, **con QGIS** (ver sección 7).

Cada árbol es un bloque como este. Copiá uno entero, pegalo antes del último `]`,
y cambiá los valores:

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [-57.9544, -34.9214] },
  "properties": {
    "codigo": "AS-007",
    "nombre_comun": "Nombre del árbol",
    "nombre_cientifico": "Genus species",
    "especie": "Nombre vulgar de la especie",
    "categoria": "patrimonial",
    "altura_m": 18,
    "diametro_cm": 90,
    "edad_estimada": "≈ 100 años",
    "fecha_plantacion": "1920-05-01",
    "estado_sanitario": "Bueno",
    "valor_patrimonial": "Alto",
    "descripcion": "Texto descriptivo del ejemplar.",
    "info_historica": "Historia o anécdotas (opcional).",
    "fotos": ["arbol-007-a.jpg", "arbol-007-b.jpg"],
    "video_url": "",
    "pdf_url": "",
    "enlaces": [ { "titulo": "Más info", "url": "https://..." } ]
  }
}
```

**Reglas importantes:**

- ⚠️ Las coordenadas van como `[LONGITUD, LATITUD]` **en ese orden** (así lo exige
  GeoJSON). En La Plata la longitud es ~ `-57.9` y la latitud ~ `-34.9`.
  Para sacar las coordenadas: clic derecho en Google Maps → el primer número es la
  latitud y el segundo la longitud, así que **invertilos** al pegarlos acá.
- Separá cada árbol del siguiente con una **coma**. El último **no** lleva coma.
- `categoria` debe coincidir con un `id` de las categorías en `config.js`
  (`notable`, `histórico`, `semillero`).
- Cualquier campo que dejes vacío (`""`) o que borres, simplemente no aparece en
  la ficha. No pasa nada.
- Si la app deja de cargar, casi siempre es una **coma de más o de menos**, o una
  **comilla sin cerrar**. Pegá el contenido en https://geojson.io o
  https://jsonlint.com para que te marque el error.

### Agregar las fotos

1. Guardá las fotos en la carpeta `img/`.
2. Nombralas igual que en el campo `"fotos"` del árbol.
3. Recomendado: redimensionar a ~1200 px de ancho para que carguen rápido.

---

## 4. Personalizar categorías, colores y textos

Todo esto se edita en **`js/config.js`**, que está dividido en secciones numeradas
y comentadas. Los cambios más comunes:

- **Agregar/quitar categorías** → sección 4 (`categorias`). Copiá una línea, cambiá
  `id`, `rotulo` y `color`. El `color` se usa en el marcador y en las etiquetas.
- **Cambiar el centro/zoom del mapa** → sección 2 (`mapa`).
- **Cambiar títulos y rótulos** → sección 1 (`textos`).
- **Elegir qué datos se ven en la ficha** → sección 6 (`camposFicha`).
- **Agregar un atributo nuevo** (ej. "tutor responsable"): agregalo a cada árbol en
  el GeoJSON **y** sumá una línea en `camposFicha` con su `campo` y `rotulo`.

Los colores de fondo y las tipografías globales están al inicio de
`css/estilos.css`, en el bloque `:root` (variables `--verde-bosque`, etc.).

---

## 5. Publicar en internet (gratis) — GitHub Pages

GitHub Pages es la opción recomendada: gratuita, estable y pensada para sitios
estáticos como este. Pasos:

1. Creá una cuenta en https://github.com (gratis).
2. Creá un repositorio nuevo, por ejemplo `arboles-singulares` (público).
3. Subí **todo el contenido** de esta carpeta al repositorio
   (botón *Add file → Upload files*, arrastrá los archivos y carpetas).
4. En el repo: **Settings → Pages**.
5. En *Source*, elegí la rama `main` y la carpeta `/ (root)`. Guardá.
6. Esperá 1–2 minutos. GitHub te dará una URL del tipo:
   `https://TU-USUARIO.github.io/arboles-singulares/`

Para **actualizar** los árboles más adelante: editás `datos/arboles.geojson` (en la
web de GitHub directamente, lápiz ✏️) y al guardar, el sitio se actualiza solo en
un par de minutos.

> Si alguna vez ves una página en blanco tras publicar, agregá un archivo vacío
> llamado `.nojekyll` en la raíz del repo (evita que GitHub procese la carpeta).

### ¿Por qué GitHub Pages y no otra?

| Plataforma         | Gratis | Facilidad | Notas |
|--------------------|:------:|:---------:|-------|
| **GitHub Pages** ✅ | Sí     | Alta      | Ideal para esto. Edición online de datos. |
| Cloudflare Pages   | Sí     | Alta      | Muy buena alternativa; igual de válida. |
| Netlify            | Sí     | Alta      | Cómodo (arrastrar carpeta), límite de banda generoso. |
| Vercel             | Sí     | Media     | Orientado a apps con build; acá es overkill. |
| Render             | Sí     | Media     | Pensado para servidores; innecesario para sitio estático. |

Las cuatro primeras sirven. Recomiendo **GitHub Pages** porque además te deja
editar el archivo de datos desde el navegador, sin instalar nada.

---

## 6. Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| El mapa no aparece (gris) | Falta la carpeta `vendor/` o sin internet para las tiles | Subí `vendor/` completa; verificá conexión |
| Lista vacía / "no se pudieron cargar los datos" | GeoJSON con error de sintaxis | Validá en jsonlint.com |
| Abrí `index.html` y no carga nada | Falta el servidor local | Usá `python -m http.server` (sección 2) |
| Un árbol no aparece | `categoria` mal escrita o coma faltante | Revisá que el `id` exista en config.js |
| La foto no se ve | Nombre distinto o no está en `img/` | El nombre del archivo debe ser idéntico |
| Marcador en el lugar equivocado | Lat/Long invertidas | El orden es `[longitud, latitud]` |

---

## 7. Ampliaciones futuras (cuando el proyecto crezca)

- **Editar datos con QGIS**: abrí `arboles.geojson` como capa en QGIS, cargá árboles
  con la herramienta de edición y exportá de nuevo a GeoJSON. Ideal para vos que ya
  manejás SIG: evita editar el texto a mano.
- **Muchos árboles (cientos+)**: activá el agrupamiento de marcadores. En `config.js`
  poné `agruparMarcadores: true` y agregá en `index.html` (antes de `app.js`) las dos
  líneas del plugin *Leaflet.markercluster* (CSS y JS desde su CDN). El código ya está
  preparado para usarlo si está disponible.
- **Acceso público en el sitio institucional**: al ser estático, se puede incrustar
  en un `<iframe>` dentro de la web del municipio, o publicar en un subdominio.
- **Carga colaborativa sin tocar código**: si varias personas deben cargar datos, se
  puede migrar el origen de datos a una **Google Sheet** publicada como CSV/GeoJSON,
  o más adelante a **PostGIS** + una API si se necesita edición concurrente y control
  de usuarios. Para esta etapa (uso interno, presupuesto cero), el GeoJSON es lo más
  conveniente.
- **Buscador por dirección**: se puede sumar el geocodificador gratuito de Nominatim.
- **Capas extra**: límites de barrios, recorridos temáticos, especies por color.

---

## 8. Créditos técnicos

- [Leaflet](https://leafletjs.com/) — mapa interactivo (BSD-2).
- [OpenStreetMap](https://www.openstreetmap.org/) — cartografía base (ODbL).
- Imágenes satelitales: Esri World Imagery. Mapa claro: CARTO.
- Tipografías: Fraunces e Inter (Google Fonts, licencia SIL Open Font).
