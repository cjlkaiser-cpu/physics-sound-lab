/**
 * Chromatic Emission - Sistema de Física Orbital
 *
 * Física inspirada en el modelo de Bohr:
 * - La partícula ORBITA alrededor de los nodos (no colapsa al centro)
 * - Puede estar en diferentes niveles de energía (ground, excited)
 * - Se puede excitar para subir de nivel o escapar
 * - Temperatura controla la estabilidad/caos del sistema
 */

// Estados de la partícula
const ParticleState = {
  FREE: 'FREE',           // Viajando entre nodos
  ORBITING: 'ORBITING',   // Órbita estable (ground state)
  EXCITED: 'EXCITED',     // Órbita excitada (puede escapar)
  ESCAPING: 'ESCAPING'    // Escapando del nodo actual
};

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Estado orbital
    this.state = ParticleState.FREE;
    this.energyLevel = 1;         // n=1 (ground), n=2, n=3 (excited)
    this.orbitalAngle = 0;        // Ángulo actual en la órbita
    this.orbitCenter = null;      // {x, y} del nodo siendo orbitado

    // Set actual
    this.currentSet = null;
    this.previousSet = null;
    this.timeInCurrentSet = 0;

    // Trail visual
    this.trail = [];
    this.maxTrailLength = 40;
  }

  update(deltaTime) {
    // Actualizar posición
    this.x += this.vx;
    this.y += this.vy;

    // Actualizar trail
    this.trail.push({ x: this.x, y: this.y, state: this.state });
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

  getKineticEnergy() {
    const speed = this.getSpeed();
    return 0.5 * speed * speed;
  }

  teleportTo(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.trail = [];
    this.state = ParticleState.FREE;
    this.energyLevel = 1;
    this.orbitCenter = null;
  }
}


class PhysicsSystem {
  constructor(visualization) {
    this.viz = visualization;
    this.particle = new Particle(visualization.centerX, visualization.centerY);

    // Parámetros orbitales
    this.orbital = {
      groundRadius: 20,              // Radio de órbita ground state
      excitedRadii: [38, 55, 72],    // Radios para n=2, n=3, n=4
      escapeRadius: 85,              // Radio donde escapa
      baseAngularSpeed: 0.04,        // Velocidad angular base (rad/frame)
      captureRadius: 90,             // Radio para iniciar captura
      captureSpeed: 3.0,             // Velocidad máxima para ser capturado
    };

    // Parámetros de física
    this.params = {
      attractionStrength: 0.12,
      friction: 0.985,
      maxSpeed: 18,
      excitationDecay: 0.0008,       // Caída natural de energía por frame
      escapeVelocity: 5.5,           // Velocidad para escapar
      temperature: 0.3               // 0=frío (estable), 1=caliente (caótico)
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

    // Slingshot
    this.slingshot = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    };
  }

  setPhotonSystem(photonSystem, spectrumAnalyzer) {
    this.photonSystem = photonSystem;
    this.spectrumAnalyzer = spectrumAnalyzer;
  }

