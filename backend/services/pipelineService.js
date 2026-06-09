import { expandQuery } from './queryExpander.js';
import { fetchPubMedArticles, fetchPMCFullText } from './pubmedService.js';
import { fetchOpenAlexArticles } from './openAlexService.js';
import { fetchClinicalTrials } from './clinicalTrialsService.js';
import { rankPublications, rankClinicalTrials } from './ranker.js';
import { callLLM } from './llmService.js';
import { searchSimilarArticles, storeArticleEmbeddings } from './embeddingService.js';
import { checkDrugInteractions } from './drugInteractionService.js';

/**
 * Main AI pipeline orchestrator — v2.0
 *
 * Pipeline:
 * 1. Query Expansion (LLM) — enrich the user query with disease context
 * 1b. Translation — if language is not English, translate query to English
 * 2. Parallel Retrieval — PubMed (80) + OpenAlex (100) + ClinicalTrials (50) + Semantic Search
 * 3. Re-Rank & Deduplicate — score all results, pick top 7 pubs + 5 trials
 * 3b. PMC Full-Text — attempt to fetch full text for top 2 PubMed articles
 * 3c. Drug Interactions — if medications provided, check OpenFDA
 * 4. LLM Reasoning — generate structured, citation-backed response
 * 4b. Translation — if language is not English, translate response back
 */
