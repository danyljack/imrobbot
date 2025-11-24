const cuteText = "SYSTEM ONLINE... HELLO FRIEND! I AM ROBBOT... VIBES: 100%... CLICK ME!";
const scaryText = "SYSTEM COMPROMISED... UNAUTHORIZED ACCESS... VIRUS DOWNLOADED... DESTRUCTION IMMINENT...";
const typeWriterElement = document.getElementById('typewriter');
const robotImage = document.querySelector('.pixel-art');
let isCorrupted = false;
let typingInterval;

// --- Sound Manager ---
const SoundManager = {
    ctx: null,
    isPlayingMusic: false,
    currentMode: 'chill', // 'chill' or 'tension'
    nextNoteTime: 0,
    tempo: 70,
    lookahead: 25.0,
    scheduleAheadTime: 0.1,
    current16thNote: 0,
    timerID: null,

    init: function () {
        if (this.ctx) return;
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    },

    playTone: function (freq, type, duration, vol = 0.1) {
        if (!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playNoise: function (duration, vol = 0.2) {
        if (!this.ctx) this.init();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    },

    // --- Music Sequencer ---
    nextNote: function () {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.current16thNote++;
        if (this.current16thNote === 16) {
            this.current16thNote = 0;
        }
    },

    scheduleNote: function (beatNumber, time) {
        if (this.currentMode === 'chill') {
            this.scheduleChillNote(beatNumber, time);
        } else {
            this.scheduleTensionNote(beatNumber, time);
        }
    },

    scheduleChillNote: function (beatNumber, time) {
        // Kick (Louder)
        if (beatNumber === 0 || beatNumber === 8) {
            this.playDrum(100, 0.1, time, 0.6);
        }

        // Snare (Louder)
        if (beatNumber === 4 || beatNumber === 12) {
            this.playSnare(time, 0.3);
        }

        // Hi-hat (Louder)
        if (beatNumber % 2 === 0) {
            this.playHiHat(time, 0.2);
        }

        // Bass/Melody (Louder)
        const notes = [220, 261.63, 329.63, 392.00];
        if (beatNumber % 4 === 0) {
            this.playSynth(notes[Math.floor(beatNumber / 4)], time, 'triangle', 0.3, 0.1);
        }
    },

    scheduleTensionNote: function (beatNumber, time) {
        // Simple Fast Pulse (Kick/Bass)
        if (beatNumber % 4 === 0) {
            this.playDrum(100, 0.1, time, 0.4);
        }

        // Driving Hi-hats (Every 8th note)
        if (beatNumber % 2 === 0) {
            this.playHiHat(time, 0.1);
        }

        // Alarm/Siren Lead (Square wave, simple pattern)
        // Alternating high notes for urgency
        if (beatNumber % 8 === 0) {
            this.playTone(880, 'square', 0.1, 0.1); // A5
        } else if (beatNumber % 8 === 4) {
            this.playTone(587.33, 'square', 0.1, 0.1); // D5
        }
    },

    playDrum: function (freq, duration, time, vol = 0.5) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + duration);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
    },

    playSnare: function (time, vol = 0.2) {
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(time);
    },

    playHiHat: function (time, vol = 0.1) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 10000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(time);
    },

    playSynth: function (freq, time, type = 'triangle', vol = 0.1, attack = 0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(vol, time + attack);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 2);
    },

    scheduler: function () {
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
    },

    startMusic: function (mode = 'chill') {
        if (!this.ctx) this.init();

        this.currentMode = mode;
        this.tempo = mode === 'chill' ? 70 : 150; // Faster tempo for tension

        if (!this.isPlayingMusic) {
            this.isPlayingMusic = true;
            this.nextNoteTime = this.ctx.currentTime + 0.1;
            this.scheduler();
        }
    },

    stopMusic: function () {
        this.isPlayingMusic = false;
        window.clearTimeout(this.timerID);
    },

    // --- SFX ---
    playTypeSound: function () {
        if (isCorrupted) {
            this.playTone(100 + Math.random() * 50, 'square', 0.05, 0.1);
        } else {
            this.playTone(800 + Math.random() * 200, 'sine', 0.05, 0.05);
        }
    },

    playGlitchSound: function () {
        this.playNoise(0.5, 0.3);
        this.playTone(50, 'sawtooth', 0.5, 0.2);
        this.playTone(1000, 'sawtooth', 0.1, 0.1);
    },

    playPopupSound: function () {
        this.playTone(150, 'sawtooth', 0.2, 0.2);
        this.playTone(100, 'square', 0.2, 0.2);
    }
};

