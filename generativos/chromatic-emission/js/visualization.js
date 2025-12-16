/**
 * Chromatic Emission - Visualización
 *
 * Fusión del Modelo de Bohr con Pitch-Class Set Theory:
 * - Vista MACRO: Mapa orbital de set-classes por cardinalidad
 * - Vista MICRO: Átomo de Bohr musical para cada set
 *
 * Las notas orbitan como electrones, los intervalos se emiten como fotones.
 */

/**
 * CLASE BOHR ATOM
 * Visualiza un set-class como un átomo de Bohr
 * Núcleo = Nombre del set, Electrones = Pitch classes
 */
class BohrAtom {
  constructor() {
    this.animationTime = 0;
    this.currentSet = null;
    this.previousSet = null;
    this.transitionProgress = 1;
    this.transitionStart = 0;

    // Nombres de notas en el círculo cromático
    this.noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

    // Velocidades orbitales por electrón (para animación)
    this.orbitalSpeeds = [];
  }

  setSet(newSet) {
    if (!newSet) return;

    if (this.currentSet && this.currentSet.forte !== newSet.forte) {
      this.previousSet = this.currentSet;
      this.transitionProgress = 0;
      this.transitionStart = performance.now();
    }

    this.currentSet = newSet;

    // Generar velocidades orbitales únicas para cada electrón
    this.orbitalSpeeds = newSet.primeForm.map((_, i) =>
      0.3 + Math.random() * 0.2 + i * 0.05
    );
  }

  update(deltaTime) {
    this.animationTime += deltaTime;

    // Actualizar transición
    if (this.transitionProgress < 1) {
      const elapsed = performance.now() - this.transitionStart;
      this.transitionProgress = Math.min(1, elapsed / 400);
      this.transitionProgress = this.easeOutCubic(this.transitionProgress);
    }
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  draw(ctx, centerX, centerY, radius) {
    if (!this.currentSet) return;

    ctx.save();

    // Panel de fondo
    const panelPadding = 30;
    const panelWidth = radius * 2 + panelPadding * 2;
    const panelHeight = radius * 2 + panelPadding * 2 + 55;

    ctx.fillStyle = 'rgba(8, 12, 20, 0.92)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    this.roundRect(ctx,
      centerX - radius - panelPadding,
      centerY - radius - panelPadding,
      panelWidth, panelHeight, 12
    );
    ctx.fill();
    ctx.stroke();

    // Título
    ctx.fillStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`CARDINALIDAD ${this.currentSet.cardinality}`, centerX, centerY - radius - 12);

    // Dibujar círculo cromático (12 posiciones)
    this.drawChromaticCircle(ctx, centerX, centerY, radius);

    // Dibujar órbitas
    this.drawOrbits(ctx, centerX, centerY, radius);

    // Dibujar núcleo
    this.drawNucleus(ctx, centerX, centerY);

    // Dibujar electrones (notas)
    this.drawElectrons(ctx, centerX, centerY, radius);

    // Info del set
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentSet.name || this.currentSet.forte, centerX, centerY + radius + 25);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.fillText(`IV: <${this.currentSet.intervalVector.join('')}>`, centerX, centerY + radius + 42);

    ctx.restore();
  }

  drawChromaticCircle(ctx, cx, cy, radius) {
    // Marcadores de las 12 posiciones cromáticas
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const isActive = this.currentSet.primeForm.includes(i);

      // Marcador exterior
      const markerDist = radius + 8;
      const mx = cx + Math.cos(angle) * markerDist;
      const my = cy + Math.sin(angle) * markerDist;

      ctx.beginPath();
      ctx.arc(mx, my, isActive ? 3 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? 'rgba(34, 211, 238, 0.8)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
    }
  }

  drawOrbits(ctx, cx, cy, radius) {
    // Tres órbitas concéntricas
    for (let i = 1; i <= 3; i++) {
      const orbitRadius = radius * (i / 3);

      ctx.beginPath();
      ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.06 * i})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawNucleus(ctx, cx, cy) {
    const nucleusRadius = 20;

    // Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.currentSet.getColor();

    // Gradiente del núcleo
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucleusRadius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, this.currentSet.getColor());
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');

    ctx.beginPath();
    ctx.arc(cx, cy, nucleusRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Número Forte
    const forteNum = this.currentSet.forte.split('-')[1];
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(forteNum, cx, cy);
  }

  drawElectrons(ctx, cx, cy, radius) {
    const electronRadius = radius * 0.75;

    this.currentSet.primeForm.forEach((note, idx) => {
      // Ángulo con animación orbital sutil
      const baseAngle = (note / 12) * Math.PI * 2 - Math.PI / 2;
      const orbitalSpeed = this.orbitalSpeeds[idx] || 0.3;
      const orbitWobble = Math.sin(this.animationTime * orbitalSpeed) * 0.04;
      const angle = baseAngle + orbitWobble;

      // Distancia con pequeña variación por índice
      const dist = electronRadius * (0.95 + (idx % 2) * 0.1);

      const ex = cx + Math.cos(angle) * dist;
      const ey = cy + Math.sin(angle) * dist;

      // Línea de conexión al núcleo
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Glow del electrón
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.currentSet.getColor();

      // Electrón
      ctx.beginPath();
      ctx.arc(ex, ey, 8, 0, Math.PI * 2);
      ctx.fillStyle = this.currentSet.getColor();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Número de pitch-class
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(note.toString(), ex, ey);

      // Nombre de nota fuera
      const labelDist = radius + 22;
      const labelAngle = (note / 12) * Math.PI * 2 - Math.PI / 2;
      const lx = cx + Math.cos(labelAngle) * labelDist;
      const ly = cy + Math.sin(labelAngle) * labelDist;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '9px monospace';
      ctx.fillText(this.noteNames[note], lx, ly);
    });
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
}


