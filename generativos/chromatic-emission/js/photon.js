/**
 * Chromatic Emission - Sistema de Fotones
 *
 * El fotón musical: cuando una nota (electrón) salta de una posición a otra,
 * emite un "fotón" cuya energía es proporcional al intervalo del salto.
 *
 * Analogía física:
 *   ΔE = hν  →  La diferencia de energía determina la frecuencia del fotón
 *   ΔPitch = Intervalo  →  El salto de nota determina el "color" del intervalo
 *
 * Intervalos pequeños (semitonos) = Baja energía = Rojo/Cálido = Suave
 * Intervalos grandes (quintas) = Alta energía = Azul/Brillante = Intenso
 */

class PhotonSystem {
  constructor() {
    this.photons = [];
    this.maxPhotons = 100;

    // Fotones sonoros (atraviesan nodos y los hacen sonar)
    this.sonorousPhotons = true;
    this.onNodeExcited = null; // Callback opcional

    // Espectro de intervalos (clase de intervalo → color)
    // ic1 = semitono, ic6 = tritono
    this.intervalSpectrum = {
      1: { color: '#ff4444', energy: 0.17, name: 'm2/M7', wavelength: 700 },  // Rojo - baja energía
      2: { color: '#ff8844', energy: 0.33, name: 'M2/m7', wavelength: 620 },  // Naranja
      3: { color: '#ffff44', energy: 0.50, name: 'm3/M6', wavelength: 580 },  // Amarillo
      4: { color: '#44ff44', energy: 0.67, name: 'M3/m6', wavelength: 530 },  // Verde
      5: { color: '#4488ff', energy: 0.83, name: 'P4/P5', wavelength: 470 },  // Azul - alta energía
      6: { color: '#aa44ff', energy: 1.00, name: 'tritono', wavelength: 420 } // Violeta - máxima
    };

    // Nombres de notas
    this.noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  }

  /**
   * Calcular la clase de intervalo entre dos pitch classes
   */
  intervalClass(pc1, pc2) {
    let interval = Math.abs(pc2 - pc1);
    if (interval > 6) interval = 12 - interval;
    return interval;
  }

  /**
   * Analizar el voice leading entre dos sets y generar fotones
   * @param {Array} oldNotes - Notas del acorde anterior [0, 4, 7]
   * @param {Array} newNotes - Notas del acorde nuevo [0, 3, 7]
   * @param {Object} sourcePos - Posición origen {x, y}
   * @returns {Array} Lista de fotones generados
   */
  analyzeVoiceLeading(oldNotes, newNotes, sourcePos) {
    const emissions = [];

    // Encontrar el voice leading óptimo (mínimo movimiento total)
    const voiceLeading = this.findOptimalVoiceLeading(oldNotes, newNotes);

    voiceLeading.forEach(movement => {
      if (movement.interval > 0) {
        // Crear fotón por cada movimiento de voz
        const photon = this.createPhoton(
          movement.from,
          movement.to,
          movement.interval,
          sourcePos
        );
        emissions.push(photon);
      }
    });

    return emissions;
  }

  /**
   * Encontrar el voice leading óptimo entre dos sets
   * Minimiza el movimiento total de las voces
   */
  findOptimalVoiceLeading(oldNotes, newNotes) {
    // Caso simple: misma cardinalidad
    if (oldNotes.length === newNotes.length) {
      return this.matchVoices(oldNotes, newNotes);
    }

    // Cardinalidades diferentes: notas que se añaden/eliminan
    const oldSet = new Set(oldNotes);
    const newSet = new Set(newNotes);

    const movements = [];
    const matched = new Set();

    // Primero: notas que permanecen (intervalo 0)
    oldNotes.forEach(note => {
      if (newSet.has(note)) {
        movements.push({ from: note, to: note, interval: 0 });
        matched.add(note);
      }
    });

    // Notas que se mueven
    const unmatched = oldNotes.filter(n => !newSet.has(n));
    const newUnmatched = newNotes.filter(n => !oldSet.has(n) && !matched.has(n));

    // Emparejar notas restantes por cercanía
    unmatched.forEach(oldNote => {
      if (newUnmatched.length > 0) {
        // Encontrar la nota más cercana
        let minDist = Infinity;
        let minIdx = 0;
        newUnmatched.forEach((newNote, idx) => {
          const dist = this.intervalClass(oldNote, newNote);
          if (dist < minDist) {
            minDist = dist;
            minIdx = idx;
          }
        });
        const newNote = newUnmatched.splice(minIdx, 1)[0];
        movements.push({
          from: oldNote,
          to: newNote,
          interval: this.intervalClass(oldNote, newNote)
        });
      } else {
        // Nota que desaparece (emite fotón hacia afuera)
        movements.push({ from: oldNote, to: null, interval: 6, type: 'decay' });
      }
    });

    // Notas que aparecen de nuevo (absorción de fotón)
    newUnmatched.forEach(newNote => {
      movements.push({ from: null, to: newNote, interval: 6, type: 'absorption' });
    });

    return movements;
  }

