# brayanVideoGame 🕹️

**BRAYAN 16 BIT — Edición Bogotá (Capítulo 1 Completo: Mundos 1-1 a 1-4)**

Juego de plataformas y acción retro de 16 bits estilo SNES ambientado en Bogotá, Colombia (Carrera 7ª, TransMilenio, Portal Sur y Bosa Piamonte). Construido con **HTML5 Canvas + ES Modules nativos** (cero frameworks pesados, cero dependencias externas, arquitectura modular por *stages* replicable y escalable).

---

## 🎮 Características

- **Pixel Art 16-Bit Auténtico**: 39 sprites y fondos originales en estilo SNES (Brayan con sus poses y maletín, Ñero con cuchillo, Doña de la Chaza, Activistas, Cosquillero, Jefe del Fruver, Colados, Cantante Callejero, Capuchos con Molotov, Helicóptero y Jefe Final de Piamonte, además de escenarios de Carrera 7ª, TransMilenio, Estación Calle 26, Portal Sur y Bosa Piamonte).
- **Capítulo 1 Completo + Cinemáticas**:
  - **Intro Lobby → Mundo 1-1**: Carrera 7ª hasta Plaza de Bolívar.
  - **Mundo 1-2**: Trayecto de ~52 s en TransMilenio hora pico (Celular, Cosquillero, Gas Verde).
  - **Cinemática Estación Calle 26 → Mundo 1-3**: Transbordo al articulado `G45` rumbo al Portal Sur.
  - **Mundo 1-4**: Asedio en Bosa Piamonte (Helicóptero + Capuchos) y Jefe Final en la Cancha de Microfútbol.
  - **Cinemática Prólogo Capítulo 2**: Despertar fingido en el sofá de la oficina (Majo Piza Romero + asesores) y misión de la fotocopia.
  - **Mundo 2-1**: Pasillos del edificio rumbo a la fotocopiadora esquivando hordas de bodegueros youtubers amarillistas (Levy, Wally Ballena, Lalis Selfie, Paparazzi y Streamers).
  - **Cinemática Interactiva `2-1 → 2-2`**: Filtro ideológico del funcionario chairo en la sala de fotocopias (quiz de 4 opciones).
  - **Mundo 2-2**: Oficinas públicas recolectando hojas de papel mientras esquivas estampidas velocistas de lagartos rumbo a la reunión del sindicato (+25% prima mensual).
  - **Cinemática `2-2 → 2-3`**: Entrega de hoja de vida a Majo Piza Romero, revelación demoníaca en rojo sangre y transición rumbo a casa (*Bosa La Esperanza*).
  - **Mundo 2-3**: Acera de 3 carriles por la Carrera 7ª (Centro Internacional) con escenografía larga sin repetición (6 paneles arquitectónicos: Estación Museo Nacional, Torres Tequendama, Museo Nacional, Torres & C.C. San Martín, Torre Colpatria / Edificio Púrpura nocturno y Plazoleta Centro Internacional), motos Rappi/AK R200, skaters, ñeros y poder **¡CHITE!** con burbuja expansiva y recarga.
  - **Cinemática `2-3 → 2-4`**: Llegada nocturna de Brayan a **Bosa La Esperanza (Interior 92)** a descansar y despertar al día siguiente en **camiseta de Pintuco, pantaloneta y chanclas**.
  - **Mundo 2-4**: Recorrido largo **ida y vuelta** por **Bosa La Esperanza** (6 paneles continuos sin repetición: Interior 92, Panadería Pau Pan R.D., Parque de Bosa La Esperanza, Cuadra Cra. 78g con camionetas, Colegio Cl. 77A Sur y Tienda La Esperanza) escapando de **perros callejeros perseguidores**, bicitaxis, vecinas y balones, comprando el almuerzo y regresando a **Interior 92**.
  - **Cinemática `2-4 → 2-5` (Intro Mundo 2-5)**: Al llegar a Interior 92, Brayan recibe un mensaje de texto de Majo Piza en su celular citándolo al día siguiente a empezar a trabajar con *"ropa cómoda y gorra para el sol"*.
- **Arquitectura Modular por Stages**: Motor ligero basado en `StageManager` listo para agregar el Capítulo 2 (`world2_1`, jefes, cinemáticas) sin duplicar lógica.
- **Zero Dependencias / ES Modules Nativos**: Funciona con `node server.js` en local o empaquetado a un único HTML autocontenido con `node scripts/build-standalone.js`.
- **Audio Sintetizado Chiptune**: Efectos SFX generados proceduralmente con Web Audio API.
- **Modos de Dificultad**:
  - *Modo Ligero*: 5 corazones, chiclets de la chaza curan +2 ♥.
  - *Modo Pesado*: 3 corazones, enemigos más veloces, chiclets curan +1 ♥.
