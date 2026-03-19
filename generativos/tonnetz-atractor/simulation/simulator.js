/**
 * Tonnetz Grid Simulator - Headless Physics Engine
 * For batch simulations and data collection
 */

// === CONSTANTS ===
const NOTE_FREQ = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'Ab': 415.30, 'A': 440.00, 'Bb': 466.16, 'B': 493.88
};

// Pitch class to semitone mapping for voice leading calculation
const NOTE_TO_SEMITONE = {
    'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11
};

// === TONNETZ GRID CONFIGURATION ===
const COLS = 5;
const ROWS = 4;
const DX = 140;
const DY = 100;
const OFFSET_X = 120;
const OFFSET_Y = 100;
const CANVAS_W = 900;
const CANVAS_H = 550;

const ROW_NOTES = [
    ['A', 'E', 'B', 'F#', 'C#'],   // Row 0 (bottom)
    ['C', 'G', 'D', 'A', 'E'],      // Row 1 (offset)
    ['Ab', 'Eb', 'Bb', 'F', 'C'],   // Row 2
    ['B', 'F#', 'C#', 'Ab', 'Eb']   // Row 3 (offset, top)
];

// === CHORD DEFINITIONS ===
const MAJOR_CHORDS = {
    'A,C#,E': 'A', 'Bb,D,F': 'Bb', 'B,Eb,F#': 'B', 'C,E,G': 'C',
    'C#,F,Ab': 'C#', 'D,F#,A': 'D', 'Eb,G,Bb': 'Eb', 'E,Ab,B': 'E',
    'F,A,C': 'F', 'F#,Bb,C#': 'F#', 'G,B,D': 'G', 'Ab,C,Eb': 'Ab'
};

const MINOR_CHORDS = {
    'A,C,E': 'Am', 'Bb,C#,F': 'Bbm', 'B,D,F#': 'Bm', 'C,Eb,G': 'Cm',
    'C#,E,Ab': 'C#m', 'D,F,A': 'Dm', 'Eb,F#,Bb': 'Ebm', 'E,G,B': 'Em',
    'F,Ab,C': 'Fm', 'F#,A,C#': 'F#m', 'G,Bb,D': 'Gm', 'Ab,B,Eb': 'Abm'
};

// === SIMULATION CLASS ===
class TonnetzSimulator {
    constructor(params = {}) {
        this.params = {
            force: params.force || 100,
            friction: params.friction || 0.003,
            initialVelocity: params.initialVelocity || 8,
            ...params
        };

        this.nodes = [];
        this.triangles = [];
        this.particle = { x: 0, y: 0, vx: 0, vy: 0 };
        this.currentTriangle = null;
        this.events = [];
        this.lastEventTime = 0;
        this.chordCooldown = 300; // ms

        this._initNodes();
        this._initTriangles();
    }

