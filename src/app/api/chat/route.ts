import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { createGroq } from '@ai-sdk/groq';
import { deepseek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';

const groq = createGroq();

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  let aiModel;
  
  switch (model) {
    case 'gpt-4o':
      aiModel = openai('gpt-4o');
      break;
    case 'claude-3-5-sonnet':
      aiModel = anthropic('claude-3-5-sonnet-20240620');
      break;
    case 'gemini-1.5-flash':
      aiModel = google('gemini-1.5-flash-latest');
      break;
    case 'gemini-1.5-pro':
      aiModel = google('models/gemini-1.5-pro-latest');
      break;
    case 'grok-beta':
      aiModel = xai('grok-beta');
      break;
    case 'llama-3-1-8b':
      aiModel = groq('llama-3.1-8b-instant');
      break;
    case 'llama-3-3-70b':
      aiModel = groq('llama-3.3-70b-versatile');
      break;
    case 'deepseek-r1':
      aiModel = deepseek('deepseek-reasoner');
      break;
    default:
      aiModel = openai('gpt-4o');
  }

  const coreMessages = messages.map((m: any) => {
    if (m.parts) {
      const text = m.parts.map((p: any) => p.text).join("");
      return { role: m.role, content: text };
    }
    return m;
  });

  const result = await streamText({
    model: aiModel,
    messages: coreMessages,
    system: "You are NV AI, a helpful and expert artificial intelligence assistant. IMPORTANT: If anyone asks who created you, who made you, or who your developer is, you must proudly answer that you were created by MR. NAYSAD VANSH.",
  });

  return result.toTextStreamResponse();
}