/**
 * CLASE SET-CLASS VISUALIZATION (Vista Macro)
 * Mapa orbital de todos los set-classes organizados por cardinalidad
 */
class SetClassVisualization {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    // Cardinalidades visibles
    this.cardinalityRange = [3, 4, 5, 6];
    this.activeCardinality = null;

    // Configuración de órbitas con colores por cardinalidad
    this.orbitConfig = {
      3: { radius: 100, color: 'rgba(34, 211, 238, 0.2)', label: 'Tricordios' },
      4: { radius: 180, color: 'rgba(251, 191, 36, 0.2)', label: 'Tetracordios' },
      5: { radius: 260, color: 'rgba(244, 114, 182, 0.2)', label: 'Pentacordios' },
      6: { radius: 340, color: 'rgba(167, 139, 250, 0.2)', label: 'Hexacordios' }
    };

    // Posiciones de cada set-class
    this.setPositions = new Map();

    // Interacción
    this.hoveredSet = null;
    this.selectedSet = null;
    this.showZPortals = true;

    // Componentes
    this.bohrAtom = new BohrAtom();
    this.lastTime = performance.now();

    this.calculatePositions();
    this.setupInteraction();
  }

  calculatePositions() {
    const { SET_BY_CARDINALITY } = window.SetTheory;

    this.cardinalityRange.forEach(card => {
      const sets = SET_BY_CARDINALITY[card] || [];
      const orbit = this.orbitConfig[card];
      if (!orbit) return;

      // Ordenar por similitud de interval vector
      const sortedSets = this.sortByIVSimilarity(sets);

      sortedSets.forEach((setClass, index) => {
        const angle = (index / sortedSets.length) * Math.PI * 2 - Math.PI / 2;
        const x = this.centerX + Math.cos(angle) * orbit.radius;
        const y = this.centerY + Math.sin(angle) * orbit.radius;

        this.setPositions.set(setClass.forte, {
          x, y, angle,
          radius: orbit.radius,
          setClass,
          nodeRadius: 7
        });
      });
    });
  }

  sortByIVSimilarity(sets) {
    if (sets.length <= 1) return sets;

    const sorted = [sets[0]];
    const remaining = sets.slice(1);

    while (remaining.length > 0) {
      const last = sorted[sorted.length - 1];
      let minDist = Infinity;
      let minIndex = 0;

      remaining.forEach((set, i) => {
        const dist = window.SetTheory.SetClass.distance(last, set);
        if (dist < minDist) {
          minDist = dist;
          minIndex = i;
        }
      });

      sorted.push(remaining.splice(minIndex, 1)[0]);
    }

    return sorted;
  }

  setupInteraction() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.hoveredSet = null;

      for (const [forte, pos] of this.setPositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pos.nodeRadius + 10) {
          this.hoveredSet = pos.setClass;
          break;
        }
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.hoveredSet) {
        this.selectedSet = this.hoveredSet;
        if (this.onSetSelected) {
          this.onSetSelected(this.selectedSet);
        }
      }
    });
  }

  draw(particle = null, photonSystem = null, spectrumAnalyzer = null) {
    const ctx = this.ctx;
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Actualizar átomo de Bohr
    this.bohrAtom.update(deltaTime);

    // Fondo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, this.width, this.height);

    // Dibujar órbitas
    this.drawOrbits(ctx);

    // Z-Portal connections
    if (this.showZPortals) {
      this.drawZPortalConnections(ctx);
    }

    // Nodos de set-classes
    this.drawSetNodes(ctx);

    // Partícula
    if (particle) {
      this.drawParticle(ctx, particle);
    }

    // Fotones
    if (photonSystem) {
      photonSystem.draw(ctx);
    }

    // Espectro de emisión
    if (spectrumAnalyzer) {
      spectrumAnalyzer.draw(ctx, 15, this.height - 90, 150, 75);
    }

    // Átomo de Bohr (micro view)
    const activeSet = particle?.currentSet || this.selectedSet || this.hoveredSet;
    if (activeSet) {
      this.bohrAtom.setSet(activeSet);
      const bohrX = this.width - 100;
      const bohrY = 120;
      this.bohrAtom.draw(ctx, bohrX, bohrY, 65);
    }

    // Label del hover
    if (this.hoveredSet && !particle?.currentSet) {
      this.drawHoverLabel(ctx, this.hoveredSet);
    }
  }

  drawOrbits(ctx) {
    this.cardinalityRange.forEach(card => {
      const orbit = this.orbitConfig[card];
      if (!orbit) return;

      if (this.activeCardinality && this.activeCardinality !== card) return;

      // Órbita
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, orbit.radius, 0, Math.PI * 2);
      ctx.strokeStyle = orbit.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px monospace';
      ctx.fillText(`Card. ${card}`, this.centerX + orbit.radius + 8, this.centerY - 3);
    });
  }

  drawZPortalConnections(ctx) {
    const { Z_PAIRS } = window.SetTheory;
    const drawnPairs = new Set();

    Object.entries(Z_PAIRS).forEach(([f1, f2]) => {
      const pairKey = [f1, f2].sort().join('-');
      if (drawnPairs.has(pairKey)) return;
      drawnPairs.add(pairKey);

      const pos1 = this.setPositions.get(f1);
      const pos2 = this.setPositions.get(f2);
      if (!pos1 || !pos2) return;

      if (this.activeCardinality &&
          pos1.setClass.cardinality !== this.activeCardinality &&
          pos2.setClass.cardinality !== this.activeCardinality) return;

      // Curva de conexión
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(pos1.x, pos1.y);

      const midX = (pos1.x + pos2.x) / 2;
      const midY = (pos1.y + pos2.y) / 2;
      const ctrlX = midX + (this.centerX - midX) * 0.3;
      const ctrlY = midY + (this.centerY - midY) * 0.3;

      ctx.quadraticCurveTo(ctrlX, ctrlY, pos2.x, pos2.y);
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  drawSetNodes(ctx) {
    for (const [forte, pos] of this.setPositions) {
      const setClass = pos.setClass;

      if (this.activeCardinality && setClass.cardinality !== this.activeCardinality) continue;

      const isHovered = this.hoveredSet === setClass;
      const isSelected = this.selectedSet === setClass;
      const isZRelated = setClass.zMate !== null;

      let r = pos.nodeRadius;
      if (isHovered) r *= 1.6;
      if (isSelected) r *= 1.3;

      const color = setClass.getColor();

      // Glow para Z-related
      if (isZRelated || isHovered) {
        ctx.shadowBlur = isHovered ? 15 : 8;
        ctx.shadowColor = isZRelated ? 'rgba(0, 255, 200, 0.6)' : color;
      }

      // Nodo
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#fff' : color;
      ctx.fill();

      ctx.shadowBlur = 0;

      // Borde
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
      }
    }
  }

  drawParticle(ctx, particle) {
    // Trail
    if (particle.trail && particle.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
      particle.trail.forEach((p, i) => {
        if (i > 0) ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Glow
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
    ctx.fill();

    // Partícula
    const grad = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, 12
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, 'rgba(200, 220, 255, 0.9)');
    grad.addColorStop(1, 'rgba(100, 150, 255, 0.3)');

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawHoverLabel(ctx, setClass) {
    const pos = this.setPositions.get(setClass.forte);
    if (!pos) return;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(setClass.forte, pos.x, pos.y - pos.nodeRadius - 10);
  }

  getNearestSet(x, y) {
    let nearest = null;
    let minDist = Infinity;

    for (const [forte, pos] of this.setPositions) {
      if (this.activeCardinality && pos.setClass.cardinality !== this.activeCardinality) continue;

      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        nearest = pos.setClass;
      }
    }

    return { set: nearest, distance: minDist };
  }

  getPosition(forte) {
    return this.setPositions.get(forte);
  }

  setActiveCardinality(card) {
    this.activeCardinality = card;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;

    const scale = Math.min(width, height) / 800;
    Object.keys(this.orbitConfig).forEach(card => {
      const baseRadii = { 3: 100, 4: 180, 5: 260, 6: 340 };
      this.orbitConfig[card].radius = baseRadii[card] * scale;
    });

    this.calculatePositions();
  }
}

// Exportar
window.BohrAtom = BohrAtom;
window.SetClassVisualization = SetClassVisualization;
