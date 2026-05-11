import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function main() {
  try {
    const result = await generateText({
      model: google('gemini-1.5-pro-latest'),
      prompt: 'hi',
    });
    console.log("Response:", result.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
