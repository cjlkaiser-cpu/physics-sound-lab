/**
 * Chromatic Emission - Sistema de Física Central
 *
 * Modelo simplificado:
 * - La partícula ORBITA alrededor del CENTRO del canvas
 * - Al pasar cerca de un nodo, lo ACTIVA (trigger sonoro)
 * - Niveles de energía controlan el radio de órbita
 * - Temperatura controla variaciones y caos
 */

// Estados de la partícula
const ParticleState = {
  ORBITING: 'ORBITING',     // Órbita normal
  EXCITED: 'EXCITED',       // Órbita excitada (radio mayor, más rápida)
  FREE: 'FREE'              // Movimiento libre (slingshot)
};

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Estado orbital
    this.state = ParticleState.ORBITING;
    this.energyLevel = 1;         // n=1 (ground), n=2, n=3 (excited)
    this.orbitalAngle = 0;        // Ángulo actual en la órbita

    // Set actual (último nodo activado)
    this.currentSet = null;
    this.previousSet = null;
    this.timeInCurrentSet = 0;

    // Trail visual
    this.trail = [];
    this.maxTrailLength = 50;

    // Nodos activados recientemente (cooldown)
    this.recentlyActivated = new Map(); // forte -> timestamp
  }

  update(deltaTime) {
    // Actualizar posición
    this.x += this.vx;
    this.y += this.vy;

    // Actualizar trail
    this.trail.push({ x: this.x, y: this.y, state: this.state, energy: this.energyLevel });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Tiempo en el set actual
    if (this.currentSet) {
      this.timeInCurrentSet += deltaTime;
    }

    // Limpiar nodos activados antiguos (cooldown de 1500ms)
    const now = performance.now();
    for (const [forte, time] of this.recentlyActivated) {
      if (now - time > 1500) {
        this.recentlyActivated.delete(forte);
      }
    }
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  canActivate(forte) {
    return !this.recentlyActivated.has(forte);
  }

  markActivated(forte) {
    this.recentlyActivated.set(forte, performance.now());
  }

  teleportTo(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.trail = [];
    this.state = ParticleState.ORBITING;
    this.energyLevel = 1;
  }
}


class PhysicsSystem {
  constructor(visualization) {
    this.viz = visualization;

    // Centro de órbita = centro del canvas
    this.orbitCenter = {
      x: visualization.centerX,
      y: visualization.centerY
    };

    this.particle = new Particle(this.orbitCenter.x + 120, this.orbitCenter.y);

    // Parámetros orbitales
    // Órbita base en el HUECO entre tricordios (100) y tetracordios (180)
    this.orbital = {
      baseRadius: 140,               // Radio base: entre anillos, no toca nodos
      radiusPerLevel: 45,            // Aumento por nivel de energía
      maxRadius: 320,                // Radio máximo
      baseAngularSpeed: 0.008,       // Velocidad angular lenta (contemplativo)
      speedMultiplier: 1.0,
    };

    // Parámetros de activación de nodos
    // Solo activa con VELOCIDAD ALTA (slingshot o movimiento rápido)
    this.activation = {
      radius: 25,                    // Radio para activar un nodo
      cooldown: 1500,                // ms entre activaciones del mismo nodo
      velocityThreshold: 2.5,        // Velocidad mínima para activar (0 = siempre)
    };

    // Parámetros de física
    this.params = {
      friction: 0.98,
      maxSpeed: 15,
      excitationDecay: 0.002,        // Caída natural de energía por frame
      temperature: 0.3,              // 0=frío (estable), 1=caliente (caótico)
      returnForce: 0.08              // Fuerza para volver a órbita (cuando FREE)
    };

    this.isRunning = false;
    this.isPaused = false;

    // Sistema de fotones
    this.photonSystem = null;
    this.spectrumAnalyzer = null;

    // Callbacks
    this.onSetChange = null;
    this.onPhotonEmission = null;
    this.onStateChange = null;
    this.onNodeActivation = null;  // Nuevo: cuando se activa un nodo

    // Slingshot
    this.slingshot = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };

