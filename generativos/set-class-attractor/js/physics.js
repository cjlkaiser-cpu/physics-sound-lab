/**
 * Set-Class Attractor - Sistema Dinamico + Z-Portals
 * Fisica de particulas con atractores gravitacionales
 */

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.mass = 1;

    // Trail para visualizacion
    this.trail = [];
    this.maxTrailLength = 50;

    // Estado
    this.currentSet = null;
    this.lastSnapTime = 0;
    this.timeInCurrentSet = 0; // Tiempo en el set actual (para escape)
    this.stuckCounter = 0; // Contador de "atrapamiento"
  }

  addToTrail() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  applyForce(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }

  update(friction = 0.98) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= friction;
    this.vy *= friction;
    this.addToTrail();
  }

  teleportTo(x, y) {
    this.x = x;
    this.y = y;
    this.vx *= 0.3; // Reducir velocidad al teleportarse
    this.vy *= 0.3;
    this.trail = []; // Reset trail
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }
}

class PhysicsSystem {
  constructor(visualization) {
    this.viz = visualization;
    this.particle = new Particle(visualization.centerX, visualization.centerY);

    // Parametros ajustables
    this.params = {
      attractionStrength: 0.12,
      repulsionStrength: 0.08,
      friction: 0.96,
      snapDistance: 20, // Distancia para "caer" en un atractor (reducida)
      snapStrength: 0.15, // Reducido para no atrapar tanto
      randomImpulse: 0.08, // Mas movimiento browniano
      boundaryForce: 0.5,
      escapeTime: 1500, // ms antes de empezar a escapar
      escapeStrength: 0.4, // Fuerza de escape
      wanderlust: 0.08, // Reducido - Deseo de explorar (fuerza tangencial)
      centripetalForce: 0.03, // Fuerza hacia el centro (cambiar orbitas)
      orbitJump: 0.15 // Probabilidad de salto entre orbitas
    };

    // Estado
    this.isRunning = false;
    this.isPaused = false;
    this.lastUpdateTime = Date.now();
  }

  calculateForces() {
    const { SET_CLASSES, SetClass } = window.SetTheory;
    let fx = 0, fy = 0;

    const activeCard = this.viz.activeCardinality;
    const currentSetPos = this.particle.currentSet
      ? this.viz.getPosition(this.particle.currentSet.forte)
      : null;

    // Calcular tiempo en set actual para escape
    const escapeRatio = Math.min(1, this.particle.timeInCurrentSet / this.params.escapeTime);

    // Fuerza hacia sets cercanos (similitud interválica)
    for (const [forte, pos] of this.viz.setPositions) {
      // Solo considerar cardinalidades activas
      if (activeCard && pos.setClass.cardinality !== activeCard) continue;

      const dx = pos.x - this.particle.x;
      const dy = pos.y - this.particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) continue; // Evitar division por cero

      const isCurrentSet = this.particle.currentSet &&
                           this.particle.currentSet.forte === forte;

      // Fuerza de atraccion basada en similitud con el set actual
      let attractionFactor = this.params.attractionStrength;

      if (this.particle.currentSet) {
        const similarity = 1 / (1 + SetClass.distance(this.particle.currentSet, pos.setClass));
        attractionFactor *= similarity;
      }

      // Si es el set actual y llevamos tiempo, REPELER en vez de atraer
      if (isCurrentSet && escapeRatio > 0.3) {
        const repelForce = this.params.escapeStrength * escapeRatio;
        fx -= (dx / dist) * repelForce;
        fy -= (dy / dist) * repelForce;
      } else {
        // Atraccion inversamente proporcional al cuadrado de la distancia
        const force = attractionFactor / (dist * dist);
        fx += (dx / dist) * force * 100;
        fy += (dy / dist) * force * 100;

        // Snap force cuando esta muy cerca (reducida si llevamos tiempo)
        if (dist < this.params.snapDistance) {
          const snapReduction = isCurrentSet ? (1 - escapeRatio * 0.8) : 1;
          const snapForce = this.params.snapStrength * (1 - dist / this.params.snapDistance) * snapReduction;
          fx += (dx / dist) * snapForce;
          fy += (dy / dist) * snapForce;
        }
      }
    }

