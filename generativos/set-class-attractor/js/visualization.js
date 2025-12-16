/**
 * Set-Class Attractor - Visualizacion
 * Distribucion radial por cardinalidad con Heat Map de tension
 */

class SetClassVisualization {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    // Cardinalidades a mostrar (3-6 son las mas interesantes)
    this.cardinalityRange = [3, 4, 5, 6];
    this.activeCardinality = null; // null = mostrar todas

    // Configuracion de orbitas (ampliadas)
    this.orbitConfig = {
      3: { radius: 100, color: 'rgba(100, 150, 255, 0.3)' },
      4: { radius: 180, color: 'rgba(150, 100, 255, 0.3)' },
      5: { radius: 260, color: 'rgba(200, 100, 200, 0.3)' },
      6: { radius: 340, color: 'rgba(255, 100, 150, 0.3)' }
    };

    // Posiciones calculadas de cada set class
    this.setPositions = new Map();

    // Hover/seleccion
    this.hoveredSet = null;
    this.selectedSet = null;

    // Z-Portal connections visibles
    this.showZPortals = true;

    this.calculatePositions();
    this.setupInteraction();
  }

  calculatePositions() {
    const { SET_BY_CARDINALITY } = window.SetTheory;

    this.cardinalityRange.forEach(card => {
      const sets = SET_BY_CARDINALITY[card] || [];
      const orbit = this.orbitConfig[card];
      if (!orbit) return;

      // Distribuir sets angularmente, agrupados por similitud
      const sortedSets = this.sortByIVSimilarity(sets);

      sortedSets.forEach((setClass, index) => {
        const angle = (index / sortedSets.length) * Math.PI * 2 - Math.PI / 2;
        const x = this.centerX + Math.cos(angle) * orbit.radius;
        const y = this.centerY + Math.sin(angle) * orbit.radius;

        this.setPositions.set(setClass.forte, {
          x, y,
          angle,
          radius: orbit.radius,
          setClass,
          nodeRadius: 8
        });
      });
    });
  }

  // Ordenar por similitud de Interval Vector para clustering visual
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

        if (dist < pos.nodeRadius + 5) {
          this.hoveredSet = pos.setClass;
          break;
        }
      }

      this.canvas.style.cursor = this.hoveredSet ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredSet) {
        this.selectedSet = this.hoveredSet;
        if (this.onSetSelected) {
          this.onSetSelected(this.selectedSet);
        }
      }
    });
  }

  draw(particle = null, ghostTraces = []) {
    const ctx = this.ctx;

    // Fondo
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, this.width, this.height);

    // Dibujar orbitas
    this.drawOrbits();

    // Dibujar Z-Portal connections
    if (this.showZPortals) {
      this.drawZPortalConnections();
    }

    // Dibujar ghost traces
    ghostTraces.forEach(ghost => {
      this.drawGhost(ghost);
    });

    // Dibujar nodos de set classes
    this.drawSetNodes();

    // Dibujar particula
    if (particle) {
      this.drawParticle(particle);
    }

    // Dibujar info del hover
    if (this.hoveredSet) {
      this.drawHoverInfo(this.hoveredSet);
    }
  }

  drawOrbits() {
    const ctx = this.ctx;

    this.cardinalityRange.forEach(card => {
      const orbit = this.orbitConfig[card];
      if (!orbit) return;

      // Skip si hay cardinalidad activa y no es esta
      if (this.activeCardinality && this.activeCardinality !== card) return;

      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, orbit.radius, 0, Math.PI * 2);
      ctx.strokeStyle = orbit.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label de cardinalidad
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '11px monospace';
      ctx.fillText(`Card. ${card}`, this.centerX + orbit.radius + 10, this.centerY - 5);
    });
  }

  drawZPortalConnections() {
    const ctx = this.ctx;
    const { Z_PAIRS } = window.SetTheory;

    const drawnPairs = new Set();

    Object.entries(Z_PAIRS).forEach(([forte1, forte2]) => {
      const pairKey = [forte1, forte2].sort().join('-');
      if (drawnPairs.has(pairKey)) return;
      drawnPairs.add(pairKey);

      const pos1 = this.setPositions.get(forte1);
      const pos2 = this.setPositions.get(forte2);

      if (!pos1 || !pos2) return;

      // Skip si cardinalidad no es visible
      if (this.activeCardinality &&
          pos1.setClass.cardinality !== this.activeCardinality &&
          pos2.setClass.cardinality !== this.activeCardinality) return;

      // Linea punteada entre Z-mates
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.moveTo(pos1.x, pos1.y);

      // Curva bezier para conexiones entre orbitas
      const midX = (pos1.x + pos2.x) / 2;
      const midY = (pos1.y + pos2.y) / 2;
      const pullToCenter = 0.3;
      const ctrlX = midX + (this.centerX - midX) * pullToCenter;
      const ctrlY = midY + (this.centerY - midY) * pullToCenter;

      ctx.quadraticCurveTo(ctrlX, ctrlY, pos2.x, pos2.y);
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  drawSetNodes() {
    const ctx = this.ctx;

    for (const [forte, pos] of this.setPositions) {
      const setClass = pos.setClass;

      // Skip si cardinalidad no es visible
      if (this.activeCardinality && setClass.cardinality !== this.activeCardinality) continue;

      const isHovered = this.hoveredSet === setClass;
      const isSelected = this.selectedSet === setClass;
      const isZRelated = setClass.zMate !== null;

      // Radio del nodo
      let radius = pos.nodeRadius;
      if (isHovered) radius *= 1.5;
      if (isSelected) radius *= 1.3;

      // Color basado en tension (Heat Map)
      const color = setClass.getColor();

      // Glow para Z-related sets
      if (isZRelated) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 200, 0.2)';
        ctx.fill();
      }

      // Nodo principal
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Borde
      ctx.strokeStyle = isSelected ? '#ffffff' : (isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)');
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      // Label pequeno
      if (isHovered || isSelected) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(forte, pos.x, pos.y - radius - 5);
      }
    }
  }

  drawParticle(particle) {
    const ctx = this.ctx;

    // Trail
    if (particle.trail && particle.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
      particle.trail.forEach((point, i) => {
        if (i > 0) ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Particula principal
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 12, 0, Math.PI * 2);

    // Gradiente radial
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, 12
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Glow exterior
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
    ctx.fill();
  }

  drawGhost(ghost) {
    const ctx = this.ctx;
    const alpha = ghost.opacity * 0.6;
    const brightness = ghost.brightness || 1.0;

    // Halo exterior
    ctx.beginPath();
    ctx.arc(ghost.position.x, ghost.position.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 200, 255, ${alpha * 0.2 * brightness})`;
    ctx.fill();

    // Centro
    ctx.beginPath();
    ctx.arc(ghost.position.x, ghost.position.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * brightness})`;
    ctx.fill();
  }

  drawHoverInfo(setClass) {
    const ctx = this.ctx;
    const pos = this.setPositions.get(setClass.forte);
    if (!pos) return;

    // Panel de info
    const padding = 10;
    const lineHeight = 16;
    const lines = [
      `Forte: ${setClass.forte}`,
      `Prime: [${setClass.primeForm.join(', ')}]`,
      `IV: [${setClass.intervalVector.join(', ')}]`,
      `Tension: ${(setClass.tension * 100).toFixed(0)}%`
    ];

    if (setClass.name) {
      lines.splice(1, 0, setClass.name);
    }

    if (setClass.zMate) {
      lines.push(`Z-mate: ${setClass.zMate}`);
    }

    const boxWidth = 160;
    const boxHeight = lines.length * lineHeight + padding * 2;

    // Posicion del panel (evitar salir del canvas)
    let boxX = pos.x + 20;
    let boxY = pos.y - boxHeight / 2;

    if (boxX + boxWidth > this.width) boxX = pos.x - boxWidth - 20;
    if (boxY < 0) boxY = 10;
    if (boxY + boxHeight > this.height) boxY = this.height - boxHeight - 10;

    // Fondo del panel
    ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = setClass.getColor();
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    lines.forEach((line, i) => {
      ctx.fillText(line, boxX + padding, boxY + padding + (i + 1) * lineHeight - 4);
    });
  }

  // Obtener el set class mas cercano a una posicion
  getNearestSet(x, y) {
    let nearest = null;
    let minDist = Infinity;

    for (const [forte, pos] of this.setPositions) {
      // Skip si cardinalidad no es visible
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

  // Obtener posicion de un set class por su Forte number
  getPosition(forte) {
    return this.setPositions.get(forte);
  }

  // Cambiar cardinalidad activa
  setActiveCardinality(card) {
    this.activeCardinality = card;
  }

  // Resize handler
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;

    // Recalcular radios proporcionalmente
    const scale = Math.min(width, height) / 800;
    Object.keys(this.orbitConfig).forEach(card => {
      const baseRadii = { 3: 100, 4: 180, 5: 260, 6: 340 };
      this.orbitConfig[card].radius = baseRadii[card] * scale;
    });

    this.calculatePositions();
  }
}

// Exportar
window.SetClassVisualization = SetClassVisualization;
