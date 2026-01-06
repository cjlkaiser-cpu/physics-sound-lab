/**
 * Kepler vs Voyager - Audio Manager
 * Web Audio API for Kepler tones and NASA samples
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.currentSource = null;
        this.currentOscillator = null;
        this.gainNode = null;
        this.samples = {};
        this.isPlaying = false;
    }

    /**
     * Inicializa el contexto de audio (requiere interacción del usuario)
     */
    async init() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Nodo de ganancia master
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.5;
        this.gainNode.connect(this.audioContext.destination);

        console.log('AudioContext inicializado');
    }

    /**
     * Resume el contexto si está suspendido
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Carga samples de un planeta
     */
    async loadSamples(planetName, sampleCount = 5) {
        await this.init();

        if (this.samples[planetName]) {
            console.log(`Samples de ${planetName} ya cargados`);
            return true;
        }

        this.samples[planetName] = [];

        for (let i = 0; i < sampleCount; i++) {
            const url = `assets/samples/${planetName}/sample_${i.toString().padStart(2, '0')}.mp3`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`Sample no encontrado: ${url}`);
                    continue;
                }

                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.samples[planetName].push(audioBuffer);
                console.log(`Cargado: ${url}`);
            } catch (error) {
                console.warn(`Error cargando ${url}:`, error);
            }
        }

        console.log(`${this.samples[planetName].length} samples cargados para ${planetName}`);
        return this.samples[planetName].length > 0;
    }

    /**
     * Reproduce un tono de Kepler (oscilador senoidal)
     */
    async playKeplerTone(frequency, duration = 3) {
        this.stop();
        await this.init();
        await this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = frequency;

        // Envelope ADSR simple
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.1);  // Attack
        gain.gain.setValueAtTime(0.4, now + duration - 0.3); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

        osc.connect(gain);
        gain.connect(this.gainNode);

        osc.start(now);
        osc.stop(now + duration);

        this.currentOscillator = osc;
        this.isPlaying = true;

        osc.onended = () => {
            this.isPlaying = false;
            this.currentOscillator = null;
        };

        return osc;
    }

    /**
     * Reproduce un sample de NASA
     */
    async playSample(planetName, sampleIndex = 0) {
        this.stop();
        await this.init();
        await this.resume();

        const samples = this.samples[planetName];
        if (!samples || samples.length === 0) {
            console.warn(`No hay samples para ${planetName}`);
            return null;
        }

        const index = Math.min(sampleIndex, samples.length - 1);
        const buffer = samples[index];

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.7;

        source.connect(gain);
        gain.connect(this.gainNode);

        source.start(0);

        this.currentSource = source;
        this.isPlaying = true;

        source.onended = () => {
            this.isPlaying = false;
            this.currentSource = null;
        };

        return source;
    }

    /**
     * Modo A/B: alterna entre Kepler y NASA
     */
    async playABTest(keplerFreq, planetName, sampleIndex = 0) {
        await this.init();
        await this.resume();

        // Primero Kepler (2s)
        this.playKeplerTone(keplerFreq, 2);

        // Pausa de 0.5s y luego NASA
        setTimeout(() => {
            this.playSample(planetName, sampleIndex);
        }, 2500);
    }

    /**
     * Detiene toda reproducción
     */
    stop() {
        if (this.currentOscillator) {
            try {
                this.currentOscillator.stop();
            } catch (e) {}
            this.currentOscillator = null;
        }

        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {}
            this.currentSource = null;
        }

        this.isPlaying = false;
    }

    /**
     * Establece volumen master (0-1)
     */
    setVolume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, value));
        }
    }
}

// Exportar para uso global
window.AudioManager = AudioManager;
