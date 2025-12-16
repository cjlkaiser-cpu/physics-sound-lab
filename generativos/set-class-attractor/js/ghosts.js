/**
 * Set-Class Attractor - Ghost Traces (Fantasmas de Memoria)
 * Visualizacion de la memoria auditiva a corto plazo
 */

class GhostTraceSystem {
  constructor() {
    this.ghosts = [];
    this.fadeRate = 0.15; // Opacidad por segundo que se pierde
    this.maxGhosts = 25;
    this.returnThreshold = 40; // Distancia en pixels para detectar retorno
    this.returnReverbGain = 0.4;
    this.enabled = true;

    // Estadisticas de memoria
    this.totalVisits = new Map(); // Contador de visitas por set
    this.lastVisitTime = new Map(); // Ultimo tiempo de visita
  }

  addGhost(setClass, position) {
    if (!this.enabled) return;

    // Actualizar estadisticas
    const currentCount = this.totalVisits.get(setClass.forte) || 0;
    this.totalVisits.set(setClass.forte, currentCount + 1);
    this.lastVisitTime.set(setClass.forte, Date.now());

    // Agregar fantasma
    this.ghosts.push({
      setClass: setClass,
      position: { x: position.x, y: position.y },
      opacity: 1.0,
      brightness: 1.0,
      timestamp: Date.now(),
      visits: currentCount + 1
    });

    // Limitar cantidad
    if (this.ghosts.length > this.maxGhosts) {
      this.ghosts.shift();
    }
  }

  update(deltaTime) {
    if (!this.enabled) return;

    // Fade out gradual
    this.ghosts.forEach(ghost => {
      ghost.opacity -= this.fadeRate * deltaTime;

      // Fade de brillo extra (cuando hay "reconocimiento")
      if (ghost.brightness > 1.0) {
        ghost.brightness = Math.max(1.0, ghost.brightness - deltaTime * 2);
      }
    });

    // Remover fantasmas desvanecidos
    this.ghosts = this.ghosts.filter(g => g.opacity > 0);
  }

  checkReturn(currentPosition, audioEngine) {
    if (!this.enabled) return { isReturn: false };

    const nearbyGhosts = this.ghosts.filter(ghost => {
      const dx = ghost.position.x - currentPosition.x;
      const dy = ghost.position.y - currentPosition.y;
      return Math.sqrt(dx * dx + dy * dy) < this.returnThreshold;
    });

    if (nearbyGhosts.length > 0) {
      // Retorno a territorio familiar
      const intensity = Math.min(1, nearbyGhosts.length * 0.3);

      // Efecto auditivo: aumentar reverb
      if (audioEngine) {
        const baseReverb = 0.2;
        audioEngine.setReverbWet(baseReverb + this.returnReverbGain * intensity);
      }

      // Efecto visual: hacer brillar los fantasmas cercanos
      nearbyGhosts.forEach(g => {
        g.brightness = 1.5 + intensity * 0.5;
      });

      return {
        isReturn: true,
        intensity: intensity,
        familiarSets: nearbyGhosts.map(g => g.setClass),
        ghostCount: nearbyGhosts.length
      };
    }

    // Territorio nuevo: reverb normal
    if (audioEngine) {
      audioEngine.setReverbWet(0.15);
    }

    return { isReturn: false };
  }

