import axios from 'axios';

const BASE_URL = 'https://api.openalex.org/works';

/**
 * Fetch research publications from OpenAlex.
 * Fetches up to 2 pages of results (50 per page = 100 total) sorted by relevance.
 * Uses polite pool via mailto param.
 */
export async function fetchOpenAlexArticles(query, maxResults = 100) {
  try {
    const allResults = [];
    const perPage = 50;
    const maxPages = Math.ceil(Math.min(maxResults, 100) / perPage);

    for (let page = 1; page <= maxPages; page++) {
      const res = await axios.get(BASE_URL, {
        params: {
          search: query,
          'per-page': perPage,
          page,
          sort: 'relevance_score:desc',
          filter: 'from_publication_date:2015-01-01,type:article',
          mailto: 'curalink@research.ai',
        },
        timeout: 15000,
      });

      const works = res.data?.results || [];
      allResults.push(...works);
      if (works.length < perPage) break;
    }

    const results = allResults.map((work) => {
      const authors = (work.authorships || [])
        .slice(0, 5)
        .map((a) => a?.author?.display_name)
        .filter(Boolean);

      // OpenAlex stores abstract as inverted index — reconstruct it
      let abstract = '';
      if (work.abstract_inverted_index) {
        const wordPositions = Object.entries(work.abstract_inverted_index);
        const wordArray = [];
        wordPositions.forEach(([word, positions]) => {
          positions.forEach((pos) => { wordArray[pos] = word; });
        });
        abstract = wordArray.filter(Boolean).join(' ').slice(0, 600);
      }

      const doi = work.doi?.replace('https://doi.org/', '');
      const url = doi ? `https://doi.org/${doi}` : work.id;

      return {
        id: work.id,
        title: work.title || 'Untitled',
        abstract,
        authors,
        year: work.publication_year || 0,
        source: 'OpenAlex',
        url,
        relevanceScore: work.relevance_score || 0,
      };
    }).filter((a) => a.title && a.title !== 'Untitled');

    console.log(`[OpenAlex] Retrieved ${results.length} articles`);
    return results;
  } catch (err) {
    console.error('[OpenAlex] Error:', err.message);
    return [];
  }
}
