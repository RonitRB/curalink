/**
 * Re-ranking engine for publications and clinical trials.
 *
 * Scoring formula for publications (0-100):
 * - Keyword relevance (0-40): TF-style matching against expanded query terms
 * - Recency (0-30): Papers in last 5 years score highest (exponential decay)
 * - Source credibility (0-20): PubMed=20, OpenAlex=15
 * - Abstract quality (0-10): presence & length of abstract
 */

export function rankPublications(publications, expandedQuery, originalQuery) {
  // Build deduplicated term set from both queries
  const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'are', 'was']);
  const queryTerms = [...new Set(
    `${expandedQuery} ${originalQuery}`.toLowerCase()
      .split(/[\s,;:]+/)
      .filter((t) => t.length > 3 && !stopWords.has(t))
  )];

  const currentYear = new Date().getFullYear();

  // Deduplicate: prefer PubMed if same title appears in both sources
  const seen = new Map();
  for (const pub of publications) {
    const normalizedTitle = pub.title?.toLowerCase().trim();
    if (!normalizedTitle) continue;
    if (!seen.has(normalizedTitle) || pub.source === 'PubMed') {
      seen.set(normalizedTitle, pub);
    }
  }
  const deduped = [...seen.values()];

  const scored = deduped.map((pub) => {
    const titleText = (pub.title || '').toLowerCase();
    const abstractText = (pub.abstract || '').toLowerCase();

    // Keyword relevance (0-40)
    let rawKw = 0;
    for (const term of queryTerms) {
      const re = new RegExp(term, 'g');
      rawKw += ((titleText.match(re) || []).length * 4);  // title match = 4x
      rawKw += ((abstractText.match(re) || []).length * 1);
    }
    const keywordScore = Math.min(rawKw / Math.max(queryTerms.length * 3, 1), 1) * 40;

    // Recency (0-30): 0 years old = 30, 10 years old = 0
    const age = currentYear - (pub.year || 2010);
    const recencyScore = Math.max(0, 1 - age / 10) * 30;

    // Credibility (0-20)
    const credibility = pub.source === 'PubMed' ? 20 : 15;

    // Abstract quality (0-10)
    const abstractQuality = pub.abstract && pub.abstract.length > 100 ? 10 : (pub.abstract ? 5 : 0);

    // OpenAlex embedded relevance boost (0-5)
    const openAlexBoost = pub.relevanceScore ? Math.min(pub.relevanceScore / 100, 1) * 5 : 0;

    return {
      ...pub,
      finalScore: keywordScore + recencyScore + credibility + abstractQuality + openAlexBoost,
    };
  });

  return scored.sort((a, b) => b.finalScore - a.finalScore);
}

/**
 * Scoring formula for trials:
 * - Keyword relevance (0-50): title + summary matching
 * - RECRUITING status boost: +25
 * - Location match boost: +15
 */
export function rankClinicalTrials(trials, disease, query, userLocation) {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'are', 'was']);
  const queryTerms = [...new Set(
    `${disease || ''} ${query || ''}`.toLowerCase()
      .split(/[\s,;:]+/)
      .filter((t) => t.length > 3 && !stopWords.has(t))
  )];

  const scored = trials.map((trial) => {
    const titleText = (trial.title || '').toLowerCase();
    const summaryText = (trial.briefSummary || '').toLowerCase();

    let rawKw = 0;
    for (const term of queryTerms) {
      const re = new RegExp(term, 'g');
      rawKw += ((titleText.match(re) || []).length * 4);
      rawKw += ((summaryText.match(re) || []).length * 1);
    }
    const keywordScore = Math.min(rawKw / Math.max(queryTerms.length * 2, 1), 1) * 50;

    const statusBoost = trial.status === 'RECRUITING' ? 25 : 0;

    const locationBoost =
      userLocation &&
      trial.location?.toLowerCase().includes(userLocation.toLowerCase().split(',')[0])
        ? 15
        : 0;

    return {
      ...trial,
      finalScore: keywordScore + statusBoost + locationBoost,
    };
  });

  return scored.sort((a, b) => b.finalScore - a.finalScore);
}
