/**
 * Sympathetic 12 - Audio Processing
 *
 * Handles Web Audio setup and integration with the Rust/WASM synthesizer engine.
 * Uses ScriptProcessorNode for wide compatibility.
 */

class AudioProcessor {
    constructor() {
        this.ctx = null;
        this.synth = null;
        this.scriptNode = null;
        this.masterGain = null;
        this.analyser = null;
        this.isInitialized = false;
        this.isPlaying = false;

        // Buffer size for audio processing
        this.bufferSize = 256;

        // Analysis data for visualization
        this.frequencyData = null;
        this.waveformData = null;
    }

    /**
     * Initialize the audio system with the WASM module
     * @param {Object} wasmModule - The initialized WASM module (Sympathetic12)
     */
    async init(wasmModule) {
        if (this.isInitialized) return;

        // Create audio context
        this.ctx = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 44100
        });

        // Create the synthesizer
        this.synth = new wasmModule.Sympathetic12();

        // Create audio nodes
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.7;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.waveformData = new Uint8Array(this.analyser.fftSize);

        // Create script processor for audio generation
        this.scriptNode = this.ctx.createScriptProcessor(this.bufferSize, 0, 2);

        this.scriptNode.onaudioprocess = (event) => {
            if (!this.isPlaying || !this.synth) return;

            const outputL = event.outputBuffer.getChannelData(0);
            const outputR = event.outputBuffer.getChannelData(1);

            // Get stereo samples from WASM
            const samples = this.synth.process(this.bufferSize);

            // Deinterleave stereo samples
            for (let i = 0; i < this.bufferSize; i++) {
                outputL[i] = samples[i * 2];
                outputR[i] = samples[i * 2 + 1];
            }
        };

        // Connect audio graph
        this.scriptNode.connect(this.analyser);
        this.analyser.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.isInitialized = true;
    }

    /**
     * Start audio processing
     */
    start() {
        if (!this.isInitialized) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.isPlaying = true;
    }

    /**
     * Stop audio processing
     */
    stop() {
        this.isPlaying = false;
    }

    /**
     * Pluck a string
     * @param {number} pitchClass - Pitch class 0-11 (C=0, C#=1, ..., B=11)
     * @param {number} velocity - Velocity 0-1
     * @param {number} position - Pluck position 0-1
     */
    pluck(pitchClass, velocity = 0.8, position = 0.5) {
        if (!this.synth) return;
        this.synth.pluck(pitchClass, velocity, position);
    }

    /**
     * Pluck multiple strings (set class)
     * @param {number[]} pitchClasses - Array of pitch classes
     * @param {number} velocity - Velocity
     * @param {number} position - Pluck position
     */
    pluckSet(pitchClasses, velocity = 0.7, position = 0.5) {
        if (!this.synth) return;
        const arr = new Uint8Array(pitchClasses);
        this.synth.pluck_set(arr, velocity, position);
    }

    /**
     * Pluck a Forte prime form with transposition
     * @param {number[]} primeForm - Prime form array
     * @param {number} transposition - Transposition 0-11
     * @param {number} velocity - Velocity
     */
    pluckPrimeForm(primeForm, transposition = 0, velocity = 0.7) {
        if (!this.synth) return;
        const arr = new Uint8Array(primeForm);
        this.synth.pluck_prime_form(arr, transposition, velocity);
    }

    /**
     * Damp a specific string
     */
    damp(pitchClass, amount = 0.5) {
        if (!this.synth) return;
        this.synth.damp(pitchClass, amount);
    }

    /**
     * Damp all strings
     */
    dampAll(amount = 0.5) {
        if (!this.synth) return;
        this.synth.damp_all(amount);
    }

    // ========================================================================
    // Parameter setters
    // ========================================================================

    setMasterVolume(value) {
        if (this.synth) this.synth.set_master_volume(value);
    }

    setReverbMix(value) {
        if (this.synth) this.synth.set_reverb_mix(value);
    }

    setReverbSize(value) {
        if (this.synth) this.synth.set_reverb_size(value);
    }

    setReverbDamping(value) {
        if (this.synth) this.synth.set_reverb_damping(value);
    }

    setSympathyAmount(value) {
        if (this.synth) this.synth.set_sympathy_amount(value);
    }

    setGlobalDamping(value) {
        if (this.synth) this.synth.set_global_damping(value);
    }

    setGlobalBrightness(value) {
        if (this.synth) this.synth.set_global_brightness(value);
    }

    setBaseOctave(octave) {
        if (this.synth) this.synth.set_base_octave(octave);
    }

    setStringInharmonicity(pitchClass, amount) {
        if (this.synth) this.synth.set_string_inharmonicity(pitchClass, amount);
    }

    // ========================================================================
    // Presets
    // ========================================================================

    presetPiano() {
        if (this.synth) this.synth.preset_piano();
    }

    presetHarp() {
        if (this.synth) this.synth.preset_harp();
    }

    presetGuitar() {
        if (this.synth) this.synth.preset_guitar();
    }

    presetSitar() {
        if (this.synth) this.synth.preset_sitar();
    }

    presetBell() {
        if (this.synth) this.synth.preset_bell();
    }

    presetPad() {
        if (this.synth) this.synth.preset_pad();
    }

    // ========================================================================
    // Visualization data
    // ========================================================================

    getStringEnergies() {
        if (!this.synth) return new Array(12).fill(0);
        return Array.from(this.synth.get_string_energies());
    }

    getSympathyMatrix() {
        if (!this.synth) return new Array(144).fill(0);
        return Array.from(this.synth.get_sympathy_matrix());
    }

    getStringWaveform(pitchClass, numSamples = 128) {
        if (!this.synth) return new Array(numSamples).fill(0);
        return Array.from(this.synth.get_string_waveform(pitchClass, numSamples));
    }

    getActiveVoiceCount() {
        if (!this.synth) return 0;
        return this.synth.get_active_voice_count();
    }

    getFrequencyData() {
        if (!this.analyser) return null;
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    getWaveformData() {
        if (!this.analyser) return null;
        this.analyser.getByteTimeDomainData(this.waveformData);
        return this.waveformData;
    }
}

// Export for use in main application
window.AudioProcessor = AudioProcessor;
