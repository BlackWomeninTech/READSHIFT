// server.js
// receive text from our app, run the Piper command to turn that text into a .wav file, and send the audio back.

const express = require('express');
const cors = require('cors');
// const { exec } = require('child_process'); // To run shell commands
const { exec, spawn } = require('child_process'); // spawn vs exec method
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3016; // The port our server will run on

app.use(cors());
app.use(express.json());

// Using spawn to render Amy
// server.js

app.post('/synthesize', (req, res) => {
    const { text, voice } = req.body;

    if (!text || !voice) {
        return res.status(400).send('Missing text or voice parameter.');
    }

    const piperExecutablePath = path.join(__dirname, 'voices', 'piper.exe');
    const voicesDirectory = path.join(__dirname, 'voices');
    const voiceModelPath = path.join(voicesDirectory, voice);
    const espeakDataPath = path.join(__dirname, 'voices', 'espeak-ng-data');
    const outputPath = path.join(__dirname, `output_${Date.now()}.wav`);

    // --- Using spawn for robust execution ---
    const piperArgs = [
        '--model', voiceModelPath,
        '--espeak_data', espeakDataPath,
        '--output_file', outputPath
    ];

    console.log(`Spawning Piper process...`);
    const piperProcess = spawn(piperExecutablePath, piperArgs);

    // Write the text to Piper's standard input
    piperProcess.stdin.write(text);
    piperProcess.stdin.end(); // Signal that we are done sending text

    // Log any output or errors from Piper
    piperProcess.stderr.on('data', (data) => {
        console.error(`Piper stderr: ${data}`);
    });

    // When the Piper process closes, the file is ready
    piperProcess.on('close', (code) => {
        console.log(`Piper process exited with code ${code}`);
        if (code !== 0) {
            return res.status(500).send('Piper process failed.');
        }

        // Send the finished file
        res.sendFile(outputPath, (err) => {
            if (err) {
                console.error(`sendFile error: ${err}`);
            }
            // You can re-enable this later if you want to clean up the files
            // fs.unlinkSync(outputPath);
        });
    });
});

// Create an endpoint to handle the text-to-speech request
// server.js

// Testing 
// server.js

// app.post('/synthesize', (req, res) => {
//     const { text, voice } = req.body;

//     if (!text || !voice) {
//         return res.status(400).send('Missing text or voice parameter.');
//     }

//     const piperExecutablePath = path.join(__dirname, 'voices', 'piper.exe');
//     const voicesDirectory = path.join(__dirname, 'voices');
//     const voiceModelPath = path.join(voicesDirectory, voice);
//     const espeakDataPath = path.join(__dirname, 'voices', 'espeak-ng-data');
//     const outputPath = path.join(__dirname, `output_${Date.now()}.wav`);

//     // We are reverting to the 'echo' command and removing '--data_path'
//     const command = `echo "${text}" | "${piperExecutablePath}" --model "${voiceModelPath}" --espeak_data "${espeakDataPath}" --output_file "${outputPath}"`;

//     console.log(`Executing final test command...`);

//     exec(command, (error, stdout, stderr) => {
//         if (stderr) {
//             console.error(`Piper stderr: ${stderr}`);
//         }
//         if (error) {
//             console.error(`exec error: ${error.message}`);
//             return res.status(500).send('Failed to synthesize audio.');
//         }
//         if (!fs.existsSync(outputPath)) {
//             console.error('Output file was not created by Piper.');
//             return res.status(500).send('Failed to synthesize audio.');
//         }

//         res.sendFile(outputPath, (err) => {
//             if (err) {
//                 console.error(`sendFile error: ${err}`);
//             }
//             // Temporarily disabled for testing
//             // fs.unlinkSync(outputPath);
//         });
//     });
// });
app.listen(port, () => {
    console.log(`🔊 Piper TTS server running at http://localhost:${port}`);
});