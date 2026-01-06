/**
 * Kepler vs Voyager - Spectrum Visualization
 * Canvas-based spectral display
 */

class SpectrumVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Configurar dimensiones
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Padding para ejes
        this.padding = {
            top: 40,
            right: 40,
            bottom: 60,
            left: 70
        };

        // Colores
        this.colors = {
            nasa: '#4488ff',
            kepler: '#ff4444',
            peaks: '#44ff88',
            grid: '#2a2a3a',
            text: '#888888',
            background: '#0a0a0f'
        };

        // Rango de frecuencias
        this.freqMin = 20;
        this.freqMax = 2000;

        // Datos actuales
        this.nasaData = null;
        this.keplerFreq = null;
    }

    /**
     * Establece datos NASA
     */
    setNASAData(data) {
        this.nasaData = data;
    }

    /**
     * Establece frecuencia de Kepler
     */
    setKeplerFrequency(freq) {
        this.keplerFreq = freq;
    }

    /**
     * Limpia el canvas
     */
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Dibuja ejes y grid
     */
    drawAxes() {
        const ctx = this.ctx;
        const { top, right, bottom, left } = this.padding;
        const plotWidth = this.width - left - right;
        const plotHeight = this.height - top - bottom;

        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        // Eje X
        ctx.beginPath();
        ctx.moveTo(left, this.height - bottom);
        ctx.lineTo(this.width - right, this.height - bottom);
        ctx.stroke();

        // Eje Y
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, this.height - bottom);
        ctx.stroke();

        // Grid vertical y labels X
        ctx.fillStyle = this.colors.text;
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';

        const freqSteps = [20, 100, 200, 500, 1000, 1500, 2000];
        freqSteps.forEach(freq => {
            const x = this.freqToX(freq);

            // Línea de grid
            ctx.strokeStyle = this.colors.grid;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, this.height - bottom);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Label
            ctx.fillText(freq.toString(), x, this.height - bottom + 20);
        });

        // Label eje X
        ctx.fillText('Frecuencia (Hz)', this.width / 2, this.height - 10);

        // Label eje Y
        ctx.save();
        ctx.translate(15, this.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('PSD (dB/Hz)', 0, 0);
        ctx.restore();
    }

    /**
     * Convierte frecuencia a coordenada X
     */
    freqToX(freq) {
        const { left, right } = this.padding;
        const plotWidth = this.width - left - right;

        // Escala logarítmica para mejor visualización
        const logMin = Math.log10(this.freqMin);
        const logMax = Math.log10(this.freqMax);
        const logFreq = Math.log10(Math.max(freq, this.freqMin));

        return left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
    }

    /**
     * Convierte amplitud a coordenada Y
     */
    ampToY(amp, minAmp, maxAmp) {
        const { top, bottom } = this.padding;
        const plotHeight = this.height - top - bottom;

        const normalized = (amp - minAmp) / (maxAmp - minAmp);
        return this.height - bottom - (normalized * plotHeight);
    }

    /**
     * Dibuja espectro NASA
     */
    drawNASASpectrum() {
        if (!this.nasaData || !this.nasaData.spectrum) return;

        const ctx = this.ctx;
        const { freqs, psd_db } = this.nasaData.spectrum;

        // Encontrar rango de amplitudes
        const minAmp = Math.min(...psd_db);
        const maxAmp = Math.max(...psd_db);

        // Dibujar línea del espectro
        ctx.strokeStyle = this.colors.nasa;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();

        let started = false;
        freqs.forEach((freq, i) => {
            if (freq < this.freqMin || freq > this.freqMax) return;

            const x = this.freqToX(freq);
            const y = this.ampToY(psd_db[i], minAmp, maxAmp);

            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
        ctx.globalAlpha = 1;

        // Dibujar picos
        if (this.nasaData.peaks) {
            ctx.fillStyle = this.colors.peaks;

            this.nasaData.peaks.frequencies.slice(0, 10).forEach((peakFreq, i) => {
                if (peakFreq < this.freqMin || peakFreq > this.freqMax) return;

                const x = this.freqToX(peakFreq);
                const amp = this.nasaData.peaks.amplitudes[i];
                const y = this.ampToY(amp, minAmp, maxAmp);

                // Punto
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();

                // Label para top 5
                if (i < 5) {
                    ctx.font = '10px JetBrains Mono, monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${peakFreq.toFixed(0)}`, x, y - 10);
                }
            });
        }

        return { minAmp, maxAmp };
    }

    /**
     * Dibuja línea vertical de Kepler
     */
    drawKeplerLine(ampRange) {
        if (!this.keplerFreq) return;

        const ctx = this.ctx;
        const x = this.freqToX(this.keplerFreq);
        const { top, bottom } = this.padding;

        // Línea vertical
        ctx.strokeStyle = this.colors.kepler;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, this.height - bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = this.colors.kepler;
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';

        // Fondo para el label
        const labelText = `Kepler: ${this.keplerFreq.toFixed(1)} Hz`;
        const labelWidth = ctx.measureText(labelText).width + 10;

        ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
        ctx.fillRect(x - labelWidth/2, top - 25, labelWidth, 20);

        ctx.fillStyle = this.colors.kepler;
        ctx.fillText(labelText, x, top - 10);
    }

    /**
     * Dibuja título
     */
    drawTitle(planetName) {
        const ctx = this.ctx;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
            `${planetName.toUpperCase()} - Kepler vs NASA Voyager`,
            this.padding.left,
            25
        );
    }

    /**
     * Renderiza todo el espectro
     */
    render(planetName = 'Jupiter') {
        this.clear();
        this.drawAxes();

        const ampRange = this.drawNASASpectrum();
        this.drawKeplerLine(ampRange);
        this.drawTitle(planetName);
    }

    /**
     * Muestra mensaje de carga
     */
    showLoading() {
        this.clear();
        const ctx = this.ctx;

        ctx.fillStyle = this.colors.text;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Cargando datos...', this.width / 2, this.height / 2);
    }

    /**
     * Muestra mensaje de error
     */
    showError(message) {
        this.clear();
        const ctx = this.ctx;

        ctx.fillStyle = this.colors.kepler;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Error: ${message}`, this.width / 2, this.height / 2);
    }
}

// Exportar para uso global
window.SpectrumVisualizer = SpectrumVisualizer;