  /**
   * Emparejar voces de manera óptima (Hungarian algorithm simplificado)
   */
  matchVoices(oldNotes, newNotes) {
    const n = oldNotes.length;
    const movements = [];

    // Greedy: emparejar cada nota vieja con la nueva más cercana
    const usedNew = new Set();

    oldNotes.forEach(oldNote => {
      let minDist = Infinity;
      let bestNew = null;

      newNotes.forEach(newNote => {
        if (usedNew.has(newNote)) return;
        const dist = this.intervalClass(oldNote, newNote);
        if (dist < minDist) {
          minDist = dist;
          bestNew = newNote;
        }
      });

      if (bestNew !== null) {
        usedNew.add(bestNew);
        movements.push({
          from: oldNote,
          to: bestNew,
          interval: this.intervalClass(oldNote, bestNew)
        });
      }
    });

    return movements;
  }

  /**
   * Crear un fotón con física realista
   */
  createPhoton(fromNote, toNote, intervalClass, sourcePos) {
    const spectrum = this.intervalSpectrum[intervalClass] || this.intervalSpectrum[1];

    // Dirección basada en el movimiento de la nota en el círculo cromático
    let direction;
    if (fromNote !== null && toNote !== null) {
      // Ángulo basado en la dirección del movimiento en el círculo cromático
      const fromAngle = (fromNote / 12) * Math.PI * 2 - Math.PI / 2;
      const toAngle = (toNote / 12) * Math.PI * 2 - Math.PI / 2;
      direction = (fromAngle + toAngle) / 2 + Math.PI / 2; // Perpendicular al movimiento
    } else {
      // Dirección aleatoria para notas que aparecen/desaparecen
      direction = Math.random() * Math.PI * 2;
    }

    // Velocidad proporcional a la energía
    const speed = 2 + spectrum.energy * 6;

    return {
      id: Date.now() + Math.random(),
      x: sourcePos.x,
      y: sourcePos.y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      fromNote,
      toNote,
      intervalClass,
      color: spectrum.color,
      energy: spectrum.energy,
      wavelength: spectrum.wavelength,
      name: spectrum.name,
      life: 1.0,
      maxLife: 1.0,
      size: 3 + spectrum.energy * 4,
      trail: [],
      wave: {
        amplitude: 3 + spectrum.energy * 5,
        frequency: 0.1 + spectrum.energy * 0.2,
        phase: 0
      },
      // Tracking de nodos excitados (para evitar re-excitar el mismo)
      excitedNodes: new Set()
    };
  }

  /**
   * Emitir fotones al sistema
   */
  emit(photons) {
    photons.forEach(p => {
      this.photons.push(p);
    });

    // Limitar cantidad total
    while (this.photons.length > this.maxPhotons) {
      this.photons.shift();
    }
  }

  /**
   * Actualizar física de todos los fotones
   * @param {number} deltaTime - Tiempo desde el último frame
   * @param {SetClassVisualization} visualization - Para detectar colisiones con nodos
   * @param {AudioEngine} audioEngine - Para sonificar las excitaciones
   */
  update(deltaTime, visualization = null, audioEngine = null) {
    this.photons = this.photons.filter(photon => {
      // Actualizar posición
      photon.x += photon.vx;
      photon.y += photon.vy;

      // Actualizar trail
      photon.trail.push({ x: photon.x, y: photon.y });
      if (photon.trail.length > 15) {
        photon.trail.shift();
      }

      // Actualizar fase de onda
      photon.wave.phase += photon.wave.frequency;

      // === COLISIÓN CON NODOS ===
      if (visualization && this.sonorousPhotons) {
        this.checkNodeCollisions(photon, visualization, audioEngine);
      }

      // Decay de vida
      photon.life -= deltaTime * 0.8;

      return photon.life > 0;
    });
  }

