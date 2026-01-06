/**
 * Kepler vs Voyager - Main Application
 * Integrates spectrum visualization and audio playback
 */

// Estado global
const state = {
    currentPlanet: 'jupiter',
    keplerData: null,
    nasaData: {},
    samplesLoaded: {}
};

// Instancias
let spectrum = null;
let audio = null;

/**
 * Inicializa la aplicación
 */
async function init() {
    console.log('Inicializando Kepler vs Voyager...');

    // Crear instancias
    spectrum = new SpectrumVisualizer('spectrum-canvas');
    audio = new AudioManager();

    // Mostrar loading
    spectrum.showLoading();

    // Cargar datos
    try {
        await loadKeplerData();
        await loadNASAData('jupiter');
        await audio.loadSamples('jupiter');

        state.samplesLoaded.jupiter = true;

        // Renderizar
        updateVisualization();
        updateUI();

        console.log('Aplicación inicializada');
    } catch (error) {
        console.error('Error inicializando:', error);
        spectrum.showError('No se pudieron cargar los datos');
    }

    // Event listeners
    setupEventListeners();
}

/**
 * Carga datos de Kepler
 */
async function loadKeplerData() {
    try {
        const response = await fetch('assets/data/kepler_data.json');
        if (!response.ok) throw new Error('Kepler data not found');

        state.keplerData = await response.json();
        console.log('Datos Kepler cargados:', state.keplerData);
    } catch (error) {
        console.warn('Usando datos Kepler por defecto');
        // Datos por defecto si no existe el JSON
        state.keplerData = {
            planets: {
                jupiter: { frequency: 96.6, orbital: { a_ua: 5.203, T_years: 11.862, velocity: 2.76 } },
                saturn: { frequency: 71.2, orbital: { a_ua: 9.537, T_years: 29.457, velocity: 2.03 } },
                uranus: { frequency: 50.3, orbital: { a_ua: 19.191, T_years: 84.011, velocity: 1.44 } },
                neptune: { frequency: 40.2, orbital: { a_ua: 30.069, T_years: 164.79, velocity: 1.15 } }
            }
        };
    }
}

/**
 * Carga datos NASA para un planeta
 */
async function loadNASAData(planet) {
    try {
        const response = await fetch(`assets/data/${planet}_spectrum.json`);
        if (!response.ok) throw new Error(`NASA data for ${planet} not found`);

        state.nasaData[planet] = await response.json();
        console.log(`Datos NASA ${planet} cargados`);
    } catch (error) {
        console.warn(`No hay datos NASA para ${planet}:`, error.message);
        state.nasaData[planet] = null;
    }
}

/**
 * Actualiza la visualización del espectro
 */
function updateVisualization() {
    const planet = state.currentPlanet;

    // Configurar Kepler
    const keplerFreq = state.keplerData?.planets?.[planet]?.frequency || 0;
    spectrum.setKeplerFrequency(keplerFreq);

    // Configurar NASA
    const nasaData = state.nasaData[planet];
    if (nasaData) {
        spectrum.setNASAData(nasaData);
    } else {
        spectrum.setNASAData(null);
    }

    // Renderizar
    spectrum.render(planet);
}

/**
 * Actualiza la interfaz de usuario
 */