- **Bilingüe (ES / EN)** y **Controles Responsivos** (teclado PC + controles táctiles móvil).

---

## 📁 Arquitectura del Proyecto

```text
brayanVideoGame/
├── index.html                               # Shell HTML semántico limpio
├── server.js                                # Servidor HTTP local sin dependencias (Node nativo)
├── styles/
│   └── main.css                             # Estilos 16-bit, layout responsivo, HUD y overlays
├── src/
│   ├── main.js                              # Bootstrap, registro de stages y game loop principal
│   ├── config/
│   │   └── i18n.js                          # Diccionario de textos ES/EN en vivo
│   ├── core/
│   │   ├── assets.js                        # Manifiesto de rutas de sprites/fondos y precarga
│   │   ├── audio.js                         # Sintetizador 16-bit Web Audio API (SFX)
│   │   ├── gameState.js                     # Estado global compartido (idioma, modo, stage activo)
│   │   ├── input.js                         # Enrutador unificado de teclado PC + botones táctiles
│   │   ├── renderer.js                      # Contexto Canvas 2D y helpers de dibujado pixel-art
│   │   ├── stageManager.js                  # Gestor de ciclo de vida y transiciones entre stages
│   │   └── ui.js                            # Referencias DOM, overlays (Pausa/Victoria/GameOver)
│   └── stages/
│       ├── titleStage.js                    # Stage 0: Pantalla de título y selector de dificultad
│       ├── introCutsceneStage.js            # Stage 1: Cinemática del lobby (entrevista + tropiezo)
│       ├── world1_1/                        # Stage 2: Mundo 1-1 — Carrera 7ª
│       │   ├── levelData.js                 # Blueprint de nivel (plataformas, enemigos, ítems)
│       │   ├── world1_1Stage.js             # Lógica de gameplay, físicas, IA y colisiones
│       │   └── world1_1Renderer.js          # Renderizado parallax de Carrera 7ª, sprites y HUD
│       ├── world1_2/                        # Stage 3: Mundo 1-2 — TransMilenio Hora Pico (~52s)
│       │   ├── levelData.js                 # Agenda de trayecto (52s), estaciones y dificultad
│       │   ├── world1_2Stage.js             # Mecánicas: Celular, Cosquillero y Gas Verde
│       │   └── world1_2Renderer.js          # Cabina 16-bit con ventanas transparentes + Bogotá en vivo
│       ├── cutscene1_2To1_3Stage.js         # Cinemática: Transbordo en Estación Calle 26 (bus G45 a Portal Sur)
│       ├── world1_3/                        # Stage 4: Mundo 1-3 — Portal Sur (8000px vertical)
│       │   ├── levelData.js                 # Plataformas verticales, torniquetes, Jefe del Fruver, Colados y Cantantes
│       │   ├── world1_3Stage.js             # IA de latigazos, parkour de colados y curación musical
│       │   └── world1_3Renderer.js          # Parallax Portal Sur, buses rojos/verdes dinámicos y HUD
│       ├── world1_4/                        # Stage 5: Mundo 1-4 — Asedio en Piamonte + Jefe Final
│       │   ├── levelData.js                 # Avenida Bosa Piamonte (refugios, bloques destructibles, capuchos)
│       │   ├── world1_4Stage.js             # Fase 1 (Helicóptero + Molotovs) y Fase 2 (Boss Arena Cancha)
│       │   └── world1_4Renderer.js          # Parallax Bosa Piamonte, Cancha microfútbol, barra HP Jefe y maletín
│       ├── cutscene1_4To2_1Stage.js         # Prólogo 1-4 → 2-1: Despertar fingido en oficina (sofá + Majo + asesores)
│       ├── world2_1/                        # Stage 6: Mundo 2-1 — Pasillos del Edificio (La Fotocopiadora)
│       │   ├── levelData.js                 # Pasillos, escritorios, cubículos, bodegueros youtubers y Señora de los Tintos
│       │   ├── world2_1Stage.js             # IA de Levy, Wally Ballena, Lalis Selfie, Paparazzi y Streamers
│       │   └── world2_1Renderer.js          # Parallax edificio, flashes, groserías, chorro ballena, lodo y Fotocopiadora
│       ├── cutscene2_1To2_2Stage.js         # Cinemática interactiva 2-1 → 2-2: Chairo de fotocopias + Quiz de 4 opciones
│       ├── world2_2/                        # Stage 7: Mundo 2-2 — A la Caza del Papel (Estampida de Lagartos)
│       │   ├── levelData.js                 # Oficinas, escritorios refugio, hojas/resmas y 3 tipos de lagartos
│       │   ├── world2_2Stage.js             # Recolección de hojas, estampidas sindicales (+25% prima) y lagartos velocistas
│       │   └── world2_2Renderer.js          # Parallax oficinas + sala sindical, alertas estampida y contador de hojas
│       ├── cutscene2_2To2_3Stage.js         # Cinemática 2-2 → 2-3: Entrega CV, Majo demoníaca rojo sangre y rumbo a Bosa
│       └── world2_3/                        # Stage 8: Mundo 2-3 — Acera Carrera 7ª (Centro Internacional, 3 carriles)
│           ├── levelData.js                 # Agenda de obstáculos en 3 carriles y secuencia de 6 paneles sin repetición
│           ├── world2_3Stage.js             # Mecánica 3 carriles, motos Rappi/AK, ñeros, skaters y poder ¡CHITE!
│           └── world2_3Renderer.js          # Panorama único 6 paneles 7ª Centro Int. (incl. San Martín y Torre Púrpura), acera ladrillo y ¡CHITE!
├── scripts/
│   └── build-standalone.js                  # Empaquetador opcional a 1 único HTML autocontenido (Base64)
└── assets/
    ├── backgrounds/                         # Fondos 16-bit por escenario
    │   ├── lobby.jpg
    │   ├── world_1_1_septima.jpg
    │   ├── world_1_2_transmi_interior.png
    │   ├── cutscene_estacion_calle26.jpg
    │   ├── world_1_3_portal_sur.jpg
    │   ├── world_1_4_bosa_piamonte.jpg
    │   └── world_1_4_cancha.jpg
    └── sprites/                             # Sprites organizados por rol
        ├── player/                          # brayan_idle/walk/trip/ko/phone/firm/briefcase.png
        ├── enemies/                         # nero_*, cosquillero, fruver_*, colado_*, capucho_molotov, helicopter_boss, boss_francia
        └── npcs/                            # chaza_lady, passenger_gas, cantante_transmi, majo/reporter/cameraman
```