  setTemperature(t) {
    this.params.temperature = Math.max(0, Math.min(1, t));
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
   * Loop principal de física
   */
  update() {
    if (!this.isRunning || this.isPaused) return null;

    // Aplicar ruido térmico
    this.applyThermalNoise();

    // Actualizar según estado
    let result = null;
    switch (this.particle.state) {
      case ParticleState.FREE:
        result = this.updateFree();
        break;
      case ParticleState.ORBITING:
        result = this.updateOrbiting();
        break;
      case ParticleState.EXCITED:
        result = this.updateExcited();
        break;
      case ParticleState.ESCAPING:
        result = this.updateEscaping();
        break;
    }

    // Actualizar partícula
    this.particle.update(1/60);

    // Mantener dentro de los límites
    this.keepInBounds();

    return result;
  }

  /**
   * Estado FREE: viajando entre nodos
   */
  updateFree() {
    const nearest = this.viz.getNearestSet(this.particle.x, this.particle.y);

    if (nearest.set) {
      const pos = this.viz.getPosition(nearest.set.forte);
      if (pos) {
        const dx = pos.x - this.particle.x;
        const dy = pos.y - this.particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Aplicar atracción
        if (dist > 0.1) {
          const force = this.params.attractionStrength / Math.max(1, dist * 0.03);
          this.particle.vx += (dx / dist) * force;
          this.particle.vy += (dy / dist) * force;
        }

        // Detectar captura
        if (dist < this.orbital.captureRadius) {
          const speed = this.particle.getSpeed();

          if (speed < this.orbital.captureSpeed) {
            // Capturar en órbita
            return this.captureInOrbit(nearest.set, pos);
          }
        }
      }
    }

    // Aplicar fricción
    this.particle.vx *= this.params.friction;
    this.particle.vy *= this.params.friction;

    // Limitar velocidad
    this.limitSpeed();

    return null;
  }

  /**
   * Capturar partícula en órbita alrededor de un nodo
   */
  captureInOrbit(setClass, pos) {
    const oldSet = this.particle.currentSet;
    const isNewSet = oldSet !== setClass;

    // Configurar órbita
    this.particle.orbitCenter = { x: pos.x, y: pos.y };
    this.particle.currentSet = setClass;
    this.particle.energyLevel = 1; // Ground state

    // Calcular ángulo inicial basado en posición actual
    const dx = this.particle.x - pos.x;
    const dy = this.particle.y - pos.y;
    this.particle.orbitalAngle = Math.atan2(dy, dx);

    // Cambiar estado
    const oldState = this.particle.state;
    this.particle.state = ParticleState.ORBITING;

    if (this.onStateChange && oldState !== ParticleState.ORBITING) {
      this.onStateChange(oldState, ParticleState.ORBITING);
    }

    // Si es un nuevo set, emitir fotones
    if (isNewSet && oldSet) {
      this.particle.previousSet = oldSet;
      this.particle.timeInCurrentSet = 0;
      return this.emitPhotonsOnTransition(oldSet, setClass, pos);
    }

    return null;
  }

  /**
   * Estado ORBITING: órbita estable alrededor del nodo
   */
  updateOrbiting() {
    if (!this.particle.orbitCenter || !this.particle.currentSet) {
      this.particle.state = ParticleState.FREE;
      return null;
    }

    const center = this.particle.orbitCenter;
    const radius = this.getOrbitRadius(this.particle.energyLevel);

    // Velocidad angular (más lenta en órbitas mayores)
    const angularSpeed = this.orbital.baseAngularSpeed / Math.sqrt(this.particle.energyLevel);

    // Actualizar ángulo
    this.particle.orbitalAngle += angularSpeed;

    // Calcular posición orbital
    const targetX = center.x + Math.cos(this.particle.orbitalAngle) * radius;
    const targetY = center.y + Math.sin(this.particle.orbitalAngle) * radius;

    // Mover suavemente hacia la posición orbital
    const smoothing = 0.15;
    this.particle.vx = (targetX - this.particle.x) * smoothing;
    this.particle.vy = (targetY - this.particle.y) * smoothing;

    // Excitación espontánea por temperatura
    if (Math.random() < this.params.temperature * 0.008) {
      this.excite();
    }

    return null;
  }

  /**
   * Estado EXCITED: órbita excitada, puede decaer o escapar
   */
  updateExcited() {
    if (!this.particle.orbitCenter || !this.particle.currentSet) {
      this.particle.state = ParticleState.FREE;
      return null;
    }

    const center = this.particle.orbitCenter;
    const radius = this.getOrbitRadius(this.particle.energyLevel);

    // Velocidad angular más rápida cuando excitado
    const angularSpeed = this.orbital.baseAngularSpeed * 1.3 / Math.sqrt(this.particle.energyLevel);

    // Actualizar ángulo con más variación
    const wobble = (Math.random() - 0.5) * this.params.temperature * 0.1;
    this.particle.orbitalAngle += angularSpeed + wobble;

    // Posición orbital con perturbación
    const perturbation = (Math.random() - 0.5) * this.params.temperature * 8;
    const targetX = center.x + Math.cos(this.particle.orbitalAngle) * (radius + perturbation);
    const targetY = center.y + Math.sin(this.particle.orbitalAngle) * (radius + perturbation);

    // Movimiento menos suave (más inestable)
    const smoothing = 0.12;
    this.particle.vx = (targetX - this.particle.x) * smoothing;
    this.particle.vy = (targetY - this.particle.y) * smoothing;

    // Decay natural de energía
    if (Math.random() < this.params.excitationDecay * (1 - this.params.temperature * 0.5)) {
      this.decay();
    }

    // Probabilidad de escape (mayor en niveles altos y alta temperatura)
    const escapeProb = (this.particle.energyLevel - 1) * 0.003 * (1 + this.params.temperature);
    if (Math.random() < escapeProb) {
      this.startEscape();
    }

    return null;
  }

  /**
   * Estado ESCAPING: abandonando el nodo actual
   */
  updateEscaping() {
    if (!this.particle.orbitCenter) {
      this.particle.state = ParticleState.FREE;
      return null;
    }

    const center = this.particle.orbitCenter;
    const dx = this.particle.x - center.x;
    const dy = this.particle.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Aplicar fuerza de escape (radialmente hacia afuera)
    if (dist > 0) {
      const escapeForce = 0.3;
      this.particle.vx += (dx / dist) * escapeForce;
      this.particle.vy += (dy / dist) * escapeForce;
    }

    // Aplicar fricción mínima
    this.particle.vx *= 0.995;
    this.particle.vy *= 0.995;

    // Si ha escapado lo suficiente, pasar a FREE
    if (dist > this.orbital.escapeRadius) {
      this.particle.state = ParticleState.FREE;
      this.particle.orbitCenter = null;

      if (this.onStateChange) {
        this.onStateChange(ParticleState.ESCAPING, ParticleState.FREE);
      }
    }

    this.limitSpeed();
    return null;
  }

  /**
   * Obtener radio de órbita según nivel de energía
   */
  getOrbitRadius(level) {
    if (level <= 1) return this.orbital.groundRadius;
    const idx = Math.min(level - 2, this.orbital.excitedRadii.length - 1);
    return this.orbital.excitedRadii[idx];
  }

  /**
   * Excitar la partícula (subir nivel de energía)
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
   * Iniciar escape del nodo actual
   */
  startEscape() {
    if (this.particle.state === ParticleState.ORBITING ||
        this.particle.state === ParticleState.EXCITED) {
      const oldState = this.particle.state;
      this.particle.state = ParticleState.ESCAPING;
      this.particle.energyLevel = 1;

      // Dar impulso radial hacia afuera
      if (this.particle.orbitCenter) {
        const dx = this.particle.x - this.particle.orbitCenter.x;
        const dy = this.particle.y - this.particle.orbitCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const impulse = this.params.escapeVelocity;
        this.particle.vx = (dx / dist) * impulse;
        this.particle.vy = (dy / dist) * impulse;
      }

      if (this.onStateChange) {
        this.onStateChange(oldState, ParticleState.ESCAPING);
      }
    }
  }

  /**
   * Aplicar ruido térmico
   */
  applyThermalNoise() {
    const noise = this.params.temperature * 0.15;
    this.particle.vx += (Math.random() - 0.5) * noise;
    this.particle.vy += (Math.random() - 0.5) * noise;
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
   * Mantener partícula dentro de límites
   */
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

  // === Interacción del usuario ===

  /**
   * Click cerca de la partícula para excitar
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

    // Si está en un nodo, atraer hacia él
    const clicked = this.viz.getNearestSet(x, y);
    if (clicked.set && clicked.distance < 30) {
      this.attractTo(clicked.set.forte);
      return true;
    }

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

      // Forzar escape si estaba orbitando
      if (this.particle.state === ParticleState.ORBITING ||
          this.particle.state === ParticleState.EXCITED) {
        this.particle.state = ParticleState.ESCAPING;

        // Si la fuerza es suficiente, escapar inmediatamente
        if (force > 6) {
          this.particle.state = ParticleState.FREE;
          this.particle.orbitCenter = null;
        }
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
   * Atraer partícula hacia un nodo específico
   */
  attractTo(forte) {
    const pos = this.viz.getPosition(forte);
    if (!pos) return;

    const dx = pos.x - this.particle.x;
    const dy = pos.y - this.particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      // Si está orbitando, primero escapar
      if (this.particle.state === ParticleState.ORBITING ||
          this.particle.state === ParticleState.EXCITED) {
        this.startEscape();
      }

      const strength = Math.min(10, dist * 0.08);
      this.particle.vx = (dx / dist) * strength;
      this.particle.vy = (dy / dist) * strength;
    }
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
    this.particle.orbitCenter = null;
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
