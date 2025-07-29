const textInput = document.getElementById('textInput');
const readBtn = document.getElementById('readBtn');
const loading = document.getElementById('loading');
const wordsSection = document.getElementById('wordsSection');
const wordsContainer = document.getElementById('wordsContainer');
const readAllBtn = document.getElementById('readAllBtn');

const definitions = {
  paragraph: "A section of writing that has one main idea.",
  sentence: "A group of words that makes a complete thought.",
  together: "With each other; in a group.",
  student: "Someone who is learning at a school.",
  identifies: "To find out or show who someone is or what something is.",
};

function speak(text, callback) {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = () => callback && callback();
  window.speechSynthesis.speak(utterance);
}

function findHardWords(text) {
  const words = [...new Set(text.toLowerCase().match(/\b(\w{6,})\b/g) || [])];
  words.sort((a, b) => b.length - a.length);
  const topWords = words.slice(0, 3);

  return topWords.map(word => ({
    word,
    definition: definitions[word] || `This is a special word called "${word}".`
  }));
}

readBtn.addEventListener('click', () => {
  const text = textInput.value.trim();
  if (!text) {
    speak("Please paste some text into the box first.");
    return;
  }

  wordsContainer.innerHTML = '';
  wordsSection.style.display = 'none';
  loading.style.display = 'block';

  speak(text, () => {
    setTimeout(() => {
      const hardWords = findHardWords(text);

      if (hardWords.length > 0) {
        speak("I found some words that might be new. Click a word to learn more!");
        wordsContainer.innerHTML = '';
        hardWords.forEach(({ word, definition }) => {
          const btn = document.createElement('button');
          btn.textContent = word;
          btn.className = 'word-button';
          btn.onclick = () => speak(`${word}. ${definition}`);
          wordsContainer.appendChild(btn);
        });

        wordsSection.style.display = 'block';
        readAllBtn.onclick = () => {
          const allWords = hardWords.map(w => w.word).join(', ');
          speak(`Let's read these words together: ${allWords}`);
        };
      } else {
        speak("No tricky words found.");
      }

      loading.style.display = 'none';
    }, 1000);
  });
});




// import React, { useState, useEffect } from 'react';
// import './readTogether.css';

// // --- Mock AI Service ---
// // In a real application, this would be an API call to a backend service.
// const mockAiService = {
//   findHardWords: async (text) => {
//     // Simple mock: find the longest words. A real AI would be more sophisticated.
//     const words = [...new Set(text.toLowerCase().match(/\b(\w{6,})\b/g) || [])];
//     words.sort((a, b) => b.length - a.length);
//     const hardWords = words.slice(0, 3);

//     // Simulate network delay
//     await new Promise(res => setTimeout(res, 1500));

//     // Mock definitions for a kid-friendly experience
//     const definitions = {
//       paragraph: "A section of writing that has one main idea.",
//       sentence: "A group of words that makes a complete thought.",
//       together: "With each other; in a group.",
//       student: "Someone who is learning at a school.",
//       identifies: "To find out or show who someone is or what something is.",
//     };

//     return hardWords.map(word => ({
//       word,
//       definition: definitions[word] || `This is a special word called "${word}".`
//     }));
//   }
// };
// // --- End Mock AI Service ---

// const ReadShiftPage = () => {
//   const [text, setText] = useState('');
//   const [hardWords, setHardWords] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isReading, setIsReading] = useState(false);

//   // Clean up speech synthesis on component unmount
//   useEffect(() => {
//     return () => {
//       if (window.speechSynthesis.speaking) {
//         window.speechSynthesis.cancel();
//       }
//     };
//   }, []);

//   const speak = (textToSpeak, onEndCallback) => {
//     if (window.speechSynthesis.speaking) {
//       window.speechSynthesis.cancel();
//     }
//     const utterance = new SpeechSynthesisUtterance(textToSpeak);
//     utterance.onstart = () => setIsReading(true);
//     utterance.onend = () => {
//       setIsReading(false);
//       if (onEndCallback) {
//         onEndCallback();
//       }
//     };
//     window.speechSynthesis.speak(utterance);
//   };

//   const handleReadAndAnalyze = () => {
//     if (!text.trim()) {
//       speak("Please paste some text into the box first.");
//       return;
//     }

//     setHardWords([]);
//     setIsLoading(true);

//     speak(text, async () => {
//       try {
//         const words = await mockAiService.findHardWords(text);
//         setHardWords(words);
//         if (words.length > 0) {
//             speak("I found some words that might be new. Click a word to learn more!");
//         }
//       } catch (error) {
//         console.error("AI service error:", error);
//         speak("I had a little trouble finding tricky words. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     });
//   };

//   const handleWordClick = (wordData) => {
//     speak(`${wordData.word}. ${wordData.definition}`);
//   };

//   const readAllHardWords = () => {
//     if (hardWords.length === 0) return;
//     const wordsToRead = hardWords.map(w => w.word).join(', ');
//     speak(`Let's read these words together: ${wordsToRead}`);
//   };

//   return (
//     <div className="read-shift-container" aria-live="polite">
//       <header className="read-shift-header">
//         <h1>ReadShift</h1>
//         <p>Paste your text below and I'll help you read it!</p>
//       </header>

//       <main className="read-shift-main">
//         <div className="input-area">
//           <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your sentence or paragraph here..." aria-label="Text input area" rows="8" />
//           <button onClick={handleReadAndAnalyze} className="action-button" disabled={isLoading || isReading} aria-label="Read text and find hard words">
//             <span role="img" aria-hidden="true">🔊</span> {isLoading ? 'Thinking...' : (isReading ? 'Reading...' : 'Read for Me!')}
//           </button>
//         </div>

//         {isLoading && <div className="loading-indicator"><p>Finding tricky words...</p><div className="spinner"></div></div>}

//         {hardWords.length > 0 && (
//           <div className="hard-words-section">
//             <h2>Tricky Words</h2> <p>Click a word to hear its meaning.</p>
//             <div className="words-container">{hardWords.map((wordData) => (<button key={wordData.word} className="word-button" onClick={() => handleWordClick(wordData)} aria-label={`Learn more about the word: ${wordData.word}`}>{wordData.word}</button>))}</div>
//             <button onClick={readAllHardWords} className="secondary-button"><span role="img" aria-hidden="true">🗣️</span> Read all together</button>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default ReadShiftPage;