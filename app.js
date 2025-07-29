// ReadShift - Dyslexia-Friendly Learning PWA
import mainController from './src/main-controller.js';
import ttsService from './src/services/tts-service.js';

class ReadShiftApp {
    constructor() {
        this.currentScreen = 'loading'; // Tracks the visible screen
        this.appState = 'idle';         // Manages interaction state: 'idle', 'listening_for_spelling'
        this.userData = {};
        this.currentTermIndex = 0;
        this.isRecording = false;
        this.recognition = null;
        this.camera = null;
        this.activeText = null;     // To store the full text from the last scan
        this.challengeWord = null;  // To store the current word for the spelling challenge
        
        // Initialize app
        this.init();
    }

    async init() {
        // Load user data
        this.loadUserData();
        
        // Setup service worker
        this.registerServiceWorker();
        
        // Setup speech recognition
        this.setupSpeechRecognition();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load learning data
        await this.loadLearningData();
        
        // Initialize TTS Service
        await this.initializeTts();

        // Show appropriate screen
        setTimeout(() => {
            this.hideScreen('loading-screen');
            if (this.userData.isRegistered) {
                this.showScreen('home-screen');
                ttsService.speak(`Welcome back ${this.userData.childName}! Ready to learn something amazing?`);
                document.getElementById('child-name-display').textContent = this.userData.childName;
            } else {
                this.showScreen('registration-screen');
            }
        }, 2000);
    }

    // TTS Initialization
    async initializeTts() {
        try {
            console.log('Initializing TTS Service...');
            // This assumes your piper-wasm files are in /public/vendor/piper/
            // If they are elsewhere, you can pass the path in the config:
            // await ttsService.initialize({ piperBaseUrl: '/path/to/piper' });
            await ttsService.initialize();
            console.log('TTS Service initialized. Loading Amy voice...');
            
            // The voice files should be in your public directory, e.g., /public/voices/
            await ttsService.loadVoice(
                '/voices/en_US-amy-medium.onnx.json',
                '/voices/en_US-amy-medium.onnx'
            );
            console.log('TTS Voice "Amy" loaded successfully.');
        } catch (error) {
            console.error('Failed to initialize custom TTS voice:', error);
        }
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Speech Recognition Setup
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                this.handleVoiceCommand(command);
            };

            this.recognition.onerror = (event) => {
                console.log('Speech recognition error:', event.error);
            };

