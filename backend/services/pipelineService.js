import { expandQuery } from './queryExpander.js';
import { fetchPubMedArticles } from './pubmedService.js';
import { fetchOpenAlexArticles } from './openAlexService.js';
import { fetchClinicalTrials } from './clinicalTrialsService.js';
import { rankPublications, rankClinicalTrials } from './ranker.js';
import { callLLM } from './llmService.js';

/**
 * Main AI pipeline orchestrator.
 *
 * Pipeline:
 * 1. Query Expansion (LLM) — enrich the user query with disease context
 * 2. Parallel Retrieval — PubMed (80) + OpenAlex (100) + ClinicalTrials (50)
 * 3. Re-Rank & Deduplicate — score all results, pick top 7 pubs + 5 trials
 * 4. LLM Reasoning — generate structured, citation-backed response
 */
export async function runResearchPipeline(userMessage, sessionContext) {
  const { disease, patientName, location, conversationHistory = [] } = sessionContext;

  // ── Step 1: Query Expansion ──────────────────────────────────────────────
  console.log('\n[Pipeline] Step 1: Expanding query...');
  const expandedQuery = await expandQuery(userMessage, disease, patientName);

  // ── Step 2: Parallel Data Retrieval ─────────────────────────────────────
  console.log('[Pipeline] Step 2: Fetching from all sources in parallel...');
  const [pubmedRes, openAlexRes, trialsRes] = await Promise.allSettled([
    fetchPubMedArticles(expandedQuery, 80),
    fetchOpenAlexArticles(expandedQuery, 100),
    fetchClinicalTrials(disease, userMessage, location, 50),
  ]);

  const pubmed = pubmedRes.status === 'fulfilled' ? pubmedRes.value : [];
  const openAlex = openAlexRes.status === 'fulfilled' ? openAlexRes.value : [];
  const trials = trialsRes.status === 'fulfilled' ? trialsRes.value : [];

  console.log(`[Pipeline] Retrieved: PubMed=${pubmed.length}, OpenAlex=${openAlex.length}, Trials=${trials.length}`);

  // ── Step 3: Re-Rank ──────────────────────────────────────────────────────
  console.log('[Pipeline] Step 3: Ranking and filtering...');
  const allPublications = [...pubmed, ...openAlex];
  const rankedPubs = rankPublications(allPublications, expandedQuery, userMessage);
  const rankedTrials = rankClinicalTrials(trials, disease, userMessage, location);

  const topPublications = rankedPubs.slice(0, 7);
  const topTrials = rankedTrials.slice(0, 5);

  // ── Step 4: LLM Reasoning ────────────────────────────────────────────────
  console.log('[Pipeline] Step 4: LLM reasoning...');

  const pubContext = topPublications
    .map((p, i) =>
      `[PUB${i + 1}] Title: "${p.title}"
  Source: ${p.source} | Year: ${p.year}
  Authors: ${p.authors.slice(0, 3).join(', ')}
  Abstract: ${p.abstract || 'No abstract available'}`
    )
    .join('\n\n');

  const trialContext = topTrials
    .map((t, i) =>
      `[TRIAL${i + 1}] Title: "${t.title}"
  Status: ${t.status} | Location: ${t.location}
  Summary: ${t.briefSummary}
  Eligibility: ${t.eligibilityCriteria?.slice(0, 200)}`
    )
    .join('\n\n');

  const historyContext = conversationHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Curalink'}: ${m.content.slice(0, 300)}`)
    .join('\n');

  const systemPrompt = `You are Curalink, an expert AI medical research assistant. You synthesize medical literature and clinical trials into structured, accurate, research-backed answers.

PATIENT CONTEXT:
- Name: ${patientName || 'Not provided'}
- Disease/Condition: ${disease || 'Not specified'}
- Location: ${location || 'Not specified'}

${historyContext ? `RECENT CONVERSATION (for context continuity):\n${historyContext}\n` : ''}

RETRIEVED RESEARCH DATA (${topPublications.length} publications, ${topTrials.length} clinical trials):

═══ PUBLICATIONS ═══
${pubContext || 'No publications retrieved.'}

═══ CLINICAL TRIALS ═══
${trialContext || 'No clinical trials retrieved.'}

INSTRUCTIONS:
1. Only reference facts supported by the provided data above
2. Cite publications using [PUB1], [PUB2], etc. notation inline
3. Be specific and personalized to the patient's condition
4. Do NOT hallucinate or invent citations or data
5. Return your response as valid JSON matching the schema below EXACTLY

RESPONSE SCHEMA (valid JSON only, no markdown, no extra text):
{
  "conditionOverview": "2-3 sentence overview relevant to the query",
  "researchInsights": [
    {
      "insight": "Key finding or insight",
      "citation": "[PUB1]",
      "detail": "Supporting explanation from the abstract"
    }
  ],
  "clinicalTrialsSummary": "Summary of the relevant clinical trials and what they mean for the patient",
  "personalizedNote": "A personalized, empathetic note for ${patientName || 'the patient'} given their condition",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}`;

  let parsedResponse = null;
  try {
    const rawLLM = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Research question: "${userMessage}"\nExpanded search query used: "${expandedQuery}"` },
      ],
      { temperature: 0.4, maxTokens: 2800 }
    );

    // Extract JSON from response (handles cases where LLM wraps in markdown)
    const jsonMatch = rawLLM.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[0]);
    } else {
      parsedResponse = { conditionOverview: rawLLM, researchInsights: [], keyTakeaways: [] };
    }
  } catch (err) {
    console.error('[Pipeline] LLM error:', err.message);
    parsedResponse = {
      conditionOverview: `We retrieved ${topPublications.length} publications and ${topTrials.length} clinical trials for your query. The AI reasoning step encountered an issue — please review the source materials below.`,
      researchInsights: topPublications.slice(0, 3).map((p, i) => ({
        insight: p.title,
        citation: `[PUB${i + 1}]`,
        detail: p.abstract?.slice(0, 200) || 'See source for details.',
      })),
      clinicalTrialsSummary: topTrials.length > 0
        ? `Found ${topTrials.length} relevant trials. Top trial: "${topTrials[0]?.title}" (${topTrials[0]?.status}).`
        : 'No relevant clinical trials found.',
      personalizedNote: 'Please consult a qualified healthcare professional for personalized medical advice.',
      keyTakeaways: ['Review the publications below for detailed information.'],
    };
  }

  return {
    expandedQuery,
    llmResponse: parsedResponse,
    publications: topPublications,
    clinicalTrials: topTrials,
    stats: {
      totalRetrieved: allPublications.length + trials.length,
      pubmedCount: pubmed.length,
      openAlexCount: openAlex.length,
      clinicalTrialsCount: trials.length,
      topPublications: topPublications.length,
      topTrials: topTrials.length,
    },
  };
}