// Initialize in Cute Mode
function init() {
    document.body.classList.add('cute-mode');
    robotImage.src = 'robot_cute.png';

    // Create Music Toggle Button
    const musicBtn = document.createElement('button');
    musicBtn.innerText = "🎵 TOGGLE MUSIC";
    musicBtn.style.position = "fixed";
    musicBtn.style.bottom = "20px";
    musicBtn.style.right = "20px";
    musicBtn.style.zIndex = "1000";
    musicBtn.style.padding = "10px";
    musicBtn.style.fontFamily = "'Press Start 2P', cursive";
    musicBtn.style.background = "#0f0";
    musicBtn.style.border = "2px solid #fff";
    musicBtn.style.cursor = "pointer";
    document.body.appendChild(musicBtn);

    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering other clicks
        if (!SoundManager.ctx) SoundManager.init();
        if (SoundManager.ctx.state === 'suspended') SoundManager.ctx.resume();

        if (SoundManager.isPlayingMusic) {
            SoundManager.stopMusic();
            musicBtn.style.opacity = "0.5";
        } else {
            SoundManager.startMusic(isCorrupted ? 'tension' : 'chill');
            musicBtn.style.opacity = "1";
        }
    });

    // Overlay logic
    const overlay = document.getElementById('start-overlay');

    const startExperience = () => {
        if (!SoundManager.ctx) {
            SoundManager.init();
        }

        // CRITICAL: Resume context inside user gesture
        if (SoundManager.ctx.state === 'suspended') {
            SoundManager.ctx.resume().then(() => {
                SoundManager.startMusic('chill');
            });
        } else {
            SoundManager.startMusic('chill');
        }

        overlay.classList.add('hidden');
        typeText(cuteText);
    };

    overlay.addEventListener('click', startExperience);

    robotImage.addEventListener('click', triggerCorruption);
}

function typeText(text, callback) {
    typeWriterElement.innerHTML = "";
    let i = 0;
    clearInterval(typingInterval);

    typingInterval = setInterval(() => {
        if (i < text.length) {
            typeWriterElement.innerHTML += text.charAt(i);
            SoundManager.playTypeSound();
            i++;
        } else {
            clearInterval(typingInterval);
            if (callback) callback();
        }
    }, 50);
}

function triggerCorruption() {
    if (isCorrupted) return; // Already corrupted
    isCorrupted = true;

    // Stop music for corrupted state
    SoundManager.stopMusic();
    SoundManager.playGlitchSound();

    // Switch styles
    document.body.classList.remove('cute-mode');
    document.body.classList.add('corrupted-mode');

    // Switch image
    robotImage.src = 'robot_skull.png';

    // Glitch effects
    document.body.classList.add('glitch-bg');
    document.querySelector('.container').classList.add('shake');

    // Update title
    const title = document.querySelector('h1');
    title.classList.add('glitch');
    title.setAttribute('data-text', 'FATAL ERROR');
    title.innerText = 'FATAL ERROR';

    // Type scary text then show popup
    typeText(scaryText, () => {
        setTimeout(showVirusPopup, 500);
    });
}

function showVirusPopup() {
    const popup = document.getElementById('virus-popup');
    popup.classList.remove('hidden');
    SoundManager.playPopupSound();
}

// Close button logic (Fake close)
document.querySelector('.close-btn').addEventListener('click', () => {
    spawnPopup();
});

// Fix button logic (Prank)
document.getElementById('fix-btn').addEventListener('click', () => {
    spawnPopup();
    spawnPopup();
});

function spawnPopup() {
    SoundManager.playPopupSound();
    const original = document.getElementById('virus-popup');
    const clone = original.cloneNode(true);
    clone.classList.remove('hidden');

    // Random position
    const x = Math.random() * (window.innerWidth - 400);
    const y = Math.random() * (window.innerHeight - 300);

    clone.style.left = x + 'px';
    clone.style.top = y + 'px';
    clone.style.transform = 'none';

    // Add event listeners to clone
    clone.querySelector('.close-btn').addEventListener('click', () => spawnPopup());
    clone.querySelector('#fix-btn').addEventListener('click', () => {
        spawnPopup();
        spawnPopup();
    });

    document.body.appendChild(clone);
}

// Start
window.onload = init;
