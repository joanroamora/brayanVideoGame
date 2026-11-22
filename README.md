# brayanVideoGame 🕹️

**BRAYAN 16 BIT — Mundo 1-1: Carrera 7ª (Bogotá)**

Juego de plataformas y acción retro de 16 bits estilo SNES ambientado en la icónica Carrera Séptima de Bogotá, Colombia. Construido con **HTML5 Canvas + ES Modules nativos** (cero frameworks pesados, cero dependencias externas, arquitectura modular por *stages* replicable y escalable).

---

## 🎮 Características

- **Pixel Art 16-Bit Auténtico**: 20 sprites y fondos panorámicos originales en estilo SNES (Brayan, Ñero con cuchillo en embestida, Doña de la Chaza, Activistas, Majo, Reportera, Camarógrafo, Lobby y Carrera 7ª con Monserrate y Torre Colpatria).
- **Arquitectura Modular por Stages**: Motor ligero basado en `StageManager` para agregar nuevos mundos (`world1_2`, `world1_3`, jefes, cinemáticas) sin duplicar lógica.
- **Zero Dependencias / ES Modules Nativos**: Funciona directamente con `node server.js` en local o desplegado en GitHub Pages.
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
│       └── world1_2/                        # Stage 3: Mundo 1-2 — TransMilenio Hora Pico (~52s)
│           ├── levelData.js                 # Agenda de trayecto (52s), estaciones y dificultad
│           ├── world1_2Stage.js             # Mecánicas: Celular, Cosquillero y Gas Verde
│           └── world1_2Renderer.js          # Cabina 16-bit con ventanas transparentes + Bogotá en vivo
└── assets/
    ├── backgrounds/                         # Fondos 16-bit por escenario
    │   ├── lobby.jpg
    │   ├── world_1_1_septima.jpg
    │   └── world_1_2_transmi_interior.png
    └── sprites/                             # Sprites organizados por rol
        ├── player/                          # brayan_idle/walk/trip/ko/phone/firm.png
        ├── enemies/                         # nero_walk/lunge.png, cosquillero.png, act_*.png
        └── npcs/                            # chaza_lady.png, passenger_gas.png, majo/reporter/cameraman.png
```

---

## 🧩 Cómo Agregar un Nuevo Stage (ej. Mundo 1-2)

1. Agrega el fondo en `assets/backgrounds/world_1_2_*.jpg` y nuevos sprites en `assets/sprites/...`, luego regístralos en `src/core/assets.js`.
2. Crea la carpeta `src/stages/world1_2/` replicando la estructura de `world1_1/` (`levelData.js`, `world1_2Stage.js`, `world1_2Renderer.js`).
3. Registra el stage en `src/main.js` con `stageManager.register('WORLD_1_2', world1_2Stage)`.

---

## ⌨️ Controles

| Acción | Teclado (PC) | Táctil (Móvil) |
|---|---|---|
| **Moverse** | `←` / `→` o `A` / `D` | Botones `◀` / `▶` |
| **Saltar** | `Espacio`, `↑` o `W` | Botón `SALTAR` |
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
