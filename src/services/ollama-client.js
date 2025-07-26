// The Ollama server URL. This assumes Ollama is running on the default port.
const OLLAMA_URL = 'http://localhost:11434/api/chat';
// The name of the Gemma model you are using in Ollama.
// You can see your installed models by running `ollama list` in your terminal.
const OLLAMA_MODEL = 'gemma3n:latest'; // Using the explicit tag for clarity.

/**
 * A helper class to interact with a local Ollama server from the browser.
 * This handles sending prompts and image data to the Gemma model.
 */
class OllamaClient {

    /**
     * A generic method to send a request to the Ollama chat API.
     * @param {object} payload The data to send to the API.
     * @returns {Promise<string>} The content of the model's response.
     */
    async _sendRequest(payload) {
        try {
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    stream: false, // We want the full response at once
                    ...payload,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Ollama API Error Body:", errorBody);
                throw new Error(`Ollama API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.message.content;
        } catch (error) {
            console.error("Error communicating with Ollama:", error);
            // This error is critical for the user to see, as it likely means Ollama isn't running.
            throw new Error("Could not connect to the local AI model. Please ensure Ollama is running on your computer.");
        }
    }

    /**
     * Reads text directly from an image using Gemma's vision capabilities via Ollama.
     * @param {string} base64ImageData The image data encoded as a Base64 string, without the data URI prefix.
     * @returns {Promise<string>} The text extracted from the image.
     */
    // OCR TASK EXPERT DEFINITION
    async getTextFromImage(base64ImageData) {
        const payload = {
            messages: [
                {
                    role: 'user',
                    content: 'You are an expert OCR engine. Extract the text from this image. Only return the text you see.',
                    images: [base64ImageData],
                },
            ],
        };
        return this._sendRequest(payload);
    }

    /**
     * Analyzes a block of text and selects a single, appropriately challenging word for a spelling quiz.
     * @param {string} text The text to analyze.
     * @returns {Promise<string>} The chosen challenge word.
     */
    async getChallengeWord(text) {
        const prompt = `From the following text, select the single best word for a spelling challenge for a 7-year-old with dyslexia. Choose a word that is interesting but not overly simple.

Text: "${text}"

Return only the single word you have chosen, and nothing else.`;

        const payload = {
            messages: [{ role: 'user', content: prompt }],
        };
        const word = await this._sendRequest(payload);
        // Clean up potential quotes or punctuation from the AI's response
        return word.trim().replace(/[".,]/g, '');
    }

    /**
     * Generates a spelling breakdown of a word.
     * @param {string} term The word to spell.
     * @returns {Promise<string>} The spelled-out word (e.g., "C... A... T...").
     */
    async getSpelling(term) {
        const prompt = `Spell out the word "${term}" for a child, with pauses between letters. For example, for "cat" you would return "C... A... T...". Only return the spelling.`;
        const payload = {
            messages: [{ role: 'user', content: prompt }],
        };
        return this._sendRequest(payload);
    }

    /**
     * Checks if a user's spoken spelling matches the challenge word.
     * @param {string} challengeWord The correct word.
     * @param {string} userSpelling The spelling attempt from the user.
     * @returns {Promise<boolean>} True if the spelling is correct, false otherwise.
     */
    async checkSpelling(challengeWord, userSpelling) {
        const prompt = `The challenge word was "${challengeWord}". A child spelled it out loud as: "${userSpelling}". 
Is the child's spelling correct? Consider common phonetic pronunciations for letters (e.g., "see" for "c", "ay" for "a").
Respond with only the word "yes" or "no".`;

        const payload = {
            messages: [{ role: 'user', content: prompt }],
        };
        const response = await this._sendRequest(payload);
        return response.toLowerCase().includes('yes');
    }
}

export default new OllamaClient();