export async function runResearchPipeline(userMessage, sessionContext) {
  const {
    disease, patientName, location, age, gender,
    conversationHistory = [],
    medications = [],
    documentContext = '',
    language = 'English',
  } = sessionContext;

  // ── Step 1: Query Expansion ──────────────────────────────────────────────
  console.log('\n[Pipeline] Step 1: Expanding query...');
  let workingMessage = userMessage;

  // 1b: If non-English, translate query to English first
  if (language && language !== 'English') {
    try {
      console.log(`[Pipeline] Translating query from ${language} to English...`);
      const translated = await callLLM(
        [
          { role: 'system', content: 'You are a medical translator. Translate the following text to English. Return ONLY the translated text, nothing else.' },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.1, maxTokens: 500 }
      );
      workingMessage = translated.trim();
      console.log(`[Pipeline] Translated: "${workingMessage}"`);
    } catch (err) {
      console.warn('[Pipeline] Translation failed, using original:', err.message);
    }
  }

  const expandedQuery = await expandQuery(workingMessage, disease, patientName);

  // ── Step 2: Parallel Data Retrieval ─────────────────────────────────────
  console.log('[Pipeline] Step 2: Fetching from all sources in parallel...');
  const [pubmedRes, openAlexRes, trialsRes, semanticRes] = await Promise.allSettled([
    fetchPubMedArticles(expandedQuery, 80),
    fetchOpenAlexArticles(expandedQuery, 100),
    fetchClinicalTrials(disease, workingMessage, location, 50),
    searchSimilarArticles(expandedQuery, 10),
  ]);

  const pubmed = pubmedRes.status === 'fulfilled' ? pubmedRes.value : [];
  const openAlex = openAlexRes.status === 'fulfilled' ? openAlexRes.value : [];
  const trials = trialsRes.status === 'fulfilled' ? trialsRes.value : [];
  const semanticResults = semanticRes.status === 'fulfilled' ? semanticRes.value : [];

  console.log(`[Pipeline] Retrieved: PubMed=${pubmed.length}, OpenAlex=${openAlex.length}, Trials=${trials.length}, Semantic=${semanticResults.length}`);

  // ── Step 3: Re-Rank ──────────────────────────────────────────────────────
  console.log('[Pipeline] Step 3: Ranking and filtering...');

  // Merge semantic results with traditional results (avoid duplicates)
  const existingIds = new Set([...pubmed, ...openAlex].map((p) => p.id));
  const uniqueSemantic = semanticResults.filter((s) => !existingIds.has(s.id));

  const allPublications = [...pubmed, ...openAlex, ...uniqueSemantic];
  const rankedPubs = rankPublications(allPublications, expandedQuery, workingMessage);
  const rankedTrials = rankClinicalTrials(trials, disease, workingMessage, location);

  const topPublications = rankedPubs.slice(0, 7);
  const topTrials = rankedTrials.slice(0, 5);

  // 3b: Attempt PMC full-text for top 2 PubMed articles (non-blocking)
  let fullTextContext = '';
  try {
    const pmcCandidates = topPublications
      .filter((p) => p.source === 'PubMed' && p.pmid)
      .slice(0, 2);

    if (pmcCandidates.length > 0) {
      console.log(`[Pipeline] Step 3b: Fetching PMC full text for ${pmcCandidates.length} articles...`);
      const ftResults = await Promise.allSettled(
        pmcCandidates.map((p) => fetchPMCFullText(p.pmid))
      );

      ftResults.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          fullTextContext += `\n\n═══ FULL TEXT: "${pmcCandidates[i].title}" ═══\n${r.value.slice(0, 1500)}`;
        }
      });
    }
  } catch (err) {
    console.warn('[Pipeline] PMC full-text fetch failed:', err.message);
  }

  // 3c: Drug interaction check (if medications provided)
  let drugInteractionResult = null;
  if (medications.length > 0) {
    console.log(`[Pipeline] Step 3c: Checking drug interactions for ${medications.length} medications...`);
    drugInteractionResult = await checkDrugInteractions(medications);
  }

  // Store embeddings for future semantic search (fire and forget)
  storeArticleEmbeddings(topPublications).catch(() => {});

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

  // Build drug interaction context for LLM
  let drugContext = '';
  if (drugInteractionResult && (drugInteractionResult.warnings.length > 0 || drugInteractionResult.interactions.length > 0)) {
    drugContext = `\n\n═══ DRUG INTERACTION ALERTS ═══\nPatient medications: ${medications.join(', ')}\n`;
    drugInteractionResult.warnings.forEach((w) => {
      drugContext += `⚠️ ${w.type.toUpperCase()}: ${w.message}\n`;
    });
  }

  // Build document context for LLM
  let docContext = '';
  if (documentContext) {
    docContext = `\n\n═══ UPLOADED MEDICAL DOCUMENT ═══\n${documentContext.slice(0, 2000)}`;
  }

  const systemPrompt = `You are Curalink, an expert AI medical research assistant. You synthesize medical literature and clinical trials into structured, accurate, research-backed answers.

PATIENT CONTEXT:
- Name: ${patientName || 'Not provided'}
- Disease/Condition: ${disease || 'Not specified'}
- Location: ${location || 'Not specified'}
- Age: ${age || 'Not specified'}
- Gender: ${gender || 'Not specified'}
${medications.length > 0 ? `- Current Medications: ${medications.join(', ')}` : ''}

${historyContext ? `RECENT CONVERSATION (for context continuity):\n${historyContext}\n` : ''}

RETRIEVED RESEARCH DATA (${topPublications.length} publications, ${topTrials.length} clinical trials):

═══ PUBLICATIONS ═══
${pubContext || 'No publications retrieved.'}

═══ CLINICAL TRIALS ═══
${trialContext || 'No clinical trials retrieved.'}
${fullTextContext}${drugContext}${docContext}

INSTRUCTIONS:
1. Only reference facts supported by the provided data above
2. Cite publications using [PUB1], [PUB2], etc. notation inline
3. Be specific and personalized to the patient's condition
4. Do NOT hallucinate or invent citations or data
5. If drug interaction warnings are present, include a DRUG SAFETY section in your response
6. If a medical document was uploaded, reference relevant values from it in your analysis
7. For each publication cited, include structured citation metadata
8. Return your response as valid JSON matching the schema below EXACTLY
${language !== 'English' ? `9. IMPORTANT: Write your ENTIRE response in ${language}. All text values in the JSON must be in ${language}.` : ''}

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
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "drugSafetyNote": "Any drug interaction warnings or safety notes (or null if none)",
  "citations": [
    {
      "id": "[PUB1]",
      "apa": "Author, A. A. (Year). Title. Journal.",
      "vancouver": "Author AA. Title. Journal. Year;Vol(Issue):Pages."
    }
  ]
}`;

  let parsedResponse = null;
  try {
    const rawLLM = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Research question: "${userMessage}"\nExpanded search query used: "${expandedQuery}"` },
      ],
      { temperature: 0.4, maxTokens: 3500 }
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
      drugSafetyNote: null,
      citations: [],
    };
  }

  return {
    expandedQuery,
    llmResponse: parsedResponse,
    publications: topPublications,
    clinicalTrials: topTrials,
    drugInteractions: drugInteractionResult,
    stats: {
      totalRetrieved: allPublications.length + trials.length,
      pubmedCount: pubmed.length,
      openAlexCount: openAlex.length,
      clinicalTrialsCount: trials.length,
      semanticCount: uniqueSemantic.length,
      topPublications: topPublications.length,
      topTrials: topTrials.length,
    },
  };
}
