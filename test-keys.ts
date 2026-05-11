import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({ apiKey: 'dummy_key' });

async function main() {
  const result = await streamText({
    model: groq('llama-3.1-8b-instant'),
    prompt: 'hello',
  });
  console.log("Keys on result:");
  console.log(Object.keys(result));
  for (const key of Object.keys(result)) {
    console.log(key, typeof (result as any)[key]);
  }
}

main().catch(console.error);
