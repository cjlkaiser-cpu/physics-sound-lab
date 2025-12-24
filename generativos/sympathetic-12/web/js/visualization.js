/**
 * Sympathetic 12 - Visualization (Simplified)
 */

const PC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const STRING_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
];

class StringVisualization {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioProcessor = null;
        this.stringEnergies = new Array(12).fill(0);
        this.lastTime = 0;
        this.resize();
    }

    setAudioProcessor(processor) {
        this.audioProcessor = processor;
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.stringHeight = Math.floor(rect.height / 12);
    }

    update() {
        if (this.audioProcessor) {
            const energies = this.audioProcessor.getStringEnergies();
            for (let i = 0; i < 12; i++) {
                this.stringEnergies[i] = energies[i] || 0;
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear with dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        const rowHeight = height / 12;

        for (let i = 0; i < 12; i++) {
            const y = i * rowHeight;
            const energy = this.stringEnergies[i];
            const color = STRING_COLORS[i];

            // Row background
            ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#0f172a';
            ctx.fillRect(0, y, width, rowHeight);

            // Label
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(PC_NAMES[i], 15, y + rowHeight / 2);

            // Energy bar
            const barX = 50;
            const barWidth = 30;
            const barHeight = rowHeight - 10;
            ctx.fillStyle = '#374151';
            ctx.fillRect(barX, y + 5, barWidth, barHeight);

            const fillH = barHeight * Math.min(1, energy);
            ctx.fillStyle = color;
            ctx.fillRect(barX, y + 5 + barHeight - fillH, barWidth, fillH);

            // String line
            const lineY = y + rowHeight / 2;
            const lineX = 90;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 + energy * 3;
            ctx.globalAlpha = 0.5 + energy * 0.5;
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(width - 10, lineY);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.animate();
    }
}

class MatrixVisualization {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.matrix = new Array(144).fill(0.3);
        this.audioProcessor = null;
    }

    setAudioProcessor(processor) {
        this.audioProcessor = processor;
        if (processor) {
            this.matrix = processor.getSympathyMatrix();
        }
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        const cellW = width / 13;
        const cellH = height / 13;

        // Labels
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = STRING_COLORS[i];
            ctx.fillText(PC_NAMES[i], cellW * (i + 1.5), cellH * 0.5);
            ctx.fillText(PC_NAMES[i], cellW * 0.5, cellH * (i + 1.5));
        }

        // Matrix cells
        for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 12; col++) {
                const value = this.matrix[row * 12 + col];
                const x = cellW * (col + 1);
                const y = cellH * (row + 1);

                const lightness = 20 + value * 40;
                ctx.fillStyle = `hsl(200, 70%, ${lightness}%)`;
                ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
            }
        }
    }
}

class SpectrumVisualization {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioProcessor = null;
    }

    setAudioProcessor(processor) {
        this.audioProcessor = processor;
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        if (!this.audioProcessor) return;

        const data = this.audioProcessor.getFrequencyData();
        if (!data) return;

        const barWidth = width / (data.length / 2);
        ctx.fillStyle = '#8b5cf6';

        for (let i = 0; i < data.length / 2; i++) {
            const value = data[i] / 255;
            const barHeight = value * height;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }
    }
}

window.StringVisualization = StringVisualization;
window.MatrixVisualization = MatrixVisualization;
window.SpectrumVisualization = SpectrumVisualization;
window.STRING_COLORS = STRING_COLORS;
window.PC_NAMES = PC_NAMES;
