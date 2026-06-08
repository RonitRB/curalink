import axios from 'axios';

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Fetch clinical trials from ClinicalTrials.gov API v2.
 * Fetches both RECRUITING and COMPLETED trials in parallel for depth.
 */
export async function fetchClinicalTrials(disease, query, location, maxResults = 50) {
  try {
    const searchTerm = [disease, query].filter(Boolean).join(' ').trim();
    if (!searchTerm) return [];

    const half = Math.ceil(maxResults / 2);
    const baseParams = {
      'query.cond': searchTerm,
      pageSize: half,
      format: 'json',
      ...(location && { 'query.locn': location }),
    };

    const [recruitingRes, completedRes] = await Promise.allSettled([
      axios.get(BASE_URL, { params: { ...baseParams, 'filter.overallStatus': 'RECRUITING' }, timeout: 15000 }),
      axios.get(BASE_URL, { params: { ...baseParams, 'filter.overallStatus': 'COMPLETED' }, timeout: 15000 }),
    ]);

    const allStudies = [];
    if (recruitingRes.status === 'fulfilled') allStudies.push(...(recruitingRes.value.data?.studies || []));
    if (completedRes.status === 'fulfilled') allStudies.push(...(completedRes.value.data?.studies || []));

    const results = allStudies.map((study) => {
      try {
        const proto = study?.protocolSection;
        const id = proto?.identificationModule?.nctId;
        const title = proto?.identificationModule?.briefTitle || 'Untitled Trial';
        const status = proto?.statusModule?.overallStatus || 'Unknown';
        const briefSummary = proto?.descriptionModule?.briefSummary?.slice(0, 500) || '';

        const eligModule = proto?.eligibilityModule;
        const eligibilityCriteria = eligModule?.eligibilityCriteria?.slice(0, 400) || 'Not specified';
        const minAge = eligModule?.minimumAge || '';
        const maxAge = eligModule?.maximumAge || '';

        const locations = proto?.contactsLocationsModule?.locations || [];
        const loc = locations[0];
        const locationStr = loc
          ? [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
          : location || 'Not specified';

        const contacts = proto?.contactsLocationsModule?.centralContacts || [];
        const c = contacts[0];
        const contactInfo = c
          ? `${c.name || ''} — ${c.email || c.phone || 'N/A'}`.trim().replace(/^—\s*/, '')
          : 'Not available';

        return {
          id,
          title,
          status,
          briefSummary,
          eligibilityCriteria,
          minAge,
          maxAge,
          location: locationStr,
          contactInfo,
          url: id ? `https://clinicaltrials.gov/study/${id}` : null,
          relevanceScore: 0,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    console.log(`[ClinicalTrials] Retrieved ${results.length} trials`);
    return results;
  } catch (err) {
    console.error('[ClinicalTrials] Error:', err.message);
    return [];
  }
}
