# Physics Sound Lab

**Donde las ecuaciones se convierten en sonido**

Colección de simulaciones interactivas que exploran la intersección entre física, matemáticas y música. Cada proyecto convierte fenómenos físicos en experiencias sonoras.

🔗 **[Ver Demo](https://cjlkaiser-cpu.github.io/physics-sound-lab/)**

---

## Proyectos

### 🎵 Metrónomos Físicos
7 simulaciones donde sistemas físicos generan ritmo:

| Simulación | Física | Demo |
|------------|--------|------|
| Péndulo Simple | Oscilación no lineal, RK4 | [▶](https://cjlkaiser-cpu.github.io/metronomo-fisico/) |
| Oscilador Armónico | Masa-resorte, MAS | [▶](https://cjlkaiser-cpu.github.io/metronomo-resorte/) |
| Péndulos Acoplados | Polirritmos naturales | [▶](https://cjlkaiser-cpu.github.io/metronomo-polirritmico/) |
| Figuras de Lissajous | Oscilaciones perpendiculares | [▶](https://cjlkaiser-cpu.github.io/metronomo-lissajous/) |
| Onda Estacionaria | Modos normales, armónicos | [▶](https://cjlkaiser-cpu.github.io/metronomo-onda/) |
| Rebote Elástico | Colisiones, restitución | [▶](https://cjlkaiser-cpu.github.io/metronomo-rebote/) |
| Metrónomo Kepleriano | Órbitas elípticas | [▶](https://cjlkaiser-cpu.github.io/metronomo-kepler/) |

### 🎹 Música Generativa
Sistemas donde física y matemáticas crean composiciones emergentes:

| Proyecto | Descripción | Demo | Artículo |
|----------|-------------|------|----------|
| **Harmonices Mundi** | Sistema Solar sonificado según Kepler (1619). 8 planetas cantando con física orbital real. | [▶](https://cjlkaiser-cpu.github.io/harmonices-mundi/) | [📄](https://cjlkaiser-cpu.github.io/physics-sound-lab/papers/harmonices-mundi/ARTICLE_v1.html) |
| **Tonnetz Atractor** | Física del caos + teoría Neo-Riemanniana. Partícula magnética genera acordes. | [▶](https://cjlkaiser-cpu.github.io/tonnetz-atractor/) | [📄](https://cjlkaiser-cpu.github.io/physics-sound-lab/papers/paper-tonnetz-atractor/ARTICLE_v1.html) |

---

## Artículos

### De Kepler a Web Audio: Reviviendo la Música de las Esferas
Cómo una idea de 1619 se convierte en música generativa en el navegador.
- [Leer artículo](https://cjlkaiser-cpu.github.io/physics-sound-lab/papers/harmonices-mundi/ARTICLE_v1.html)

### El Atractor del Tonnetz: Cuando el Caos Compone Música
Física de sistemas caóticos + teoría musical del siglo XIX = música generativa del siglo XXI.
- [Leer artículo](https://cjlkaiser-cpu.github.io/physics-sound-lab/papers/paper-tonnetz-atractor/ARTICLE_v1.html)

---

## Tecnologías

- **Canvas 2D** - Visualización en tiempo real
- **Web Audio API** - Síntesis de sonido
- **Métodos numéricos** - RK4, Newton-Raphson, diferencias finitas
- **Sin dependencias** - HTML autocontenido, Tailwind CSS (CDN)

---

## Estructura

```
physics-sound-lab/
├── index.html              # Hub principal
├── metronomos/             # 7 simulaciones físicas → sonido
├── generativos/            # Música emergente
└── papers/                 # Artículos divulgativos
```

---

## Autor

**Carlos Lorente Kaiser**

- GitHub: [@cjlkaiser-cpu](https://github.com/cjlkaiser-cpu)

---

## Licencia

MIT
