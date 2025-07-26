// c:\Users\nvyma\_Technikole\__dev\BWIT\July\READSHIFT\src\services\piper-worker.js
// This worker runs Piper TTS synthesis in the background.
// It requires the Piper-WASM files (e.g., piper.js, piper.wasm, piper.data)

let piper;
let voice;

self.onmessage = async (event) => {
    const { type, payload } = event.data;

    try {
        switch (type) {
            case 'init':
                // Dynamically import the piper script.
                // The path is relative to the worker's location.
                importScripts(payload.piperJsUrl);

                // Initialize the Piper module
                piper = await Piper({
                    locateFile: (path, prefix) => `${payload.piperBaseUrl}/${path}`,
                });
                self.postMessage({ type: 'init-complete' });
                break;

            case 'load-voice':
                const [configResponse, modelResponse] = await Promise.all([
                    fetch(payload.configUrl),
                    fetch(payload.modelUrl)
                ]);

                if (!configResponse.ok || !modelResponse.ok) {
                    throw new Error('Failed to fetch voice files.');
                }

                const [config, model] = await Promise.all([
                    configResponse.json(),
                    modelResponse.arrayBuffer()
                ]);

                voice = piper.loadVoice(config, model);
                self.postMessage({ type: 'load-voice-complete' });
                break;

            case 'synthesize':
                if (!voice) {
                    throw new Error('Voice not loaded yet.');
                }
                const audioSamples = voice.synthesize(payload.text);
                self.postMessage({ type: 'synthesis-complete', payload: { audio: audioSamples, id: payload.id } });
                break;

            default:
                console.warn('Unknown message type in piper-worker:', type);
        }
    } catch (error) {
        self.postMessage({ type: 'error', payload: { message: error.message, stack: error.stack } });
    }
};