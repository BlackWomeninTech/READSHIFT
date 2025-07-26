# ReadShift

A dyslexia-friendly learning app for children ages 4-12. ReadShift uses AI-powered visual recognition and text-to-speech to help children learn new words and concepts in an engaging, accessible way.

## Features

- **Local AI-Powered OCR**: Use your camera to capture text from physical books or screens.
- **Copy & Paste**: Analyze text directly from your clipboard.
- **AI-Powered Assistance**: Get definitions and explanations for complex sentences, tailored for learners.
- **Advanced Text-to-Speech**: Listen to any text with high-quality, natural-sounding voices.
- **100% Offline & Private**: Requires a local AI server (Ollama). No data ever leaves your computer.

## Getting Started

This PWA requires a local AI server to be running on your computer.

1. **Install Ollama**: Follow the instructions at [https://ollama.com/](https://ollama.com/) to install Ollama for your operating system.
2. **Download the AI Model**: Open your terminal or command prompt and run the following command:
```bash
ollama run gemma3n:e2b
```

3. **Configure Ollama for Web Access (if needed)**: You may need to configure Ollama to accept requests from the browser. See the Ollama documentation for details on setting `OLLAMA_ORIGINS`.
4. **Launch ReadShift**: Open the ReadShift app in your browser.
5. **Start Analyzing**: Use the camera to point at text or paste it into the text area.

## Parental Controls

Access parental settings with the password: `parent123`

- Adjust volume levels
- Export progress reports
- Manage learning modes
- Reset app data
