// src/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("The app has loaded and is ready to roll!");

    // --- DOM Elements ---
    const textInput = document.getElementById('text-input');
    const readAloudBtn = document.getElementById('read-aloud-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const defineBtn = document.getElementById('define-btn');
    const spellBtn = document.getElementById('spell-btn');
    const resetBtn = document.getElementById('reset-btn');
    const scanSection = document.getElementById('scan-section');
    const interactionSection = document.getElementById('interaction-section');
    const statusDisplay = document.getElementById('status-display').querySelector('p');
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}]/gu;

    // --- App State ---
    let currentText = '';
    let spellingChallenges = [];

    // --- Event Listeners ---
 // src/app.js -> in the Event Listeners section
readAloudBtn.addEventListener('click', handleReadAloud);
repeatBtn.addEventListener('click', handleRepeat); // Updated
defineBtn.addEventListener('click', handleDefine);
spellBtn.addEventListener('click', handleSpell);
resetBtn.addEventListener('click', handleReset);

    // --- Initial Health Check ---
    checkBackendStatus();

    // ===============================================
    //               CORE LOGIC FUNCTIONS
    // ===============================================


    async function handleReadAloud() {
    const inputText = textInput.value.trim();
    if (!inputText) {
        alert("Please enter some text first!");
        return;
    }

    // --- STEP 1: PROVIDE IMMEDIATE FEEDBACK ---
    // Disable the button and update the status the moment the user clicks.
    readAloudBtn.disabled = true;
    updateStatus("Nyla is reading your text...");

    // --- STEP 2: CALL THE AI ---
    // Now, wait for Nyla to process the text.
    const nylaResponse = await getNylaResponse(`Please read the following text aloud: "${inputText}"`);

    if (nylaResponse) {
        currentText = nylaResponse;

        // --- STEP 3: PLAY THE AUDIO ---
        // Wait for Piper to finish speaking.
        await speakWithPiper(currentText);

        // --- STEP 4: UPDATE THE UI ---
        // Now that the main task is done, switch screens.
        scanSection.classList.add('hidden');
        interactionSection.classList.remove('hidden');
        updateStatus("What would you like to do next?");

        // --- STEP 5: GET CHALLENGES ---
        // Finally, get the tricky words.
        await getSpellingChallenges(currentText);

    } else {
        // If Nyla fails for any reason, re-enable the button so the user can try again.
        readAloudBtn.disabled = false;
        updateStatus("Nyla couldn't read that. Please try again.", true);
    }
}
    // Option 2 Revamp Read Aloud (2)
    async function handleReadAloud() {
    let inputText = textInput.value.trim();
    if (!inputText) {
        alert("Please enter some text first!");
        return;
    }

    updateStatus("Asking Nyla to read...");
    const nylaResponse = await getNylaResponse(`Please read the following text aloud: "${inputText}"`);

    if (nylaResponse) {
        currentText = nylaResponse;
        
        // --- NEW ORDER OF OPERATIONS ---

        // 1. Start the audio playback, but don't wait for it to finish yet.
        const speakPromise = speakWithPiper(currentText, "Reading aloud...");

        // 2. Immediately switch the user interface to the next screen.
        updateStatus("What would you like to do next?");
        scanSection.classList.add('hidden');
        interactionSection.classList.remove('hidden');

        // 3. In the background, ask Nyla to find the tricky words.
        getSpellingChallenges(currentText);

        // 4. Now, wait for the speech to complete before finishing the function.
        await speakPromise;
    }
}
    // async function handleReadAloud() {
    //     let inputText = textInput.value.trim();
    //     if (!inputText) {
    //         alert("Please enter some text first!");
    //         return;
    //     }
    //     updateStatus("Asking Nyla to read...");
    //     const nylaResponse = await getNylaResponse(`Please read the following text aloud: "${inputText}"`);
    //     if (nylaResponse) {
    //         currentText = nylaResponse;
    //         updateStatus("Reading aloud...");
    //         await speakWithPiper(currentText);
    //         updateStatus("What would you like to do next?");
    //         scanSection.classList.add('hidden');
    //         interactionSection.classList.remove('hidden');
    //         await getSpellingChallenges(currentText);
    //     }
    // }

    // Repeat with Nyla
    function handleRepeat() {
    speakWithPiper(currentText, "Reading it again...");
}

