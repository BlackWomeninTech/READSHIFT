Installation Instructions: [CREATE A WIZARD]

Step 1: Set up the Local AI (Ollama) ( one time function )
The application's core functionality relies on a locally running AI model.

Install Ollama: If you haven't already, follow the instructions at https://ollama.com/ to install it on your computer.

Download the AI Model: Open your terminal or command prompt and run the following command. This will download and run the specific model the application needs.

bash
ollama run gemma3n:e2b
Keep Ollama Running: The Ollama application must be running in the background for ReadShift to work.

(If Needed) Configure Web Access: The README.md mentions that you might need to configure Ollama to accept requests from the browser. This is a security feature of Ollama. If the app can't connect, you'll need to set an environment variable. For a local development setup like this, you can typically set it to allow all origins:

macOS/Linux: export OLLAMA_ORIGINS='*'
Windows (Command Prompt): set OLLAMA_ORIGINS=*
Windows (PowerShell): $env:OLLAMA_ORIGINS='*'
You will need to restart the Ollama server after setting this variable.

Step 2: Run the ReadShift Web Application
The project uses Vite (I can tell from the files in node_modules), which includes a development server. This is the "server for the website" you mentioned.

Open a New Terminal: In a separate terminal window from Ollama, navigate to the root directory of the READSHIFT project.

Install Dependencies: If this is your first time setting up the project, you need to install the required packages listed in package.json.

bash
npm install
Start the Development Server: The standard way to start a Vite project is with the dev script, which is defined in the package.json file.

bash
npm run dev
Access the App: The terminal will show you a local URL, usually something like http://localhost:5173. Open this URL in your web browser.

That's it! You should now have the Ollama AI server running in one terminal and the Vite development server running in another, allowing you to use the ReadShift application in your browser.





## After the first time these are the manual installation instructions:

- open a terminal (type these in if necessary)
- run   'ollama run gemma3n:e2b' ( runs ollama server local : )
- run 'npm run dev' (runs webserver offline local : )




PIPER
piper-windows.exe --model en_US-amy-low.onnx --config en_US-amy-low.onnx.json --output_file hello.wav --text "Hello! This is Piper speaking."