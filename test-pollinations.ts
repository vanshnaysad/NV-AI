import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const pollinations = createOpenAI({
  baseURL: 'https://text.pollinations.ai/openai',
  apiKey: 'none',
});

async function main() {
  try {
    const result = await generateText({
      model: pollinations('openai'),
      prompt: 'Hello, what is your name?',
    });
    console.log("Response:", result.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
