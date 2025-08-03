// src/app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scanBtn = document.getElementById('scan-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const defineBtn = document.getElementById('define-btn');
    const spellBtn = document.getElementById('spell-btn');
    const resetBtn = document.getElementById('reset-btn');

    const scanSection = document.getElementById('scan-section');
    const interactionSection = document.getElementById('interaction-section');
    const statusDisplay = document.getElementById('status-display').querySelector('p');

    // --- App State ---
    let currentText = '';
    let spellingChallenges = [];

    // --- Event Listeners ---
    scanBtn.addEventListener('click', handleScan);
    repeatBtn.addEventListener('click', () => speakWithPiper(currentText, "Reading again..."));
    defineBtn.addEventListener('click', handleDefine);
    spellBtn.addEventListener('click', handleSpell);
    resetBtn.addEventListener('click', handleReset);

    // --- Core Logic ---
//     // Temp Test
//     async function handleScan() { 
//     console.log("Testing TTS with a simple message...");
//     updateStatus("Testing audio...");
//     await speakWithPiper("Hi there. My name is Amy, I'd love to help you learn to read!"); // Test with a simple string
//     updateStatus("Test complete.");
// }
    async function handleScan() {
        // In a real app, this triggers the camera and OCR process.
        updateStatus("Scanning for text...");
        
        // 1. (MOCK) Get text from Gemma3n OCR
        const ocrResult = await ocrWithGemma();
        if (!ocrResult) {
            updateStatus("Couldn't find any text. Try again!", true);
            return;
        }
        currentText = ocrResult;

        // Clean the text of markdown characters and punctuation
        currentText = currentText.replace(/(\*\*|\*|_|~|#)/g, ''); 

        // 2. UI Transition
        scanSection.classList.add('hidden');
        interactionSection.classList.remove('hidden');

        // 3. Initial read-aloud
        await speakWithPiper(currentText, `I see this text: ${currentText}`);

        // 4. (MOCK) Get spelling challenges from Gemma3n
        spellingChallenges = await getSpellingChallenges(currentText);
        console.log('Gemma identified:', spellingChallenges); // For debugging
        
        updateStatus("What would you like to do next?");
    }

    async function handleDefine() {
        if (spellingChallenges.length === 0) {
            await speakWithPiper("I didn't find any tricky words this time!", "No tricky words found.");
            return;
        }

        const definitions = await getDefinitions(spellingChallenges);
        for (const def of definitions) {
            const textToSpeak = `${def.word}. This word means: ${def.definition}`;
            await speakWithPiper(textToSpeak, `Defining "${def.word}"...`);
        }
        updateStatus("All done! What now?");
    }

    async function handleSpell() {
        if (spellingChallenges.length === 0) {
            await speakWithPiper("No tricky words to spell this time!", "No tricky words found.");
            return;
        }

        for (const word of spellingChallenges) {
            const spelling = word.split('').join('. '); // Pauses for TTS
            const textToSpeak = `Let's spell ${word}. ${spelling}.`;
            await speakWithPiper(textToSpeak, `Spelling "${word}"...`);
        }
        updateStatus("All spelled out! What's next?");
    }
    
    function handleReset() {
        scanSection.classList.remove('hidden');
        interactionSection.classList.add('hidden');
        updateStatus("Ready to scan!");
    }
    
    // --- UI & MOCK API Helpers ---
    function updateStatus(message, isError = false) {
        statusDisplay.textContent = message;
        statusDisplay.parentElement.classList.toggle('bg-red-100', isError);
        statusDisplay.classList.toggle('text-red-700', isError);
    }
    
// src/app.js

async function speakWithPiper(textToSpeak, statusUpdate = "...") {
    console.log(`Requesting Piper TTS to say: "${textToSpeak}"`);
    updateStatus(statusUpdate);

    // --- CHOOSE YOUR VOICE HERE ---
    const selectedVoice =  'en_US-amy-medium.onnx'; // The filename of your selected voice

    try {
        const response = await fetch('http://localhost:3016/synthesize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: textToSpeak,
                voice: selectedVoice,
            }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        // Get the audio data as a "blob"
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Play the audio and wait for it to finish
        await audio.play();
        return new Promise(resolve => {
            audio.onended = resolve;
        });

    } catch (error) {
        console.error('Error with Piper TTS request:', error);
        updateStatus("Could not play audio. Is the Piper server running?", true);
    }
}

    // --- Gemma3n Functions ---
// src/app.js

async function ocrWithGemma() {
  // In a real app, this would be the base64 string of the image from the camera.
  // We'll use a placeholder for now, so the request has the right shape.
  const base64ImageData = ""; // This will be empty for our test.

  // The endpoint for your local Ollama server
  const ollamaEndpoint = 'http://localhost:11434/api/generate';

  updateStatus("Asking Gemma to read the text...");

  try {
    const response = await fetch(ollamaEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gemma3n:e4b", // Your specific model (Change Model Name)
        prompt: "Please extract the text from this image.",
        stream: false, // We'll ask for the full response at once for simplicity
        images: [base64ImageData]
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Gemma Response:", data); // Log the full response for debugging

    // The actual text is in the 'response' property of the returned JSON
    return data.response.trim();
    

  } catch (error) {
    console.error("Error contacting Ollama:", error);
    updateStatus("I couldn't connect to Gemma. Is Ollama running?", true);
    return null;
  }
}

    // ===================

    async function getSpellingChallenges(text) {
        // The "API" is a structured prompt to Gemma3n via your local Ollama server.
        await new Promise(resolve => setTimeout(resolve, 1000));
        return text.split(/\s+/).filter(w => w.length > 7).map(w => w.replace(/[^a-zA-Z]/g, ''));
    }

    async function getDefinitions(words) {
        return words.map(word => ({
            word: word,
            definition: `a very simple definition for the word ${word}`
        }));
    }
});