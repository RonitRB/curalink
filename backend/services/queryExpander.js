import { callLLM } from './llmService.js';

/**
 * Expands a user query into a richer medical search query using the LLM.
 * E.g., "deep brain stimulation" + "Parkinson's" → "deep brain stimulation Parkinson's disease neurological outcomes DBS therapy"
 */
export async function expandQuery(userQuery, disease, patientContext) {
  const prompt = `You are a medical research librarian expert in crafting precise PubMed/OpenAlex search queries.

Given:
- Disease/Condition: ${disease || 'not specified'}
- User Question: ${userQuery}
- Patient Context: ${patientContext || 'general adult patient'}

Generate ONE optimized search query string for academic medical databases that:
1. Combines the disease with the specific topic
2. Includes key medical synonyms and terminology
3. Is 6–15 words maximum
4. Uses AND/OR sparingly only if truly necessary

Return ONLY the query string. No explanation. No quotes. No extra text.`;

  try {
    const expanded = await callLLM([{ role: 'user', content: prompt }], {
      temperature: 0.2,
      maxTokens: 80,
    });
    const clean = expanded.trim().replace(/^["']|["']$/g, '');
    console.log(`[QueryExpander] "${userQuery}" → "${clean}"`);
    return clean;
  } catch (err) {
    console.warn('[QueryExpander] LLM expansion failed, using fallback:', err.message);
    return disease ? `${disease} ${userQuery}`.trim() : userQuery;
  }
}
