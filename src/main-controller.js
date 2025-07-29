// src/main-controller.js
import ollamaClient from './services/ollama-client.js';
import uiService from './services/ui-service.js';
import ttsService from './services/tts-service.js';

class MainController {
    /**
     * Handles the entire flow of reading text from an image.
     * @param {string} base64ImageData The image data.
     * @returns {Promise<string|null>} The extracted text, or null if none is found.
     */
    async startReadShiftFlow(base64ImageData) {
        uiService.showFeedback('Reading text from image...');
        try {
            const text = await ollamaClient.getTextFromImage(base64ImageData);
            if (text) {
                ttsService.speak(`I see the words: ${text}`);
            }
            return text;
        } finally {
            uiService.hideFeedback();
        }
    }


    async function handleUserPrompt(userText) {
    try {
        const response = await ollamaClient.getChallengeWord(userText);
        console.log("Gemma3n says:", response);
        // Do something with the response
    } catch (err) {
        console.error("Ollama failed:", err.message);
    }
    }


    /**
     * Initiates a spelling challenge for a word from the provided text.
     * @param {string} fullText The text to choose a word from.
     * @returns {Promise<string|null>} The chosen challenge word.
     */
    async startSpellingChallenge(fullText) {
        uiService.showFeedback('Choosing a word...');
        try {
            const word = await ollamaClient.getChallengeWord(fullText);
            if (word) {
                const spelling = await ollamaClient.getSpelling(word);
                ttsService.speak(`Okay, the word is ${word}. Please spell it for me.`);
                // The custom ttsService will queue this to play after the prompt.
                ttsService.speak(spelling);
            }
            return word;
        } finally {
            uiService.hideFeedback();
        }
    }

    /**
     * Checks the user's spelling attempt against the correct word.
     * @param {string} challengeWord The correct word.
     * @param {string} userSpelling The user's spoken spelling.
     * @returns {Promise<boolean>} True if the spelling is correct.
     */
    async checkUserSpelling(challengeWord, userSpelling) {
        return await ollamaClient.checkSpelling(challengeWord, userSpelling);
    }
}

export default new MainController();