            // Start listening
            setTimeout(() => {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.log('Speech recognition start error:', error);
                }
            }, 3000);
        }
    }

    // Voice Command Handler
    handleVoiceCommand(command) {
        console.log('Voice command:', command);

        // If we are waiting for a spelling, handle that first and ignore other commands.
        if (this.appState === 'listening_for_spelling') {
            this.handleSpellingAttempt(command);
            return;
        }
        
        // Global commands
        if (command.includes('start') && this.currentScreen === 'home-screen') {
            this.startApp();
        } else if (command.includes('help me') && this.currentScreen === 'camera-screen') {
            this.analyzeImage();
        } else if (command.includes('again') && this.currentScreen === 'playback-screen') {
            this.playCurrentTerm();
        } else if (command.includes('next') && this.currentScreen === 'playback-screen') {
            this.showInteraction();
        } else if (command.includes('back')) {
            this.goBack();
        } else if (command.includes('continue') && (this.currentScreen === 'interaction-screen' || this.currentScreen === 'celebration-screen')) {
            this.continue();
        }

        // Spelling challenge commands
        if (this.currentScreen === 'challenge-prompt-screen') {
            if (command.includes('yes')) {
                this.acceptChallenge();
            } else if (command.includes('no')) {
                this.declineChallenge();
            }
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Registration form
        const registrationForm = document.getElementById('registration-form');
        if (registrationForm) {
            registrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistration();
            });
        }

        const demoModeBtn = document.getElementById('demo-mode-btn');
        if (demoModeBtn) {
            demoModeBtn.addEventListener('click', () => {
                this.startDemoMode();
            });
        }

        // Home screen
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.animateButtonPress('start-btn');
                this.startApp();
            });
        }

        const settingsAccess = document.getElementById('settings-access');
        if (settingsAccess) {
            settingsAccess.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Camera screen
        const cameraHelpBtn = document.getElementById('camera-help-btn');
        if (cameraHelpBtn) {
            const analyze = () => {
                this.animateButtonPress('camera-help-btn');
                this.analyzeImage();
            };
            cameraHelpBtn.addEventListener('click', analyze);
            cameraHelpBtn.addEventListener('touchstart', e => {
                e.preventDefault(); // prevent click from firing as well
                analyze();
            });
        }

        const cameraBackBtn = document.getElementById('camera-back-btn');
        if (cameraBackBtn) {
            cameraBackBtn.addEventListener('click', () => {
                this.animateButtonPress('camera-back-btn');
                this.goBack();
            });
        }

        // Playback screen
        const playAgainBtn = document.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.animateButtonPress('play-again-btn');
                this.playCurrentTerm();
            });
        }

        const nextWordBtn = document.getElementById('next-word-btn');
        if (nextWordBtn) {
            nextWordBtn.addEventListener('click', () => {
                this.animateButtonPress('next-word-btn');
                this.showInteraction();
            });
        }

        const playbackBackBtn = document.getElementById('playback-back-btn');
        if (playbackBackBtn) {
            playbackBackBtn.addEventListener('click', () => {
                this.animateButtonPress('playback-back-btn');
                this.goBack();
            });
        }

        // Interaction screen
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('mousedown', () => {
                this.startRecording();
            });

            recordBtn.addEventListener('mouseup', () => {
                this.stopRecording();
            });

            recordBtn.addEventListener('touchstart', () => {
                this.startRecording();
            });

            recordBtn.addEventListener('touchend', () => {
                this.stopRecording();
            });
        }

        const playbackRecordingBtn = document.getElementById('playback-recording-btn');
        if (playbackRecordingBtn) {
            playbackRecordingBtn.addEventListener('click', () => {
                this.playRecording();
            });
        }

        const interactionContinueBtn = document.getElementById('interaction-continue-btn');
        if (interactionContinueBtn) {
            interactionContinueBtn.addEventListener('click', () => {
                this.animateButtonPress('interaction-continue-btn');
                this.showCelebration();
            });
        }

        // Celebration screen
        const celebrationContinueBtn = document.getElementById('celebration-continue-btn');
        if (celebrationContinueBtn) {
            celebrationContinueBtn.addEventListener('click', () => {
                this.animateButtonPress('celebration-continue-btn');
                this.continue();
            });
        }

        const celebrationHomeBtn = document.getElementById('celebration-home-btn');
        if (celebrationHomeBtn) {
            celebrationHomeBtn.addEventListener('click', () => {
                this.animateButtonPress('celebration-home-btn');
                this.goHome();
            });
        }

        // Settings screen
        const settingsBackBtn = document.getElementById('settings-back-btn');
        if (settingsBackBtn) {
            settingsBackBtn.addEventListener('click', () => {
                this.goBack();
            });
        }

        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const newVolume = e.target.value / 100;
                ttsService.setVolume(newVolume);
            });
        }

        const exportProgressBtn = document.getElementById('export-progress-btn');
        if (exportProgressBtn) {
            exportProgressBtn.addEventListener('click', () => {
                this.exportProgress();
            });
        }

        const resetAppBtn = document.getElementById('reset-app-btn');
        if (resetAppBtn) {
            resetAppBtn.addEventListener('click', () => {
                this.resetApp();
            });
        }

        // Challenge prompt screen
        const challengeActions = document.getElementById('challenge-actions');
        if (challengeActions) {
            challengeActions.addEventListener('click', (e) => {
                if (e.target.classList.contains('challenge-btn')) {
                    const action = e.target.dataset.action;
                    if (action === 'accept') this.acceptChallenge();
                    if (action === 'decline') this.declineChallenge();
                }
            });
        }
    }

    // Animation helpers
    animateButtonPress(buttonId) {
        const button = document.getElementById(buttonId);
        button.classList.add('button-press');
        setTimeout(() => button.classList.remove('button-press'), 200);
    }

    showLoadingIndicator(show, text = 'Analyzing...') {
        const overlay = document.getElementById('loading-overlay'); // Assumes an element with this ID exists
        if (overlay) {
            const overlayText = overlay.querySelector('.loading-text'); // Assumes a child with this class
            if (show) {
                if (overlayText) {
                    overlayText.textContent = text;
                }
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }
    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('active');
        targetScreen.classList.add('fade-in');
        
        this.currentScreen = screenId;
    }

    hideScreen(screenId) {
        document.getElementById(screenId).classList.add('hidden');
    }

    // User Data Management
    loadUserData() {
        const saved = localStorage.getItem('readshift-user');
        if (saved) {
            this.userData = JSON.parse(saved);
            const volume = this.userData.volume || 0.8;
            ttsService.setVolume(volume);
            const volumeSlider = document.getElementById('volume-slider');
            if (volumeSlider) {
                volumeSlider.value = volume * 100;
            }
        }
    }

    saveUserData() {
        localStorage.setItem('readshift-user', JSON.stringify(this.userData));
    }

    // Registration
    handleRegistration() {
        const childName = document.getElementById('child-name').value;
        const childAge = document.getElementById('child-age').value;
        const coppaAgreed = document.getElementById('coppa-agreement').checked;

        if (childName && childAge && coppaAgreed) {
            this.userData = {
                childName,
                childAge: parseInt(childAge),
                isRegistered: true,
                registrationDate: new Date().toISOString(),
                progress: {},
                volume: 0.8
            };
            
            this.saveUserData();
            document.getElementById('child-name-display').textContent = childName;
            
            ttsService.speak(`Welcome ${childName}! Let's start your learning adventure!`);
            
            setTimeout(() => {
                this.showScreen('home-screen');
            }, 1000);
        }
    }

    startDemoMode() {
        this.userData = {
            childName: 'Friend',
            childAge: 6,
            isRegistered: false,
            isDemo: true,
            volume: 0.8
        };
        
        document.getElementById('child-name-display').textContent = 'Friend';
        ttsService.speak('Welcome to demo mode! Let\'s explore together!');
        
        setTimeout(() => {
            this.showScreen('home-screen');
        }, 1000);
    }

    // Learning Data
    async loadLearningData() {
        try {
            const response = await fetch('./learning-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.learningData = await response.json();
            console.log('Learning data loaded successfully from JSON file.');
        } catch (error) {
            console.error('Could not load learning data:', error);
            // Fallback to a minimal set of data in case of an error
            this.learningData = [{
                term: "error",
                definition: "Something went wrong loading the learning data. Please check the console for details.",
                visual: "⚠️",
                difficulty: 1
            }];
        }
    }

    // Learning Flow
    startApp() {
        ttsService.speak("Great! Let's find something interesting to learn about. Point your camera at any word and I'll help you!");
        this.setupCamera();
        setTimeout(() => {
            this.showScreen('camera-screen');
        }, 1000);
    }

    async setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            const video = document.getElementById('camera-video');
            video.srcObject = stream;
            this.camera = stream;
            
            video.addEventListener('loadedmetadata', () => {
                video.play();
            });
        } catch (error) {
            console.error('Camera access error:', error);
            ttsService.speak("I can't access the camera right now. Let's try a different way to learn!");
            // Fallback to direct word selection
            this.showRandomTerm();
        }
    }

    async analyzeImage() {
        const videoElement = document.getElementById('camera-video');
        if (!videoElement || !this.camera || videoElement.paused || videoElement.ended || videoElement.videoWidth === 0) {
            console.error("Camera stream is not active or video element not found.");
            ttsService.speak("I can't see anything right now. Please try again.");
            return;
        }

        this.showLoadingIndicator(true, 'Analyzing...');

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error("Could not get canvas context.");
            }
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // The ollama client expects the base64 string without the data URI prefix.
            const base64ImageData = canvas.toDataURL('image/jpeg').split(',')[1];

            // The main controller now handles the entire flow, including UI updates and speech.
            const extractedText = await mainController.startReadShiftFlow(base64ImageData);

            if (extractedText) {
                this.activeText = extractedText;
                this.promptForChallenge();
            } else {
                // Handle case where no text is found
                ttsService.speak("I couldn't find any text in the picture. Let's try again!");
            }
        } catch (error) {
            console.error('Error during image analysis:', error);
            ttsService.speak("Oops! Something went wrong while I was trying to read that. Please try again.");
        } finally {
            this.showLoadingIndicator(false);
        }
    }

    showRandomTerm() {
        const randomTerm = this.learningData[Math.floor(Math.random() * this.learningData.length)];
        this.currentTerm = randomTerm;
        this.showTerm();
    }

    showTerm() {
        if (this.camera) {
            this.camera.getTracks().forEach(track => track.stop());
        }
        
        document.getElementById('current-term').textContent = this.currentTerm.term;
        document.getElementById('term-visual').textContent = this.currentTerm.visual;
        
        this.showScreen('playback-screen');
        
        setTimeout(() => {
            this.playCurrentTerm();
        }, 500);
    }

    playCurrentTerm() {
        const fullText = `The word is ${this.currentTerm.term}. ${this.currentTerm.definition}`;
        ttsService.speak(fullText);
        
        // Update progress
        if (this.userData.progress) {
            this.userData.progress[this.currentTerm.term] = {
                learned: true,
                date: new Date().toISOString()
            };
            this.saveUserData();
        }
    }

    showInteraction() {
        ttsService.speak("Let's learn something new!");
        setTimeout(() => {
            this.showScreen('interaction-screen');
            ttsService.speak(`Can you say the word ${this.currentTerm.term} with me?`);
        }, 1000);
    }

    promptForChallenge() {
        this.showScreen('challenge-prompt-screen');
        ttsService.speak("Would you like to have a spell challenge?");
    }

    async acceptChallenge() {
        this.hideScreen('challenge-prompt-screen');
        const word = await mainController.startSpellingChallenge(this.activeText);
        this.challengeWord = word;

        if (this.challengeWord) {
            console.log(`The current challenge word is: ${this.challengeWord}`);
            // After the TTS prompt finishes, we listen for the spelling.
            this.appState = 'listening_for_spelling';
            // A better UI indicator for listening would be ideal here.
            console.log("State changed: Now listening for spelling of:", this.challengeWord);
        }
    }

    async handleSpellingAttempt(spelling) {
        this.appState = 'idle'; // Reset state immediately to prevent multiple triggers
        
        const isCorrect = await mainController.checkUserSpelling(this.challengeWord, spelling);

        if (this.challengeWord) {
            ttsService.speak(`That's it! You spelled ${this.challengeWord} perfectly!`);
            this.showCelebration();
        } else {
            ttsService.speak(`That was a good try! Let's try that word again.`);
            // Re-initiate the challenge for the same word.
            this.acceptChallenge(); // This will re-read the word and spelling and set the state again.
        }
    }

    declineChallenge() {
        this.hideScreen('challenge-prompt-screen');
        ttsService.speak("Okay, no problem!");
    }

    // Recording functionality
    startRecording() {
        this.isRecording = true;
        document.getElementById('recording-status').classList.remove('hidden');
        document.getElementById('record-btn').textContent = '🔴 RECORDING';
        
        // Simulate recording (in production, use Web Audio API)
        ttsService.speak("Great job trying to say it!");
    }

    stopRecording() {
        this.isRecording = false;
        document.getElementById('recording-status').classList.add('hidden');
        document.getElementById('record-btn').innerHTML = '<span class="mr-3">🎙️</span>RECORD';
        document.getElementById('playback-recording-btn').classList.remove('hidden');
    }

    playRecording() {
        ttsService.speak("That was wonderful! You're doing great!");
    }

    // Celebration
    showCelebration() {
        this.showScreen('celebration-screen');
        ttsService.speak("Awesome! You're getting smarter every day! Give yourself a big high five!");
        
        // Play celebration sound effect (simulate)
        setTimeout(() => {
            this.playSuccessSound();
        }, 1000);
    }

    playSuccessSound() {
        // Simulate success sound with speech
        ttsService.speak("Hooray! Fantastic job!");
    }

    // Navigation
    goBack() {
        switch (this.currentScreen) {
            case 'camera-screen':
                this.goHome();
                break;
            case 'playback-screen':
                this.startApp();
                break;
            case 'interaction-screen':
                this.showScreen('playback-screen');
                break;
            case 'celebration-screen':
                this.goHome();
                break;
            case 'settings-screen':
                this.goHome();
                break;
            default:
                this.goHome();
        }
    }

    continue() {
        this.showRandomTerm();
    }

    goHome() {
        if (this.camera) {
            this.camera.getTracks().forEach(track => track.stop());
        }
        this.showScreen('home-screen');
        ttsService.speak(`Welcome back ${this.userData.childName || 'friend'}! What would you like to learn next?`);
    }

    // Settings
    showSettings() {
        // Simple admin access (in production, use proper authentication)
        const adminCode = prompt("Enter parent access code:");
        if (adminCode === "parent123") {
            this.showScreen('settings-screen');
        }
    }

    exportProgress() {
        const progressData = {
            child: this.userData.childName,
            age: this.userData.childAge,
            progress: this.userData.progress,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(progressData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `readshift-progress-${this.userData.childName}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    resetApp() {
        if (confirm("Are you sure you want to reset all app data? This cannot be undone.")) {
            localStorage.clear();
            location.reload();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.readShiftApp = new ReadShiftApp();
});

// Handle offline/online events
window.addEventListener('online', () => {
    console.log('App is online');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
});