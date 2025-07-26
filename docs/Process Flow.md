startReadShiftFlow Process Overview
Extract Text from Image
The process begins by calling ollamaClient.getTextFromImage() to extract text from an image.

Text-to-Speech (Step 1)
Immediately after retrieving the text, ttsService.speak() is called to read the text aloud. This marks Step 1 of the process.

Pause and Callback Setup (Step 2)
The perform Step3 function is passed as the onEndCallback to ttsService. This means the system will wait until the speech is finished before continuing — effectively creating a pause, which represents Step 2.

Generate Follow-Up and Speak (Step 3)
Once the speech ends, performStep3 is triggered. Inside this function, ollamaClient.generateFollowUp() is called to produce a follow-up response, which is then spoken aloud — completing Step 3.