import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const NCBI_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Fetch research publications from PubMed using two-step esearch → efetch pipeline.
 * Step 1: esearch returns a list of PMIDs
 * Step 2: efetch returns full article details as XML, which we parse
 */
export async function fetchPubMedArticles(query, maxResults = 80) {
  try {
    const params = {
      db: 'pubmed',
      term: query,
      retmax: maxResults,
      sort: 'pub+date',
      retmode: 'json',
    };
    if (process.env.NCBI_API_KEY) params.api_key = process.env.NCBI_API_KEY;

    // Step 1: Get IDs
    const searchRes = await axios.get(`${NCBI_BASE}/esearch.fcgi`, {
      params,
      timeout: 15000,
    });

    const idList = searchRes.data?.esearchresult?.idlist || [];
    if (idList.length === 0) {
      console.log('[PubMed] No IDs found for query:', query);
      return [];
    }

    console.log(`[PubMed] Found ${idList.length} IDs`);

    // Step 2: Fetch details in XML
    const fetchParams = {
      db: 'pubmed',
      id: idList.join(','),
      retmode: 'xml',
    };
    if (process.env.NCBI_API_KEY) fetchParams.api_key = process.env.NCBI_API_KEY;

    const fetchRes = await axios.get(`${NCBI_BASE}/efetch.fcgi`, {
      params: fetchParams,
      timeout: 30000,
    });

    const parsed = await parseStringPromise(fetchRes.data, { explicitArray: true });
    const articles = parsed?.PubmedArticleSet?.PubmedArticle || [];

    const results = articles.map((article) => {
      try {
        const medline = article?.MedlineCitation?.[0];
        const articleData = medline?.Article?.[0];
        const pmid = medline?.PMID?.[0]?._ || medline?.PMID?.[0] || '';

        // Title
        const rawTitle = articleData?.ArticleTitle?.[0];
        const title = (typeof rawTitle === 'string'
          ? rawTitle
          : rawTitle?._ || rawTitle?.['#text'] || 'Untitled'
        ).replace(/<[^>]+>/g, '').trim();

        // Abstract
        const abstractNodes = articleData?.Abstract?.[0]?.AbstractText || [];
        const abstract = abstractNodes
          .map((t) => (typeof t === 'string' ? t : t?._ || t?.['#text'] || ''))
          .join(' ')
          .slice(0, 600);

        // Authors
        const authorList = articleData?.AuthorList?.[0]?.Author || [];
        const authors = authorList.slice(0, 5).map((a) => {
          const ln = a?.LastName?.[0] || '';
          const fn = a?.ForeName?.[0] || a?.Initials?.[0] || '';
          return `${ln} ${fn}`.trim();
        }).filter(Boolean);

        // Year
        const pubDate = articleData?.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0];
        const year =
          parseInt(pubDate?.Year?.[0]) ||
          parseInt(pubDate?.MedlineDate?.[0]?.substring(0, 4)) ||
          0;

        if (!title || title === 'Untitled') return null;

        return {
          id: `pubmed_${pmid}`,
          title,
          abstract,
          authors,
          year,
          source: 'PubMed',
          url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
          relevanceScore: 0,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    console.log(`[PubMed] Parsed ${results.length} valid articles`);
    return results;
  } catch (err) {
    console.error('[PubMed] Error:', err.message);
    return [];
  }
}
