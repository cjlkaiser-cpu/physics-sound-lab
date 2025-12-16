/**
 * Chromatic Emission - Sistema de Física
 *
 * Física de partículas para la navegación por el espacio de set-classes.
 * La partícula es atraída hacia los nodos, y al cambiar de set emite fotones.
 */

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.currentSet = null;
    this.previousSet = null;
    this.timeInCurrentSet = 0;
    this.trail = [];
    this.maxTrailLength = 30;
  }

  update(deltaTime) {
    // Actualizar posición
    this.x += this.vx;
    this.y += this.vy;

    // Actualizar trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Tiempo en el set actual
    if (this.currentSet) {
      this.timeInCurrentSet += deltaTime;
    }
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  teleportTo(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.trail = [];
  }
}


class PhysicsSystem {
  constructor(visualization) {
    this.viz = visualization;
    this.particle = new Particle(visualization.centerX, visualization.centerY);

    this.params = {
      attractionStrength: 0.15,
      friction: 0.97,
      minSpeed: 0.1,
      maxSpeed: 15,
      captureRadius: 18,
      escapeThreshold: 3.0
    };

    this.isRunning = false;
    this.isPaused = false;

    // Sistema de fotones
    this.photonSystem = null;
    this.spectrumAnalyzer = null;

    // Callbacks
    this.onSetChange = null;
    this.onPhotonEmission = null;
  }

  setPhotonSystem(photonSystem, spectrumAnalyzer) {
    this.photonSystem = photonSystem;
    this.spectrumAnalyzer = spectrumAnalyzer;
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
  }

  stop() {
    this.isRunning = false;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  update() {
    if (!this.isRunning || this.isPaused) return null;

    // Encontrar el set más cercano
    const nearest = this.viz.getNearestSet(this.particle.x, this.particle.y);

    if (nearest.set) {
      // Aplicar atracción hacia el set más cercano
      const pos = this.viz.getPosition(nearest.set.forte);
      if (pos) {
        const dx = pos.x - this.particle.x;
        const dy = pos.y - this.particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) {
          // Fuerza de atracción inversamente proporcional a la distancia
          const force = this.params.attractionStrength / Math.max(1, dist * 0.05);
          this.particle.vx += (dx / dist) * force;
          this.particle.vy += (dy / dist) * force;
        }

        // Detectar captura de set
        if (dist < this.params.captureRadius) {
          const speed = this.particle.getSpeed();

          // Solo cambiar de set si la partícula se ha "asentado"
          if (speed < this.params.escapeThreshold && this.particle.currentSet !== nearest.set) {
            return this.changeSet(nearest.set);
          }
        }
      }
    }

    // Aplicar fricción
    this.particle.vx *= this.params.friction;
    this.particle.vy *= this.params.friction;

    // Limitar velocidad
    const speed = this.particle.getSpeed();
    if (speed > this.params.maxSpeed) {
      const scale = this.params.maxSpeed / speed;
      this.particle.vx *= scale;
      this.particle.vy *= scale;
    }

    // Actualizar partícula
    this.particle.update(1/60);

    // Mantener dentro de los límites
    this.keepInBounds();

    return null;
  }

  changeSet(newSet) {
    const oldSet = this.particle.currentSet;
    this.particle.previousSet = oldSet;
    this.particle.currentSet = newSet;
    this.particle.timeInCurrentSet = 0;

    // Emitir fotones basados en el voice leading
    if (oldSet && this.photonSystem) {
      const pos = this.viz.getPosition(newSet.forte);
      if (pos) {
        const photons = this.photonSystem.analyzeVoiceLeading(
          oldSet.primeForm,
          newSet.primeForm,
          { x: pos.x, y: pos.y }
        );

        this.photonSystem.emit(photons);

        if (this.spectrumAnalyzer) {
          this.spectrumAnalyzer.record(photons);
        }

        if (this.onPhotonEmission) {
          this.onPhotonEmission(photons);
        }
      }
    }

    // Callback de cambio de set
    if (this.onSetChange) {
      this.onSetChange({ from: oldSet, to: newSet });
    }

    return { type: 'SET_CHANGE', from: oldSet, to: newSet };
  }