---

## 🧩 Cómo Agregar un Nuevo Stage (ej. Mundo 2-1)

1. Agrega el fondo en `assets/backgrounds/world_2_1_*.jpg` y nuevos sprites en `assets/sprites/...`, luego regístralos en `src/core/assets.js`.
2. Crea la carpeta `src/stages/world2_1/` replicando la estructura de `world1_4/` (`levelData.js`, `world2_1Stage.js`, `world2_1Renderer.js`).
3. Registra el stage en `src/main.js` con `stageManager.register('WORLD_2_1', world2_1Stage)` y añádelo a `scripts/build-standalone.js`.

---

## ⌨️ Controles

| Acción | Teclado (PC) | Táctil (Móvil) |
|---|---|---|
| **Moverse / Esquivar (1-2)** | `←` / `→` o `A` / `D` | Botones `◀` / `▶` |
| **Saltar (1-1, 1-3, 1-4)** | `Espacio`, `↑` o `W` | Botón `SALTAR` |
| **Actitud Firme / Ventana (1-2)** | `Espacio`/`E` · `W`/`F` | Botones `FIRME` / `VENTANA` |
| **Agacharse / Maletín (1-4)** | `↓`/`S` · `J`/`Z`/`F`/`K`/`Shift` | Botones `CUBRIR` / `MALETÍN` |
| **Carriles / Poder ¡CHITE! (2-3)** | `↑`/`↓`/`W`/`S` · `Espacio` (`¡CHITE!`) | Botones `▲` / `▼` / `💨 ¡CHITE!` |
| **Pausa** | `P` o `Esc` | Botón `❚❚ PAUSA` |
| **Avanzar diálogos / Skip** | `Espacio` / `Enter` / `S` | Tocar diálogo / `SKIP >>` |
| **Cambiar Idioma** | `L` | Botones `ES` / `EN` |
| **Silenciar / Activar Sonido** | `M` | Botón `SFX: ON/OFF` |

---

## 🚀 Cómo Ejecutar en Local

```bash
node server.js
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
