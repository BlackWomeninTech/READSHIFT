import ollamaClient from './services/ollama-client.js';
import ttsService from './services/tts-service.js';
import uiService from './services/ui-service.js';

/**
 * This controller orchestrates the main user flow for the ReadShift application,
 * tying together the AI and TTS services.
 */
class MainController {

    /**
     * Executes the full ReadShift sequence.
     * This is the first step: analyze image, speak text, and generate a follow-up question.
     * @param {string} base64ImageData The image data captured from the camera.
     * @returns {Promise<string|null>} The extracted text, or null on failure.
     */
    async startReadShiftFlow(base64ImageData) {
        try {
            uiService.showFeedback("Analyzing the image...");
            const extractedText = await ollamaClient.getTextFromImage(base64ImageData);
            console.log("AI extracted text:", extractedText);

            if (!extractedText || extractedText.trim() === "") {
                uiService.hideFeedback();
                ttsService.speak("I couldn't find any words in that picture. Let's try another one!");
                return null;
            }

            // This function defines what happens *after* the initial text is read aloud.
            return new Promise((resolve) => {
                const onSpeechEnd = async () => {
                    uiService.hideFeedback();
                    resolve(extractedText);
                };

                // Step 1: Read the extracted text aloud. The callback will execute when speech finishes.
                uiService.showFeedback("Reading the text...");
                ttsService.speak(extractedText, onSpeechEnd);
            });

        } catch (error) {
            console.error("An error occurred in the main flow:", error);
            uiService.hideFeedback();
            ttsService.speak("Oh no, something went wrong. Please make sure the AI helper is running and try again.");
            return null;
        }
    }

    /**
     * Initiates the spelling challenge for a given block of text.
     * @param {string} text The text from which to derive the challenge.
     * @returns {Promise<string|null>} The challenge word, or null on failure.
     */
    async startSpellingChallenge(text) {
        uiService.showFeedback("Picking a good word...");
        try {
            const challengeWord = await ollamaClient.getChallengeWord(text);
            if (!challengeWord) {
                throw new Error("AI could not pick a challenge word.");
            }

            const spelling = await ollamaClient.getSpelling(challengeWord);

            const onFirstSpeakEnd = () => {
                ttsService.speak(spelling, onSpellingEnd);
            };
            const onSpellingEnd = () => {
                ttsService.speak(challengeWord, onSecondSpeakEnd);
            };
            const onSecondSpeakEnd = () => {
                ttsService.speak("Now, it's your turn to spell it!");
            };

            // Start the sequence: say, spell, say, prompt.
            uiService.hideFeedback();
            ttsService.speak(`Okay, the word is ${challengeWord}.`, onFirstSpeakEnd);
            return challengeWord;

        } catch (error) {
            console.error("An error occurred during follow-up:", error);
            uiService.hideFeedback();
            ttsService.speak("Oops, I had a little trouble with that request.");
            return null;
        }
    }

    /**
     * Checks a user's spelling attempt against the correct word.
     * @param {string} challengeWord The correct word.
     * @param {string} userSpelling The user's spoken attempt.
     * @returns {Promise<boolean>} True if the spelling is correct.
     */
    async checkUserSpelling(challengeWord, userSpelling) {
        uiService.showFeedback(`Let me check that...`);
        try {
            const isCorrect = await ollamaClient.checkSpelling(challengeWord, userSpelling);
            uiService.hideFeedback();
            return isCorrect;
        } catch (error) {
            console.error("An error occurred during spelling check:", error);
            uiService.hideFeedback();
            ttsService.speak("I had a little trouble checking that. Let's try again later.");
            return false;
        }
    }
}

export default new MainController();