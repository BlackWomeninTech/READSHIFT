/**
 * A service to control UI feedback elements like overlays and status messages.
 * This class expects to find '#feedback-overlay' and '#feedback-text' in the DOM.
 */
class UiService {
    constructor() {
        this.overlay = document.getElementById('feedback-overlay');
        this.feedbackText = document.getElementById('feedback-text');

        if (!this.overlay || !this.feedbackText) {
            console.warn("UI feedback elements not found. The UI service may not work as expected.");
        }
    }

    /**
     * Shows the feedback overlay with a specific message.
     * @param {string} message The message to display to the user.
     */
    showFeedback(message) {
        if (this.overlay && this.feedbackText) {
            this.feedbackText.textContent = message;
            this.overlay.style.display = 'flex';
        }
    }

    /**
     * Hides the feedback overlay.
     */
    hideFeedback() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
}

export default new UiService();