    // Fuerzas orbitales
    const dxCenter = this.particle.x - this.viz.centerX;
    const dyCenter = this.particle.y - this.viz.centerY;
    const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

    if (distCenter > 10) {
      // Vector radial (hacia/desde el centro)
      const radialX = -dxCenter / distCenter;
      const radialY = -dyCenter / distCenter;

      // Vector tangencial (perpendicular, para orbitar)
      const tangentX = -dyCenter / distCenter;
      const tangentY = dxCenter / distCenter;

      // Fuerza tangencial (wanderlust) - reducida
      const wanderlustForce = this.params.wanderlust * (1 + escapeRatio * 0.5);
      fx += tangentX * wanderlustForce;
      fy += tangentY * wanderlustForce;

      // Fuerza centripeta - empuja hacia el centro periodicamente
      // Oscila para crear movimiento de ida y vuelta entre orbitas
      const time = Date.now() / 1000;
      const oscillation = Math.sin(time * 0.5) * 0.5 + 0.5; // 0 a 1
      const centripetalStrength = this.params.centripetalForce * (1 + escapeRatio * 2) * oscillation;
      fx += radialX * centripetalStrength;
      fy += radialY * centripetalStrength;

      // Salto de orbita aleatorio cuando esta escapando
      if (escapeRatio > 0.5 && Math.random() < this.params.orbitJump * 0.01) {
        const jumpDirection = Math.random() > 0.5 ? 1 : -1; // hacia afuera o adentro
        const jumpForce = jumpDirection * 1.5;
        fx += radialX * jumpForce;
        fy += radialY * jumpForce;
      }
    }

    // Fuerza de contención (evitar salir del canvas)
    const margin = 50;
    if (this.particle.x < margin) {
      fx += this.params.boundaryForce * (margin - this.particle.x) / margin;
    }
    if (this.particle.x > this.viz.width - margin) {
      fx -= this.params.boundaryForce * (this.particle.x - (this.viz.width - margin)) / margin;
    }
    if (this.particle.y < margin) {
      fy += this.params.boundaryForce * (margin - this.particle.y) / margin;
    }
    if (this.particle.y > this.viz.height - margin) {
      fy -= this.params.boundaryForce * (this.particle.y - (this.viz.height - margin)) / margin;
    }

    // Movimiento browniano (ruido aleatorio) - aumenta si esta atrapado
    const brownianBoost = 1 + escapeRatio * 2;
    fx += (Math.random() - 0.5) * this.params.randomImpulse * brownianBoost;
    fy += (Math.random() - 0.5) * this.params.randomImpulse * brownianBoost;

    // Impulso aleatorio fuerte ocasional cuando esta muy atrapado
    if (escapeRatio > 0.8 && Math.random() < 0.02) {
      const burstAngle = Math.random() * Math.PI * 2;
      fx += Math.cos(burstAngle) * 2;
      fy += Math.sin(burstAngle) * 2;
    }

