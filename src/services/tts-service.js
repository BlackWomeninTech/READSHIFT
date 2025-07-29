// c:\Users\nvyma\_Technikole\__dev\BWIT\July\READSHIFT\src\services\tts-service.js

class PiperTTS {
    constructor() {
        this.audioContext = null;
        this.worker = null;
        this.isInitialized = false;
        this.isVoiceLoaded = false;
        this.audioQueue = [];
        this.isPlaying = false;
        this.synthesisCallbacks = new Map();
        this.nextSynthesisId = 0;
        this.gainNode = null;
        this.volume = 0.8; // Default volume
    }

    async initialize(config = {}) {
        if (this.isInitialized) return;

        const piperBaseUrl = config.piperBaseUrl || '/vendor/piper';
        const piperJsUrl = `${piperBaseUrl}/piper.js`;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        this.gainNode.connect(this.audioContext.destination);

        this.worker = new Worker(new URL('./piper-worker.js', import.meta.url), { type: 'module' });

        return new Promise((resolve, reject) => {
            this.worker.onmessage = (event) => {
                const { type, payload } = event.data;
                switch (type) {
                    case 'init-complete':
                        this.isInitialized = true;
                        console.log('Piper TTS worker initialized.');
                        resolve();
                        break;
                    case 'load-voice-complete':
                        this.isVoiceLoaded = true;
                        console.log('Piper TTS voice loaded.');
                        // Resolve the promise from loadVoice
                        this.synthesisCallbacks.get('load-voice').resolve();
                        this.synthesisCallbacks.delete('load-voice');
                        break;
                    case 'synthesis-complete':
                        const { audio, id } = payload;
                        const callback = this.synthesisCallbacks.get(id);
                        if (callback) {
                            callback(audio);
                            this.synthesisCallbacks.delete(id);
                        }
                        break;
                    case 'error':
                        console.error('Piper TTS worker error:', payload);
                        // Reject any pending promises
                        this.synthesisCallbacks.forEach((cb) => {
                            if (cb.reject) cb.reject(new Error(payload.message));
                        });
                        this.synthesisCallbacks.clear();
                        reject(new Error(payload.message));
                        break;
                }
            };

            this.worker.postMessage({ type: 'init', payload: { piperBaseUrl, piperJsUrl } });
        });
    }

    async loadVoice(configUrl, modelUrl) {
        if (!this.isInitialized) {
            throw new Error('TTS service not initialized. Call initialize() first.');
        }
        this.isVoiceLoaded = false;
        return new Promise((resolve, reject) => {
            this.synthesisCallbacks.set('load-voice', { resolve, reject });
            this.worker.postMessage({ type: 'load-voice', payload: { configUrl, modelUrl } });
        });
    }

    speak(text) {
        if (!this.isInitialized || !this.isVoiceLoaded) {
            console.warn('TTS not ready, dropping speech request:', text);
            return;
        }

        const id = this.nextSynthesisId++;
        const synthesisPromise = new Promise((resolve) => {
            this.synthesisCallbacks.set(id, resolve);
            this.worker.postMessage({ type: 'synthesize', payload: { text, id } });
        });

        this.audioQueue.push(synthesisPromise);
        if (!this.isPlaying) {
            this.playNextInQueue();
        }
    }

    async playNextInQueue() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const audioSamples = await this.audioQueue.shift();

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const audioBuffer = this.audioContext.createBuffer(1, audioSamples.length, 22050); // 22050 is piper's sample rate
        audioBuffer.getChannelData(0).set(audioSamples);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.gainNode);
        source.onended = () => this.playNextInQueue();
        source.start(0);
    }
}

export default new PiperTTS();