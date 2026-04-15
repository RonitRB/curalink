import axios from 'axios';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Call the Groq LLM (Llama 3.3-70B open-source model)
 * Groq provides free inference for open-source models — satisfies the "no Gemini/OpenAI" requirement.
 */
export async function callLLM(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2500 } = options;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com');
  }

  const response = await axios.post(
    GROQ_BASE_URL,
    {
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 45000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content returned from LLM');
  return content;
}