    // Iniciar ángulo orbital
    this.particle.orbitalAngle = Math.random() * Math.PI * 2;
  }

  setPhotonSystem(photonSystem, spectrumAnalyzer) {
    this.photonSystem = photonSystem;
    this.spectrumAnalyzer = spectrumAnalyzer;
  }

  setTemperature(t) {
    this.params.temperature = Math.max(0, Math.min(1, t));
  }

  setOrbitalSpeed(multiplier) {
    this.orbital.speedMultiplier = Math.max(0.1, Math.min(3, multiplier));
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

  /**
   * Obtener radio de órbita actual según nivel de energía
   */
  getCurrentOrbitRadius() {
    const baseRadius = this.orbital.baseRadius;
    const extraRadius = (this.particle.energyLevel - 1) * this.orbital.radiusPerLevel;
    return Math.min(baseRadius + extraRadius, this.orbital.maxRadius);
  }

  /**
   * Loop principal de física
   */
  update() {
    if (!this.isRunning || this.isPaused) return null;

    let result = null;

    // Actualizar según estado
    switch (this.particle.state) {
      case ParticleState.ORBITING:
        result = this.updateOrbiting();
        break;
      case ParticleState.EXCITED:
        result = this.updateExcited();
        break;
      case ParticleState.FREE:
        result = this.updateFree();
        break;
    }

    // Detectar activación de nodos
    const activation = this.checkNodeActivation();
    if (activation) {
      result = activation;
    }

    // Actualizar partícula
    this.particle.update(1/60);

    // Mantener dentro de los límites
    this.keepInBounds();

    return result;
  }

  /**
   * Estado ORBITING: órbita estable alrededor del centro
   */
  updateOrbiting() {
    const radius = this.getCurrentOrbitRadius();
    const angularSpeed = this.orbital.baseAngularSpeed * this.orbital.speedMultiplier;

    // Aplicar ruido térmico al ángulo
    const thermalNoise = (Math.random() - 0.5) * this.params.temperature * 0.02;

    // Actualizar ángulo
    this.particle.orbitalAngle += angularSpeed + thermalNoise;

    // Calcular posición orbital objetivo
    const targetX = this.orbitCenter.x + Math.cos(this.particle.orbitalAngle) * radius;
    const targetY = this.orbitCenter.y + Math.sin(this.particle.orbitalAngle) * radius;

    // Mover suavemente hacia la posición orbital
    const smoothing = 0.12;
    this.particle.vx = (targetX - this.particle.x) * smoothing;
    this.particle.vy = (targetY - this.particle.y) * smoothing;

    // Excitación espontánea por temperatura
    if (Math.random() < this.params.temperature * 0.005) {
      this.excite();
    }

    return null;
  }

  /**
   * Estado EXCITED: órbita excitada con más variación
   */
  updateExcited() {
    const radius = this.getCurrentOrbitRadius();

    // Velocidad angular más variable cuando excitado
    const baseSpeed = this.orbital.baseAngularSpeed * this.orbital.speedMultiplier;
    const speedVariation = 1 + (Math.random() - 0.5) * this.params.temperature * 0.5;
    const angularSpeed = baseSpeed * 1.2 * speedVariation;

    // Más ruido térmico
    const thermalNoise = (Math.random() - 0.5) * this.params.temperature * 0.05;

    // Actualizar ángulo
    this.particle.orbitalAngle += angularSpeed + thermalNoise;

    // Perturbación del radio
    const radiusNoise = (Math.random() - 0.5) * this.params.temperature * 30;
    const currentRadius = radius + radiusNoise;

    // Calcular posición orbital objetivo
    const targetX = this.orbitCenter.x + Math.cos(this.particle.orbitalAngle) * currentRadius;
    const targetY = this.orbitCenter.y + Math.sin(this.particle.orbitalAngle) * currentRadius;

    // Mover hacia la posición (menos suave = más inestable)
    const smoothing = 0.1;
    this.particle.vx = (targetX - this.particle.x) * smoothing;
    this.particle.vy = (targetY - this.particle.y) * smoothing;

    // Decay natural de energía
    if (Math.random() < this.params.excitationDecay) {
      this.decay();
    }

    return null;
  }

  /**
   * Estado FREE: movimiento libre (después de slingshot)
   */
  updateFree() {
    // Aplicar fricción
    this.particle.vx *= this.params.friction;
    this.particle.vy *= this.params.friction;

    // Fuerza suave hacia la órbita
    const dx = this.orbitCenter.x - this.particle.x;
    const dy = this.orbitCenter.y - this.particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      // Atracción hacia el centro
      const force = this.params.returnForce * 0.5;
      this.particle.vx += (dx / dist) * force;
      this.particle.vy += (dy / dist) * force;
    }

    // Si la velocidad es baja, volver a orbitar
    const speed = this.particle.getSpeed();
    if (speed < 1.5) {
      // Calcular ángulo actual respecto al centro
      const angle = Math.atan2(
        this.particle.y - this.orbitCenter.y,
        this.particle.x - this.orbitCenter.x
      );
      this.particle.orbitalAngle = angle;
      this.particle.state = ParticleState.ORBITING;

      if (this.onStateChange) {
        this.onStateChange(ParticleState.FREE, ParticleState.ORBITING);
      }
    }

    // Limitar velocidad
    this.limitSpeed();

    return null;
  }

  /**
   * Verificar si la partícula activa algún nodo
   * Solo activa si: está cerca + tiene velocidad suficiente + cooldown pasado
   */
  checkNodeActivation() {
    const activationRadius = this.activation.radius;
    const velocityThreshold = this.activation.velocityThreshold;
    const speed = this.particle.getSpeed();

    // Si la velocidad es muy baja, no activar (modo contemplativo)
    if (speed < velocityThreshold) {
      return null;
    }

    for (const [forte, pos] of this.viz.setPositions) {
      const dx = this.particle.x - pos.x;
      const dy = this.particle.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < activationRadius && this.particle.canActivate(forte)) {
        // Activar este nodo
        this.particle.markActivated(forte);

        const setClass = pos.setClass;
        const oldSet = this.particle.currentSet;
        const isNewSet = oldSet !== setClass;

        if (isNewSet) {
          this.particle.previousSet = oldSet;
          this.particle.currentSet = setClass;
          this.particle.timeInCurrentSet = 0;

          // Callback de activación de nodo
          if (this.onNodeActivation) {
            this.onNodeActivation(setClass, pos);
          }

          // Emitir fotones si hay transición
          if (oldSet) {
            return this.emitPhotonsOnTransition(oldSet, setClass, pos);
          } else {
            // Primera activación
            if (this.onSetChange) {
              this.onSetChange({ from: null, to: setClass });
            }
            return { type: 'FIRST_ACTIVATION', set: setClass };
          }
        }
      }
    }

    return null;
  }

  /**
   * Excitar la partícula (subir nivel de energía = radio mayor)
   * También da un impulso radial para atravesar nodos
   */
  excite(levels = 1) {
    const oldLevel = this.particle.energyLevel;
    this.particle.energyLevel = Math.min(4, this.particle.energyLevel + levels);

    if (this.particle.state === ParticleState.ORBITING) {
      this.particle.state = ParticleState.EXCITED;
      if (this.onStateChange) {
        this.onStateChange(ParticleState.ORBITING, ParticleState.EXCITED);
      }
    }

    // Impulso radial hacia afuera para atravesar nodos
    const dx = this.particle.x - this.orbitCenter.x;
    const dy = this.particle.y - this.orbitCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const impulse = 4 + levels * 2; // Impulso proporcional a la excitación

    this.particle.vx += (dx / dist) * impulse;
    this.particle.vy += (dy / dist) * impulse;

    return this.particle.energyLevel - oldLevel;
  }

  /**
   * Excitación máxima
   */
  exciteMax() {
    return this.excite(3);
  }

  /**
   * Decay: bajar nivel de energía
   */
  decay() {
    if (this.particle.energyLevel > 1) {
      this.particle.energyLevel--;

      // Si vuelve a ground state, cambiar a ORBITING
      if (this.particle.energyLevel === 1 && this.particle.state === ParticleState.EXCITED) {
        this.particle.state = ParticleState.ORBITING;
        if (this.onStateChange) {
          this.onStateChange(ParticleState.EXCITED, ParticleState.ORBITING);
        }
      }
    }
  }

  /**
   * Emitir fotones en transición entre sets
   */
  emitPhotonsOnTransition(oldSet, newSet, pos) {
    if (!this.photonSystem) return null;

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

    if (this.onSetChange) {
      this.onSetChange({ from: oldSet, to: newSet });
    }

    return { type: 'SET_CHANGE', from: oldSet, to: newSet, photons };
  }

  /**
   * Limitar velocidad máxima
   */
  limitSpeed() {
    const speed = this.particle.getSpeed();
    if (speed > this.params.maxSpeed) {
      const scale = this.params.maxSpeed / speed;
      this.particle.vx *= scale;
      this.particle.vy *= scale;
    }
  }

  /**
   * Mantener partícula dentro de límites
   */
  keepInBounds() {
    const margin = 30;
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

  // === Interacción del usuario ===

  /**
   * Click para excitar o cambiar dirección
   */
  handleClick(x, y) {
    const dx = x - this.particle.x;
    const dy = y - this.particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Si está cerca de la partícula, excitar
    if (dist < 50) {
      this.excite();
      return true;
    }

    // Si hace click en otra parte, invertir dirección brevemente
    this.orbital.baseAngularSpeed *= -1;
    setTimeout(() => {
      this.orbital.baseAngularSpeed *= -1;
    }, 500);

    return false;
  }

  /**
   * Iniciar slingshot
   */
  startSlingshot(x, y) {
    const dx = x - this.particle.x;
    const dy = y - this.particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 60) {
      this.slingshot.active = true;
      this.slingshot.startX = this.particle.x;
      this.slingshot.startY = this.particle.y;
      this.slingshot.currentX = x;
      this.slingshot.currentY = y;
      return true;
    }
    return false;
  }

  /**
   * Actualizar slingshot mientras se arrastra
   */
  updateSlingshot(x, y) {
    if (this.slingshot.active) {
      this.slingshot.currentX = x;
      this.slingshot.currentY = y;
    }
  }

  /**
   * Soltar slingshot - lanzar partícula
   */
  releaseSlingshot() {
    if (!this.slingshot.active) return;

    const dx = this.slingshot.startX - this.slingshot.currentX;
    const dy = this.slingshot.startY - this.slingshot.currentY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      // Normalizar y escalar
      const maxForce = 12;
      const force = Math.min(dist * 0.15, maxForce);

      this.particle.vx = (dx / dist) * force;
      this.particle.vy = (dy / dist) * force;

      // Cambiar a estado FREE
      this.particle.state = ParticleState.FREE;
      if (this.onStateChange) {
        this.onStateChange(ParticleState.ORBITING, ParticleState.FREE);
      }
    }

    this.slingshot.active = false;
  }

  /**
   * Dibujar línea de slingshot
   */
  drawSlingshot(ctx) {
    if (!this.slingshot.active) return;

    const dx = this.slingshot.startX - this.slingshot.currentX;
    const dy = this.slingshot.startY - this.slingshot.currentY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Línea de guía
    ctx.beginPath();
    ctx.moveTo(this.particle.x, this.particle.y);
    ctx.lineTo(this.particle.x + dx, this.particle.y + dy);
    ctx.strokeStyle = `rgba(255, 100, 100, ${Math.min(1, dist / 100)})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Flecha de dirección
    const arrowLen = Math.min(dist * 0.5, 30);
    const angle = Math.atan2(dy, dx);
    const endX = this.particle.x + dx;
    const endY = this.particle.y + dy;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLen * Math.cos(angle - 0.3),
      endY - arrowLen * Math.sin(angle - 0.3)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLen * Math.cos(angle + 0.3),
      endY - arrowLen * Math.sin(angle + 0.3)
    );
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Indicador de fuerza
    const force = Math.min(dist * 0.15, 12);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px monospace';
    ctx.fillText(`Force: ${force.toFixed(1)}`, endX + 10, endY);
  }

  /**
   * Impulso aleatorio
   */
  randomImpulse(strength = 5) {
    const angle = Math.random() * Math.PI * 2;
    this.particle.vx += Math.cos(angle) * strength;
    this.particle.vy += Math.sin(angle) * strength;

    if (this.particle.state === ParticleState.ORBITING) {
      this.excite();
    }
  }

  /**
   * Establecer posición de la partícula
   */
  setParticlePosition(x, y) {
    this.particle.x = x;
    this.particle.y = y;
    this.particle.vx = 0;
    this.particle.vy = 0;
    this.particle.state = ParticleState.FREE;
  }
}


/**
 * Z-Portal System - Túneles cuánticos entre Z-related sets
 */
class ZPortalSystem {
  constructor() {
    this.enabled = true;
    this.tunnelCooldown = 0;
    this.cooldownTime = 2000;
    this.lastTunnelTime = 0;
    this.effects = [];
  }

  checkTunnel(currentSet, depth = 1.0) {
    if (!this.enabled || !currentSet || !currentSet.zMate) return null;

    const now = performance.now();
    if (now - this.lastTunnelTime < this.cooldownTime) return null;

    const tunnelProbability = depth * 0.01;

    if (Math.random() < tunnelProbability) {
      this.lastTunnelTime = now;

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

        ctx.beginPath();
        ctx.moveTo(pos1.x, pos1.y);
        ctx.lineTo(pos2.x, pos2.y);
        ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.8})`;
        ctx.lineWidth = 3 * (1 - effect.progress);
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0, 255, 200, 0.8)';
        ctx.stroke();
        ctx.shadowBlur = 0;

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
window.ParticleState = ParticleState;
window.Particle = Particle;
window.PhysicsSystem = PhysicsSystem;
window.ZPortalSystem = ZPortalSystem;