function updateUI() {
    const planet = state.currentPlanet;
    const keplerData = state.keplerData?.planets?.[planet];
    const nasaData = state.nasaData[planet];

    // Frecuencia Kepler
    const keplerFreqEl = document.getElementById('kepler-freq');
    const keplerFreqInfoEl = document.getElementById('kepler-freq-info');
    if (keplerData) {
        keplerFreqEl.textContent = keplerData.frequency.toFixed(1);
        keplerFreqInfoEl.textContent = `${keplerData.frequency.toFixed(1)} Hz`;
    }

    // Datos NASA
    const nasaPeakEl = document.getElementById('nasa-peak');
    const nasaPeakInfoEl = document.getElementById('nasa-peak-info');
    const nasaCentroidEl = document.getElementById('nasa-centroid');

    if (nasaData && nasaData.peaks) {
        const mainPeak = nasaData.peaks.frequencies[0];
        nasaPeakEl.textContent = mainPeak.toFixed(0);
        nasaPeakInfoEl.textContent = `${mainPeak.toFixed(0)} Hz`;

        if (nasaData.statistics) {
            nasaCentroidEl.textContent = `${nasaData.statistics.centroid.toFixed(0)} Hz`;
        }

        // Comparación
        const freqDiff = Math.abs(mainPeak - keplerData.frequency);
        const freqRatio = mainPeak / keplerData.frequency;

        document.getElementById('freq-diff').textContent = `${freqDiff.toFixed(1)} Hz`;
        document.getElementById('freq-ratio').textContent = freqRatio.toFixed(3);

        // Intervalo musical aproximado
        const interval = findNearestInterval(freqRatio);
        document.getElementById('musical-interval').textContent = interval;

        document.getElementById('correlation').textContent =
            freqDiff < 50 ? 'Cercana' : freqDiff < 200 ? 'Moderada' : 'Baja';
    } else {
        nasaPeakEl.textContent = '--';
        nasaPeakInfoEl.textContent = '-- Hz';
        nasaCentroidEl.textContent = '-- Hz';
        document.getElementById('freq-diff').textContent = '-- Hz';
        document.getElementById('freq-ratio').textContent = '--';
        document.getElementById('musical-interval').textContent = '--';
        document.getElementById('correlation').textContent = 'Sin datos';
    }
}

/**
 * Encuentra el intervalo musical más cercano
 */
function findNearestInterval(ratio) {
    const intervals = {
        'Unísono': 1,
        'Segunda menor': 16/15,
        'Segunda mayor': 9/8,
        'Tercera menor': 6/5,
        'Tercera mayor': 5/4,
        'Cuarta': 4/3,
        'Tritono': 45/32,
        'Quinta': 3/2,
        'Sexta menor': 8/5,
        'Sexta mayor': 5/3,
        'Séptima menor': 9/5,
        'Séptima mayor': 15/8,
        'Octava': 2
    };

    let nearest = 'N/A';
    let minDiff = Infinity;

    for (const [name, value] of Object.entries(intervals)) {
        const diff = Math.abs(ratio - value);
        if (diff < minDiff) {
            minDiff = diff;
            nearest = name;
        }
    }

    return `~${nearest}`;
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Botones de planeta
    document.querySelectorAll('.planet-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.disabled) return;

            // Actualizar estado visual
            document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Cambiar planeta
            const planet = btn.dataset.planet;
            await selectPlanet(planet);
        });
    });

    // Play Kepler
    document.getElementById('play-kepler').addEventListener('click', async () => {
        const btn = document.getElementById('play-kepler');
        const freq = state.keplerData?.planets?.[state.currentPlanet]?.frequency;

        if (!freq) return;

        btn.classList.add('playing');
        await audio.init();
        audio.playKeplerTone(freq, 3);

        setTimeout(() => btn.classList.remove('playing'), 3000);
    });

    // Play NASA
    document.getElementById('play-nasa').addEventListener('click', async () => {
        const btn = document.getElementById('play-nasa');
        const sampleIndex = parseInt(document.getElementById('sample-select').value);

        if (!state.samplesLoaded[state.currentPlanet]) {
            console.warn('Samples no cargados');
            return;
        }

        btn.classList.add('playing');
        await audio.init();
        audio.playSample(state.currentPlanet, sampleIndex);

        setTimeout(() => btn.classList.remove('playing'), 5000);
    });

    // A/B Test
    document.getElementById('play-ab').addEventListener('click', async () => {
        const btn = document.getElementById('play-ab');
        const freq = state.keplerData?.planets?.[state.currentPlanet]?.frequency;
        const sampleIndex = parseInt(document.getElementById('sample-select').value);

        if (!freq) return;

        btn.classList.add('playing');
        await audio.init();
        audio.playABTest(freq, state.currentPlanet, sampleIndex);

        setTimeout(() => btn.classList.remove('playing'), 8000);
    });
}

/**
 * Selecciona un planeta
 */
async function selectPlanet(planet) {
    state.currentPlanet = planet;

    // Cargar datos si no existen
    if (!state.nasaData[planet]) {
        await loadNASAData(planet);
    }

    if (!state.samplesLoaded[planet]) {
        const loaded = await audio.loadSamples(planet);
        state.samplesLoaded[planet] = loaded;
    }

    updateVisualization();
    updateUI();
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
