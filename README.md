# brayanVideoGame 🕹️

**BRAYAN 16 BIT — Mundo 1-1: Carrera 7ª (Bogotá)**

Juego de plataformas y acción retro de 16 bits ambientado en la icónica Carrera Séptima de Bogotá, Colombia. Cuenta con cinemáticas estilo SNES, banda sonora y efectos de sonido generados con Web Audio API, soporte táctil (mobile) y teclado (PC), y selector de dificultad y lenguaje.

---

## 🎮 Características

- **Estilo Pixel Art 16-Bit**: 19 sprites y fondos originales retro (Brayan, Ñero, Doña de la Chaza, Camarógrafo, Reportera, Majo, Activistas, Lobby, etc.).
- **Standalone / Zero dependencias**: El juego funciona directamente abriendo el archivo HTML en cualquier navegador moderno sin necesidad de instalar librerías externas o servidores backend.
- **Audio Sintetizado**: Música y efectos SFX generados proceduralmente vía Web Audio API nativo.
- **Modos de Dificultad**:
  - *Modo Ligero*: 5 corazones, chiclets de la chaza curan +2 ♥.
  - *Modo Pesado*: 3 corazones, enemigos más veloces, chiclets curan +1 ♥.
- **Bilingüe**: Selector de idioma Español / English en tiempo real.
- **Controles Responsivos**: Compatible con teclado para PC y controles táctiles en pantalla para móviles/tablets.

---

## ⌨️ Controles

| Acción | Teclado (PC) | Táctil (Móvil) |
|---|---|---|
| **Moverse a la izquierda / derecha** | Flechas `←` / `→` o `A` / `D` | Botones `◀` / `▶` |
| **Saltar** | `Espacio`, `↑` o `W` | Botón `▲` |
| **Avanzar diálogos / Skip** | `Espacio` o `Enter` | Tocar la caja de diálogo o botón `SKIP >>` |
| **Cambiar Idioma** | Tecla `L` | Botón de bandera en la barra superior |
| **Silenciar / Activar Sonido** | Tecla `M` | Botón `SFX: ON/OFF` |

---

## 📁 Estructura del Proyecto

```text
brayanVideoGame/
├── index.html                                    # Punto de entrada principal (ideal para GitHub Pages)
├── BRAYAN_16BIT_BOGOTA_MUNDO_1-1_FINAL (1).html  # Versión original autónoma con assets integrados
├── README.md                                     # Documentación del proyecto
├── .gitignore                                    # Archivos ignorados por Git
└── assets/                                       # Colección completa de los 19 sprites e imágenes (PNG/JPG)
    ├── act_sign_up.png
    ├── act_spray_high.png
    ├── act_spray_low.png
    ├── act_throw.png
    ├── act_walk1.png
    ├── act_walk2.png
    ├── brayan_idle.png
    ├── brayan_ko.png
    ├── brayan_trip.png
    ├── brayan_walk1.png
    ├── brayan_walk2.png
    ├── cameraman.png
    ├── chaza_lady.png
    ├── lobby.jpg
    ├── majo_smile.png
    ├── majo_talk.png
    ├── nero_lunge.png
    ├── nero_walk.png
    └── reporter.png
```

---

## 🚀 Cómo Ejecutar

1. Clona el repositorio:
   ```bash
   git clone https://github.com/joanroamora/brayanVideoGame.git
   ```
2. Abre `index.html` en tu navegador favorito (Chrome, Edge, Firefox, Safari).
3. ¡A esquivar huecos y ñeros en la Séptima!