    _initNodes() {
        let nodeId = 0;
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const isOffset = row % 2 === 1;
                const x = OFFSET_X + col * DX + (isOffset ? DX / 2 : 0);
                const y = OFFSET_Y + (ROWS - 1 - row) * DY;
                const noteName = ROW_NOTES[row][col];

                this.nodes.push({
                    id: nodeId++,
                    name: noteName,
                    row: row,
                    col: col,
                    x: x,
                    y: y
                });
            }
        }
    }

    _getNode(row, col) {
        return this.nodes.find(n => n.row === row && n.col === col);
    }

    _identifyChord(noteArray, type) {
        const notes = [...noteArray].sort();
        const key = notes.join(',');

        if (type === 'major') {
            return MAJOR_CHORDS[key] || notes.join('-');
        } else {
            return MINOR_CHORDS[key] || notes.join('-') + 'm';
        }
    }

    _initTriangles() {
        for (let row = 0; row < ROWS - 1; row++) {
            const lowerNodes = this.nodes.filter(n => n.row === row).sort((a, b) => a.col - b.col);
            const upperNodes = this.nodes.filter(n => n.row === row + 1).sort((a, b) => a.col - b.col);

            // Minor triangles (pointing up)
            for (let i = 0; i < lowerNodes.length - 1; i++) {
                const n1 = lowerNodes[i];
                const n2 = lowerNodes[i + 1];
                const midX = (n1.x + n2.x) / 2;

                const upperNode = upperNodes.reduce((closest, node) => {
                    const distCurrent = Math.abs(node.x - midX);
                    const distClosest = closest ? Math.abs(closest.x - midX) : Infinity;
                    return distCurrent < distClosest ? node : closest;
                }, null);

                if (upperNode && Math.abs(upperNode.x - midX) < DX * 0.6) {
                    this.triangles.push({
                        vertices: [n1, n2, upperNode],
                        notes: [n1.name, n2.name, upperNode.name],
                        type: 'minor',
                        name: this._identifyChord([n1.name, n2.name, upperNode.name], 'minor')
                    });
                }
            }

            // Major triangles (pointing down)
            for (let i = 0; i < upperNodes.length - 1; i++) {
                const n1 = upperNodes[i];
                const n2 = upperNodes[i + 1];
                const midX = (n1.x + n2.x) / 2;

                const lowerNode = lowerNodes.reduce((closest, node) => {
                    const distCurrent = Math.abs(node.x - midX);
                    const distClosest = closest ? Math.abs(closest.x - midX) : Infinity;
                    return distCurrent < distClosest ? node : closest;
                }, null);

                if (lowerNode && Math.abs(lowerNode.x - midX) < DX * 0.6) {
                    this.triangles.push({
                        vertices: [n1, n2, lowerNode],
                        notes: [n1.name, n2.name, lowerNode.name],
                        type: 'major',
                        name: this._identifyChord([n1.name, n2.name, lowerNode.name], 'major')
                    });
                }
            }
        }
    }

    _pointInTriangle(px, py, v0, v1, v2) {
        const ax = v0.x, ay = v0.y;
        const bx = v1.x, by = v1.y;
        const cx = v2.x, cy = v2.y;

        const v0x = cx - ax, v0y = cy - ay;
        const v1x = bx - ax, v1y = by - ay;
        const v2x = px - ax, v2y = py - ay;

        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;

        const inv = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * inv;
        const v = (dot00 * dot12 - dot01 * dot02) * inv;

        return (u >= 0) && (v >= 0) && (u + v <= 1);
    }

    _findTriangle() {
        for (const tri of this.triangles) {
            const [v0, v1, v2] = tri.vertices;
            if (this._pointInTriangle(this.particle.x, this.particle.y, v0, v1, v2)) {
                return tri;
            }
        }
        return null;
    }

    _areAdjacent(tri1, tri2) {
        if (!tri1 || !tri2) return false;

        const notes1 = new Set(tri1.notes);
        const notes2 = new Set(tri2.notes);
        let common = 0;

        for (const note of notes1) {
            if (notes2.has(note)) common++;
        }

        return common === 2;
    }

    _getTransformation(tri1, tri2) {
        if (!tri1 || !tri2) return null;

        const notes1 = new Set(tri1.notes);
        const notes2 = new Set(tri2.notes);

        // Find the different notes
        let diff1 = null, diff2 = null;
        for (const n of notes1) {
            if (!notes2.has(n)) diff1 = n;
        }
        for (const n of notes2) {
            if (!notes1.has(n)) diff2 = n;
        }

        if (!diff1 || !diff2) return null;

        const semitone1 = NOTE_TO_SEMITONE[diff1];
        const semitone2 = NOTE_TO_SEMITONE[diff2];
        const diff = Math.abs(semitone2 - semitone1);
        const minDiff = Math.min(diff, 12 - diff);

        // P: changes 3rd (1 semitone), same root and 5th
        // L: changes root by semitone
        // R: changes 5th by whole tone (2 semitones)

        if (minDiff === 1) {
            // Could be P or L - check if mode changed
            if (tri1.type !== tri2.type) {
                return 'P'; // Parallel - same root, different mode
            }
            return 'L'; // Leading-tone
        } else if (minDiff === 2) {
            return 'R'; // Relative
        }

        return '?';
    }

    _calculateVoiceLeading(tri1, tri2) {
        if (!tri1 || !tri2) return 0;

        const notes1 = tri1.notes.map(n => NOTE_TO_SEMITONE[n]).sort((a, b) => a - b);
        const notes2 = tri2.notes.map(n => NOTE_TO_SEMITONE[n]).sort((a, b) => a - b);

        let totalMovement = 0;
        for (let i = 0; i < 3; i++) {
            const diff = Math.abs(notes2[i] - notes1[i]);
            totalMovement += Math.min(diff, 12 - diff);
        }

        return totalMovement / 3; // Average voice movement
    }

    reset(initialX = null, initialY = null) {
        const centerX = OFFSET_X + (COLS - 1) * DX / 2 + DX / 4;
        const centerY = OFFSET_Y + (ROWS - 1) * DY / 2;

        this.particle.x = initialX !== null ? initialX : centerX + (Math.random() - 0.5) * 100;
        this.particle.y = initialY !== null ? initialY : centerY + (Math.random() - 0.5) * 80;

        const angle = Math.random() * Math.PI * 2;
        this.particle.vx = this.params.initialVelocity * Math.cos(angle);
        this.particle.vy = this.params.initialVelocity * Math.sin(angle);

        this.currentTriangle = null;
        this.events = [];
        this.lastEventTime = 0;
    }

    step(dt, currentTime) {
        const steps = 6;
        const subDt = dt / steps;

        for (let step = 0; step < steps; step++) {
            let fx = 0, fy = 0;

            for (const node of this.nodes) {
                const dx = node.x - this.particle.x;
                const dy = node.y - this.particle.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                const safeDist = Math.max(dist, 25);

                // 1/r^3 force
                const forceMag = this.params.force * 12000 / (safeDist * safeDist * safeDist);
                fx += forceMag * dx / dist;
                fy += forceMag * dy / dist;
            }

            fx -= this.params.friction * this.particle.vx;
            fy -= this.params.friction * this.particle.vy;

            this.particle.vx += fx * subDt;
            this.particle.vy += fy * subDt;
            this.particle.x += this.particle.vx * subDt;
            this.particle.y += this.particle.vy * subDt;
        }

        // Bounds
        const margin = 40;
        if (this.particle.x < margin) { this.particle.x = margin; this.particle.vx *= -0.5; }
        if (this.particle.x > CANVAS_W - margin) { this.particle.x = CANVAS_W - margin; this.particle.vx *= -0.5; }
        if (this.particle.y < margin) { this.particle.y = margin; this.particle.vy *= -0.5; }
        if (this.particle.y > CANVAS_H - margin) { this.particle.y = CANVAS_H - margin; this.particle.vy *= -0.5; }

        // Check triangle
        const foundTriangle = this._findTriangle();

        if (foundTriangle && foundTriangle !== this.currentTriangle &&
            (currentTime - this.lastEventTime) > this.chordCooldown) {

            const prevTriangle = this.currentTriangle;
            const isAdjacent = this._areAdjacent(prevTriangle, foundTriangle);
            const transformation = this._getTransformation(prevTriangle, foundTriangle);
            const voiceLeading = this._calculateVoiceLeading(prevTriangle, foundTriangle);

            this.events.push({
                timestamp: currentTime,
                chord: foundTriangle.name,
                type: foundTriangle.type,
                notes: foundTriangle.notes,
                transformation: transformation,
                isAdjacent: isAdjacent,
                voiceLeading: voiceLeading,
                prevChord: prevTriangle ? prevTriangle.name : null
            });

            this.currentTriangle = foundTriangle;
            this.lastEventTime = currentTime;
        }
    }

    run(durationMs, dtMs = 16.67) {
        this.reset();

        let currentTime = 0;
        while (currentTime < durationMs) {
            this.step(dtMs / 1000, currentTime);
            currentTime += dtMs;
        }

        return this.getStatistics();
    }

    getStatistics() {
        const events = this.events;

        if (events.length === 0) {
            return {
                totalTransitions: 0,
                uniqueChords: 0,
                adjacencyRate: 0,
                avgVoiceLeading: 0,
                transformationCounts: { P: 0, L: 0, R: 0 },
                chordSequence: [],
                events: []
            };
        }

        const uniqueChords = new Set(events.map(e => e.chord));
        const adjacentCount = events.filter(e => e.isAdjacent).length;
        const transformations = events.filter(e => e.transformation);

        const transformationCounts = { P: 0, L: 0, R: 0, '?': 0 };
        for (const e of events) {
            if (e.transformation && transformationCounts.hasOwnProperty(e.transformation)) {
                transformationCounts[e.transformation]++;
            }
        }

        const voiceLeadingValues = events.filter(e => e.voiceLeading > 0).map(e => e.voiceLeading);
        const avgVoiceLeading = voiceLeadingValues.length > 0
            ? voiceLeadingValues.reduce((a, b) => a + b, 0) / voiceLeadingValues.length
            : 0;

        // Detect cycles
        const sequence = events.map(e => e.chord);
        let cycleLength = 0;
        for (let len = 3; len <= Math.floor(sequence.length / 2); len++) {
            const pattern = sequence.slice(-len).join(',');
            const prevPattern = sequence.slice(-2 * len, -len).join(',');
            if (pattern === prevPattern) {
                cycleLength = len;
                break;
            }
        }

        return {
            totalTransitions: events.length,
            uniqueChords: uniqueChords.size,
            adjacencyRate: events.length > 1 ? adjacentCount / (events.length - 1) : 1,
            avgVoiceLeading: avgVoiceLeading,
            transformationCounts: transformationCounts,
            cycleLength: cycleLength,
            chordSequence: sequence,
            events: events
        };
    }
}

// === EXPORTS ===
module.exports = { TonnetzSimulator, NOTE_TO_SEMITONE, MAJOR_CHORDS, MINOR_CHORDS };
