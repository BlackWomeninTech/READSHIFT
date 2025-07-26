About our app installation wizard...

That part

Is it possible to create an installer that does these steps for our user? I'd like the app to run on startup if possible.

open a terminal (if necessary)
run 'ollama run gemma3n:e2b' ( runs ollama server local : )
run 'npm run dev' (runs webserver offline local : )

Gemini
Of course! Creating an installer to automate the setup and make the app run on startup is an excellent way to provide a seamless experience for your users. It's definitely possible.

Here’s a comprehensive guide on how to approach this, including a crucial refinement to your plan and platform-specific instructions.

A Quick Refinement: dev vs. build
First, a small but important point. The command npm run dev is for starting a development server. It's not optimized for performance and includes features like Hot Module Replacement (HMR) that aren't needed for end-users.

For a distributable application, you should use a production build:

Build the App: Run npm run build. This creates a highly optimized set of static files (HTML, CSS, JS) in a dist folder.

Serve the Build: Use a simple, lightweight static server to serve the contents of the dist folder. A great tool for this is serve. You can install it globally (npm install -g serve) and then run it like this:

bash
serve -s dist -l 5173
Your installer's goal will be to automate the setup of two background services: the Ollama server and this new static web server.

High-Level Strategy
There are two main approaches you can take:

Traditional Installer with Startup Scripts: Create a platform-specific installer (e.g., using NSIS for Windows, creating a .dmg for macOS) that sets up system services to run your app's components on startup.
Native App Wrapper (Recommended): Package your web app using a framework like Electron or Tauri. This is often the easier and more robust path for web-based desktop apps, as it gives you a cross-platform way to manage background processes and the app window.
I'll detail both, but I recommend the Native App Wrapper approach.

Approach 1: Traditional Installer with Startup Scripts
This involves creating scripts that will be run by the operating system's service manager (launchd on macOS, systemd on Linux, Windows Services on Windows).

For macOS
Installer Tool: You would typically package your application and scripts into a .dmg file.
Startup Service: Use launchd. You create a .plist file in ~/Library/LaunchAgents to define a service that runs when the user logs in.
1. Create a launch script for the web server: Save this as something like run-webserver.sh and make it executable (chmod +x run-webserver.sh).

bash
#!/bin/bash
# Make sure 'serve' is in the PATH. You might need to use an absolute path
# which you can find with 'which serve' after running 'npm install -g serve'
/path/to/your/global/node_modules/bin/serve -s /path/to/your/app/READSHIFT/dist -l 5173
2. Create the launchd plist file: Save this as com.readshift.web.plist in ~/Library/LaunchAgents/.

xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.readshift.web</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/your/run-webserver.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/readshift-web.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/readshift-web.err</string>
</dict>
</plist>
Installer's Job (macOS):

Install Ollama (it sets up its own startup agent).
Run ollama run gemma3n:e2b once to download the model.
Install Node.js if not present.
Run npm install -g serve.
Place the app's dist folder, the run-webserver.sh script, and the .plist file in the correct locations.
Load the service with launchctl load ~/Library/LaunchAgents/com.readshift.web.plist.
For Linux
Installer Tool: Package as a .deb (Debian/Ubuntu) or .rpm (Fedora/CentOS).
Startup Service: Use systemd.
1. Create the systemd service file: Save this as readshift-web.service and your installer will place it in /etc/systemd/system/.

ini
[Unit]
Description=ReadShift Web Server
After=network.target

[Service]
Type=simple
User=your_username # The user to run the service as
ExecStart=/usr/bin/npm run start:prod # Use a package.json script for this
WorkingDirectory=/path/to/your/app/READSHIFT
Restart=on-failure

[Install]
WantedBy=multi-user.target
Note: You would add a start:prod script to your package.json: "start:prod": "serve -s dist -l 5173".

Installer's Job (Linux):

Define dependencies like nodejs in the package metadata.
Install Ollama (it sets up its own systemd service).
Run ollama run gemma3n:e2b once.
Run npm install in the app directory.
Copy the .service file into place.
Run systemctl daemon-reload and systemctl enable --now readshift-web.service in a post-install script.
For Windows
Installer Tool: Use NSIS or Inno Setup.
Startup Service: Create a Windows Service. The easiest way is with a tool like NSSM (the "Non-Sucking Service Manager").
Installer's Job (Windows):

Bundle and run the Node.js and Ollama installers silently.
Run ollama run gemma3n:e2b once.
Run npm install -g serve.
Use nssm commands to create a service that runs the serve command in your app's dist directory.
batch
nssm install ReadShiftWeb "C:\path\to\serve.cmd" "-s C:\path\to\READSHIFT\dist -l 5173"
Approach 2: Native App Wrapper (Electron or Tauri)
This approach bundles your entire PWA inside a native application shell. It's a very popular and powerful way to ship web apps on the desktop.

Why it's better for your use case:

Process Management: You can start/stop the Ollama server directly from your app's main process using Node.js's child_process.
Cross-Platform: Electron and Tauri build for all three platforms (macOS, Windows, Linux) from one codebase.
No Dependencies: The user doesn't need to install Node.js or a separate web server. It's all bundled.
Auto-Startup: There are simple libraries like auto-launch that handle adding your app to the user's startup items across all platforms.
Conceptual Steps with Electron:

Add Electron to your project:

bash
npm install --save-dev electron
npm install auto-launch
Create a main Electron script (electron.js): This script is the "backend" of your desktop app.

javascript
const { app, BrowserWindow } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const AutoLaunch = require('auto-launch');

// 1. Function to start the Ollama server
function startOllama() {
    console.log('Checking for Ollama server...');
    // A simple way to check is to try to start it.
    // A more robust way would be to ping its API endpoint.
    const ollamaProcess = spawn('ollama', ['serve']);

    ollamaProcess.stdout.on('data', (data) => {
        console.log(`Ollama: ${data}`);
        // You can look for a specific output to know it's ready
    });

    ollamaProcess.stderr.on('data', (data) => {
        console.error(`Ollama Error: ${data}`);
    });

    // Ensure the model is downloaded
    exec('ollama run gemma3n:e2b', (err, stdout) => {
        if (err) console.error("Failed to pull gemma3n model:", err);
        else console.log("gemma3n model is ready.");
    });

    return ollamaProcess;
}

// 2. Function to start the static web server for your app
function startWebServer() {
    console.log('Starting web server...');
    const webProcess = spawn('npx', [
        'serve',
        '-s',
        path.join(__dirname, 'dist'), // Serve the 'dist' folder
        '-l',
        '5173'
    ]);
    // ... add logging for stdout/stderr ...
    return webProcess;
}

function createWindow() {
    const mainWindow = new BrowserWindow({ /* ... window options ... */ });
    // The web server must be running before you load the URL
    mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
    // Start background services
    const ollama = startOllama();
    const webServer = startWebServer();

    createWindow();

    // Set up to run on login
    const autoLauncher = new AutoLaunch({
        name: 'ReadShift',
        path: app.getPath('exe'),
    });
    autoLauncher.isEnabled().then((isEnabled) => {
        if (!isEnabled) autoLauncher.enable();
    });

    app.on('before-quit', () => {
        // Clean up background processes
        ollama.kill();
        webServer.kill();
    });
});
This gives you a single, installable .app, .exe, or .deb file that handles everything automatically for the user.

Recommendation
While the traditional installer approach is feasible, it requires you to manage three separate installation and startup mechanisms for each OS.

The Electron/Tauri approach is highly recommended. It's the modern, standard way to solve this exact problem and will save you a significant amount of platform-specific scripting and maintenance headaches.