    return { fx, fy };
  }

  update() {
    if (this.isPaused) return null;

    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Calcular y aplicar fuerzas
    const { fx, fy } = this.calculateForces();
    this.particle.applyForce(fx, fy);
    this.particle.update(this.params.friction);

    // Detectar set mas cercano
    const nearest = this.viz.getNearestSet(this.particle.x, this.particle.y);

    let event = null;

    // Si estamos suficientemente cerca, "caer" en el atractor
    if (nearest.distance < this.params.snapDistance) {
      if (!this.particle.currentSet || this.particle.currentSet.forte !== nearest.set.forte) {
        if (now - this.particle.lastSnapTime > 300) { // Cooldown
          event = {
            type: 'SET_CHANGE',
            from: this.particle.currentSet,
            to: nearest.set,
            distance: nearest.distance
          };
          this.particle.currentSet = nearest.set;
          this.particle.lastSnapTime = now;
          this.particle.timeInCurrentSet = 0; // Reset timer
        }
      } else {
        // Incrementar tiempo en el set actual
        this.particle.timeInCurrentSet += deltaTime;
      }
    } else {
      // No estamos en ningun set, resetear
      if (this.particle.currentSet) {
        this.particle.timeInCurrentSet += deltaTime;
      }
    }

    // Detectar si esta completamente atrapado (velocidad muy baja por mucho tiempo)
    const speed = this.particle.getSpeed();
    if (speed < 0.1) {
      this.particle.stuckCounter += deltaTime;
      // Si lleva mas de 3 segundos casi quieto, impulso de emergencia
      if (this.particle.stuckCounter > 3000) {
        this.randomImpulse(4);
        this.particle.stuckCounter = 0;
      }
    } else {
      this.particle.stuckCounter = Math.max(0, this.particle.stuckCounter - deltaTime * 2);
    }

    return event;
  }

  // Dar un impulso a la particula
  impulse(fx, fy) {
    this.particle.applyForce(fx, fy);
  }

  // Impulso aleatorio
  randomImpulse(strength = 5) {
    const angle = Math.random() * Math.PI * 2;
    this.impulse(Math.cos(angle) * strength, Math.sin(angle) * strength);
  }

  // Mover particula hacia un set especifico
  attractTo(forte) {
    const pos = this.viz.getPosition(forte);
    if (!pos) return;

    const dx = pos.x - this.particle.x;
    const dy = pos.y - this.particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.impulse((dx / dist) * 3, (dy / dist) * 3);
    }
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
}

// Sistema de Z-Portals
class ZPortalSystem {
  constructor() {
    this.tunnelProbability = 0.25;
    this.portalCooldown = 2000;
    this.lastTunnel = 0;
    this.enabled = true;

    // Efectos visuales activos
    this.activeEffects = [];
  }

  checkTunnel(currentSet, depth = 1) {
    if (!this.enabled) return null;

    const now = Date.now();
    if (now - this.lastTunnel < this.portalCooldown) return null;

    const { Z_PAIRS, SET_BY_FORTE } = window.SetTheory;
    const zMate = Z_PAIRS[currentSet.forte];

    if (!zMate) return null;

    // Probabilidad ajustada por profundidad
    const adjustedProb = this.tunnelProbability * depth;

    if (Math.random() < adjustedProb) {
      this.lastTunnel = now;

      const targetSet = SET_BY_FORTE[zMate];

      // Crear efecto visual
      this.createTunnelEffect(currentSet.forte, zMate);

      return {
        type: 'Z_TUNNEL',
        from: currentSet.forte,
        to: zMate,
        targetSet: targetSet
      };
    }

    return null;
  }

  createTunnelEffect(from, to) {
    this.activeEffects.push({
      from, to,
      startTime: Date.now(),
      duration: 800,
      progress: 0
    });
  }

  update() {
    const now = Date.now();
    this.activeEffects = this.activeEffects.filter(effect => {
      effect.progress = (now - effect.startTime) / effect.duration;
      return effect.progress < 1;
    });
  }

  drawEffects(ctx, viz) {
    this.activeEffects.forEach(effect => {
      const fromPos = viz.getPosition(effect.from);
      const toPos = viz.getPosition(effect.to);

      if (!fromPos || !toPos) return;

      const progress = effect.progress;
      const alpha = 1 - progress;

      // Linea brillante entre los portales
      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);

      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;
      const offset = Math.sin(progress * Math.PI) * 50;

      ctx.quadraticCurveTo(
        midX + offset * Math.cos(progress * 10),
        midY + offset * Math.sin(progress * 10),
        toPos.x, toPos.y
      );

      ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.stroke();

      // Circulos expandiendose
      const ringRadius = progress * 60;

      ctx.beginPath();
      ctx.arc(fromPos.x, fromPos.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(toPos.x, toPos.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
}

// Exportar
window.Particle = Particle;
window.PhysicsSystem = PhysicsSystem;
window.ZPortalSystem = ZPortalSystem;