  keepInBounds() {
    const margin = 50;
    const bounce = 0.5;

    if (this.particle.x < margin) {
      this.particle.x = margin;
      this.particle.vx *= -bounce;
    }
    if (this.particle.x > this.viz.width - margin) {
      this.particle.x = this.viz.width - margin;
      this.particle.vx *= -bounce;
    }
    if (this.particle.y < margin) {
      this.particle.y = margin;
      this.particle.vy *= -bounce;
    }
    if (this.particle.y > this.viz.height - margin) {
      this.particle.y = this.viz.height - margin;
      this.particle.vy *= -bounce;
    }
  }

  randomImpulse(strength = 5) {
    const angle = Math.random() * Math.PI * 2;
    this.particle.vx += Math.cos(angle) * strength;
    this.particle.vy += Math.sin(angle) * strength;
  }

  attractTo(forte) {
    const pos = this.viz.getPosition(forte);
    if (!pos) return;

    const dx = pos.x - this.particle.x;
    const dy = pos.y - this.particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const strength = Math.min(8, dist * 0.1);
      this.particle.vx = (dx / dist) * strength;
      this.particle.vy = (dy / dist) * strength;
    }
  }

  setParticlePosition(x, y) {
    this.particle.x = x;
    this.particle.y = y;
    this.particle.vx = 0;
    this.particle.vy = 0;
  }
}


/**
 * Z-Portal System - Túneles cuánticos entre Z-related sets
 */
class ZPortalSystem {
  constructor() {
    this.enabled = true;
    this.tunnelCooldown = 0;
    this.cooldownTime = 2000; // ms entre túneles
    this.lastTunnelTime = 0;
    this.effects = [];
  }

  checkTunnel(currentSet, depth = 1.0) {
    if (!this.enabled || !currentSet || !currentSet.zMate) return null;

    const now = performance.now();
    if (now - this.lastTunnelTime < this.cooldownTime) return null;

    // Probabilidad de túnel basada en profundidad (tiempo en el set)
    const tunnelProbability = depth * 0.01;

    if (Math.random() < tunnelProbability) {
      this.lastTunnelTime = now;

      // Crear efecto visual
      this.effects.push({
        type: 'tunnel',
        from: currentSet.forte,
        to: currentSet.zMate,
        progress: 0,
        startTime: now
      });

      return {
        from: currentSet.forte,
        to: currentSet.zMate,
        targetSet: window.SetTheory.SET_BY_FORTE[currentSet.zMate]
      };
    }

    return null;
  }

  update() {
    const now = performance.now();
    this.effects = this.effects.filter(effect => {
      effect.progress = (now - effect.startTime) / 500;
      return effect.progress < 1;
    });
  }

  drawEffects(ctx, viz) {
    this.effects.forEach(effect => {
      if (effect.type === 'tunnel') {
        const pos1 = viz.getPosition(effect.from);
        const pos2 = viz.getPosition(effect.to);
        if (!pos1 || !pos2) return;

        const alpha = 1 - effect.progress;

        // Línea de túnel brillante
        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.8})`;
        ctx.lineWidth = 3 * (1 - effect.progress);
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 255, 200, 0.8)';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Partículas viajando
        const t = effect.progress;
        const px = pos1.x + (pos2.x - pos1.x) * t;
        const py = pos1.y + (pos2.y - pos1.y) * t;

        ctx.beginPath();
        ctx.arc(px, py, 8 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 200, ${alpha})`;
        ctx.fill();
      }
    });
  }
}

// Exportar
window.Particle = Particle;
window.PhysicsSystem = PhysicsSystem;
window.ZPortalSystem = ZPortalSystem;