  /**
   * Comprobar colisiones de un fotón con nodos
   */
  checkNodeCollisions(photon, visualization, audioEngine) {
    const collisionRadius = 18; // Radio para detectar cruce

    for (const [forte, pos] of visualization.setPositions) {
      // Ya excitó este nodo?
      if (photon.excitedNodes.has(forte)) continue;

      const dx = photon.x - pos.x;
      const dy = photon.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < collisionRadius) {
        // Marcar como excitado
        photon.excitedNodes.add(forte);

        // Excitar el nodo visualmente
        visualization.exciteNode(forte);

        // Sonificar si está habilitado
        if (audioEngine && audioEngine.isInitialized) {
          this.exciteNodeSound(pos.setClass, photon, audioEngine);
        }

        // Callback opcional
        if (this.onNodeExcited) {
          this.onNodeExcited(pos.setClass, photon);
        }
      }
    }
  }

  /**
   * Generar sonido cuando un fotón excita un nodo
   */
  exciteNodeSound(setClass, photon, audioEngine) {
    // Usar el método específico si existe, o fallback
    if (audioEngine.playPhotonExcitation) {
      audioEngine.playPhotonExcitation(setClass, {
        intervalClass: photon.intervalClass,
        energy: photon.energy,
        velocity: Math.sqrt(photon.vx * photon.vx + photon.vy * photon.vy)
      });
    } else {
      // Fallback: tocar el acorde rápido
      const now = audioEngine.audioContext.currentTime;
      setClass.primeForm.forEach((pc, i) => {
        audioEngine.playNote(pc, now + i * 0.03, 0.3);
      });
    }
  }

  /**
   * Activar/desactivar fotones sonoros
   */
  setSonorousPhotons(enabled) {
    this.sonorousPhotons = enabled;
  }

  /**
   * Dibujar todos los fotones
   */
  draw(ctx) {
    this.photons.forEach(photon => {
      this.drawPhoton(ctx, photon);
    });
  }

  /**
   * Dibujar un fotón individual con comportamiento ondulatorio
   */
  drawPhoton(ctx, photon) {
    const alpha = photon.life * 0.9;

    // Calcular posición con ondulación
    const waveOffset = Math.sin(photon.wave.phase) * photon.wave.amplitude;
    const perpX = -photon.vy / Math.sqrt(photon.vx * photon.vx + photon.vy * photon.vy);
    const perpY = photon.vx / Math.sqrt(photon.vx * photon.vx + photon.vy * photon.vy);

    const drawX = photon.x + perpX * waveOffset;
    const drawY = photon.y + perpY * waveOffset;

    // Dibujar trail ondulado
    if (photon.trail.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < photon.trail.length; i++) {
        const t = photon.trail[i];
        const trailPhase = photon.wave.phase - (photon.trail.length - i) * photon.wave.frequency;
        const trailWave = Math.sin(trailPhase) * photon.wave.amplitude * (i / photon.trail.length);

        const tx = t.x + perpX * trailWave;
        const ty = t.y + perpY * trailWave;

        if (i === 0) {
          ctx.moveTo(tx, ty);
        } else {
          ctx.lineTo(tx, ty);
        }
      }
      ctx.lineTo(drawX, drawY);

      const trailAlpha = alpha * 0.5;
      ctx.strokeStyle = this.hexToRgba(photon.color, trailAlpha);
      ctx.lineWidth = photon.size * 0.6;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Dibujar cabeza del fotón con glow
    ctx.shadowBlur = 15 * photon.energy;
    ctx.shadowColor = photon.color;

    ctx.beginPath();
    ctx.arc(drawX, drawY, photon.size * photon.life, 0, Math.PI * 2);
    ctx.fillStyle = this.hexToRgba(photon.color, alpha);
    ctx.fill();

    // Núcleo brillante
    ctx.beginPath();
    ctx.arc(drawX, drawY, photon.size * 0.4 * photon.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  /**
   * Convertir hex a rgba
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Obtener estadísticas de emisión reciente
   */
  getEmissionStats() {
    const stats = {
      total: this.photons.length,
      byInterval: {}
    };

    for (let ic = 1; ic <= 6; ic++) {
      stats.byInterval[ic] = {
        count: this.photons.filter(p => p.intervalClass === ic).length,
        ...this.intervalSpectrum[ic]
      };
    }

    return stats;
  }

  /**
   * Limpiar todos los fotones
   */
  clear() {
    this.photons = [];
  }
}

/**
 * Spectrum Analyzer - Visualiza el espectro de emisión acumulado
 */
class SpectrumAnalyzer {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
    this.intervalCounts = [0, 0, 0, 0, 0, 0]; // ic1-ic6
    this.decayRate = 0.95;
  }

  /**
   * Registrar una emisión
   */
  record(photons) {
    photons.forEach(p => {
      if (p.intervalClass >= 1 && p.intervalClass <= 6) {
        this.intervalCounts[p.intervalClass - 1] += p.energy;
      }
    });

    // Añadir al historial
    this.history.push({
      time: Date.now(),
      counts: [...this.intervalCounts]
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Actualizar decay
   */
  update() {
    for (let i = 0; i < 6; i++) {
      this.intervalCounts[i] *= this.decayRate;
    }
  }

  /**
   * Dibujar espectro de emisión
   */
  draw(ctx, x, y, width, height) {
    const barWidth = width / 6;
    const maxCount = Math.max(...this.intervalCounts, 1);

    // Fondo del espectro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, width, height);

    // Colores del espectro
    const colors = ['#ff4444', '#ff8844', '#ffff44', '#44ff44', '#4488ff', '#aa44ff'];
    const labels = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT'];

    // Dibujar barras
    this.intervalCounts.forEach((count, i) => {
      const barHeight = (count / maxCount) * (height - 20);
      const bx = x + i * barWidth + 2;
      const by = y + height - barHeight - 15;

      // Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors[i];

      // Barra
      ctx.fillStyle = colors[i];
      ctx.fillRect(bx, by, barWidth - 4, barHeight);

      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], bx + barWidth / 2 - 2, y + height - 3);
    });

    // Título
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SPECTRUM', x + 5, y + 12);
  }
}

// Exportar
window.PhotonSystem = PhotonSystem;
window.SpectrumAnalyzer = SpectrumAnalyzer;