  draw(ctx) {
    if (!this.enabled) return;

    this.ghosts.forEach(ghost => {
      const alpha = ghost.opacity * 0.6;
      const brightness = ghost.brightness;
      const visitScale = Math.min(1.5, 1 + ghost.visits * 0.1); // Mas grande si visitado muchas veces

      // Halo exterior
      ctx.beginPath();
      ctx.arc(ghost.position.x, ghost.position.y, 18 * visitScale, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        ghost.position.x, ghost.position.y, 0,
        ghost.position.x, ghost.position.y, 18 * visitScale
      );
      gradient.addColorStop(0, `rgba(180, 180, 255, ${alpha * 0.3 * brightness})`);
      gradient.addColorStop(1, `rgba(100, 100, 200, 0)`);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Anillo intermedio
      ctx.beginPath();
      ctx.arc(ghost.position.x, ghost.position.y, 12 * visitScale, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 200, 255, ${alpha * 0.4 * brightness})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Centro solido
      ctx.beginPath();
      ctx.arc(ghost.position.x, ghost.position.y, 5 * visitScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * brightness})`;
      ctx.fill();

      // Indicador de multiples visitas
      if (ghost.visits > 1) {
        ctx.font = '9px monospace';
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.textAlign = 'center';
        ctx.fillText(`×${ghost.visits}`, ghost.position.x, ghost.position.y + 25);
      }
    });
  }

  // Obtener sets mas visitados
  getMostVisited(n = 5) {
    return Array.from(this.totalVisits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([forte, count]) => ({
        forte,
        count,
        lastVisit: this.lastVisitTime.get(forte)
      }));
  }

  // Obtener tiempo desde ultima visita
  getTimeSinceLastVisit(forte) {
    const lastTime = this.lastVisitTime.get(forte);
    if (!lastTime) return Infinity;
    return Date.now() - lastTime;
  }

  // Verificar si un set es "familiar" (visitado recientemente)
  isFamiliar(forte, thresholdMs = 30000) {
    return this.getTimeSinceLastVisit(forte) < thresholdMs;
  }

  // Limpiar todos los fantasmas
  clear() {
    this.ghosts = [];
  }

  // Reset total (incluyendo estadisticas)
  reset() {
    this.ghosts = [];
    this.totalVisits.clear();
    this.lastVisitTime.clear();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}

// Sistema de Memoria Auditiva (complemento a Ghost Traces)
class AuditoryMemory {
  constructor() {
    this.recentSets = []; // Ultimos N sets visitados
    this.maxMemory = 10;
    this.coherenceScore = 0; // Medida de coherencia de la navegacion
  }

  remember(setClass) {
    this.recentSets.push({
      setClass,
      timestamp: Date.now()
    });

    if (this.recentSets.length > this.maxMemory) {
      this.recentSets.shift();
    }

    this.updateCoherence();
  }

  updateCoherence() {
    if (this.recentSets.length < 2) {
      this.coherenceScore = 0;
      return;
    }

    // Calcular coherencia basada en similitud entre sets consecutivos
    let totalSimilarity = 0;
    const { SetClass } = window.SetTheory;

    for (let i = 1; i < this.recentSets.length; i++) {
      const prev = this.recentSets[i - 1].setClass;
      const curr = this.recentSets[i].setClass;
      const dist = SetClass.distance(prev, curr);
      // Convertir distancia a similitud (0-1)
      const similarity = 1 / (1 + dist);
      totalSimilarity += similarity;
    }

    this.coherenceScore = totalSimilarity / (this.recentSets.length - 1);
  }

  // Detectar si hay un patron (retorno a set anterior)
  detectPattern() {
    if (this.recentSets.length < 3) return null;

    const current = this.recentSets[this.recentSets.length - 1].setClass.forte;

    // Buscar repeticiones
    for (let i = this.recentSets.length - 3; i >= 0; i--) {
      if (this.recentSets[i].setClass.forte === current) {
        return {
          type: 'RETURN',
          setForte: current,
          stepsAgo: this.recentSets.length - 1 - i
        };
      }
    }

    return null;
  }

  // Obtener secuencia reciente como array de Forte numbers
  getRecentSequence() {
    return this.recentSets.map(r => r.setClass.forte);
  }

  clear() {
    this.recentSets = [];
    this.coherenceScore = 0;
  }
}

// Exportar
window.GhostTraceSystem = GhostTraceSystem;
window.AuditoryMemory = AuditoryMemory;