// Tricky Words with Nyla (Definitions)
async function handleDefine() {
    if (spellingChallenges.length === 0) {
        await speakWithPiper("I couldn't find any tricky words this time!");
        return;
    }
    const wordToDefine = spellingChallenges[0];
    updateStatus(`Asking Nyla to define "${wordToDefine}"...`);

    const definitionPrompt = `Please define the word "${wordToDefine}" in one simple sentence for a child.`;
    const nylaResponse = await getNylaResponse(definitionPrompt);

    if (nylaResponse) {
        // Use the regex to create a clean, speech-only version of the text
        const speechText = nylaResponse.replace(emojiRegex, '');
        await speakWithPiper(speechText);
    }
    updateStatus("What would you like to do next?");
}
// Spell with Nyla
async function handleSpell() {
    if (spellingChallenges.length === 0) {
        await speakWithPiper("No tricky words to spell this time!");
        return;
    }
    const wordToSpell = spellingChallenges[0];
    updateStatus(`Asking Nyla to spell "${wordToSpell}"...`);
    
    const spellingPrompt = `Please spell the word "${wordToSpell}".`;
    const nylaResponse = await getNylaResponse(spellingPrompt);

    if (nylaResponse) {
        await speakWithPiper(nylaResponse);
    }
    updateStatus("What would you like to do next?");
}

    function handleReset() {
        textInput.value = '';
        interactionSection.classList.add('hidden');
        scanSection.classList.remove('hidden');
        updateStatus("Ready to read!");
          readAloudBtn.disabled = false;
    }

    // ===============================================
    //               API HELPER FUNCTIONS
    // ===============================================

    function updateStatus(message, isError = false) {
        if (statusDisplay) {
            statusDisplay.textContent = message;
            statusDisplay.parentElement.classList.toggle('bg-red-100', isError);
            statusDisplay.parentElement.classList.toggle('text-red-700', isError);
        }
    }

    async function speakWithPiper(textToSpeak, statusUpdate = "...") {
        console.log(`Requesting Piper TTS to say: "${textToSpeak}"`);
        updateStatus(statusUpdate);
        const selectedVoice = 'en_US-amy-medium.onnx';
        try {
            const response = await fetch('http://127.0.0.1:3016/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToSpeak, voice: selectedVoice }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            await audio.play();
            return new Promise(resolve => { audio.onended = resolve; });
        } catch (error) {
            console.error('Error with Piper TTS request:', error);
            updateStatus("Could not play audio. Is the Piper server running?", true);
        }
    }

    async function getNylaResponse(userPrompt) {
        const ollamaEndpoint = 'http://127.0.0.1:11434/api/generate';
        try {
            const response = await fetch(ollamaEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "nyla:latest",
                    prompt: userPrompt,
                    stream: false,
                })
            });
            if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
            const data = await response.json();
            console.log("Nyla's Response:", data);
            return data.response.trim();
        } catch (error) {
            console.error("Error contacting Nyla (Ollama):", error);
            updateStatus("I couldn't connect to Nyla. Is Ollama running?", true);
            return null;
        }
    }

    // async function getSpellingChallenges(text) {
    //     // This is still a MOCK function. We will replace this later.
    //     console.log("Identifying spelling challenges (mock)...");
    //     spellingChallenges = text.split(/\s+/).filter(w => w.length > 7).map(w => w.replace(/[^a-zA-Z]/g, ''));
    //     return spellingChallenges;
    // }

    // src/app.js

async function getSpellingChallenges(text) {
    console.log("Asking Nyla to identify spelling challenges...");
    
    // This prompt asks Nyla to act like an expert and return a clean JSON array
    const prompt = `From the following text, identify up to three words that would be challenging for a 7-year-old. Respond ONLY with a JSON array of the words as strings. For example: ["challenge", "enormous"]. Text: "${text}"`;

    const nylaResponse = await getNylaResponse(prompt);

    if (nylaResponse) {
        try {
            // Attempt to parse the JSON array from Nyla's response
            const words = JSON.parse(nylaResponse);
            spellingChallenges = words;
            console.log('Gemma identified:', spellingChallenges);
            return spellingChallenges;
        } catch (e) {
            console.error("Could not parse JSON array from Nyla's response:", nylaResponse);
            spellingChallenges = []; // Reset to empty if parsing fails
            return spellingChallenges;
        }
    }
    // Default to empty array if Nyla gives no response
    spellingChallenges = [];
    return spellingChallenges;
}
    // ===============================================
    //               HEALTH CHECK FUNCTIONS
    // ===============================================

    async function checkBackendStatus() {
        const mainButton = document.getElementById('read-aloud-btn');
        if (!mainButton) return; // Exit if button isn't found
        
        mainButton.disabled = true;
        mainButton.textContent = 'Loading Services...';
        
        const ollamaReady = await isServiceReady('http://127.0.0.1:11434', 'Ollama');
        const piperReady = await isServiceReady('http://127.0.0.1:3016', 'Piper TTS');

        if (ollamaReady && piperReady) {
            console.log("All services are ready!");
            mainButton.disabled = false;
            mainButton.textContent = 'Read Aloud';
        } else {
            console.log("Services not ready, will check again...");
            setTimeout(checkBackendStatus, 3000);
        }
    }

    async function isServiceReady(url, serviceName) {
        try {
            await fetch(url, { mode: 'no-cors' });
            console.log(`${serviceName} is responsive.`);
            return true;
        } catch (e) {
            console.log(`Waiting for ${serviceName}...`);
            return false;
        }
    }
});