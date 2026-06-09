import axios from 'axios';

/**
 * Drug Interaction Service — OpenFDA API
 *
 * Checks for known adverse events and drug interactions using the OpenFDA API.
 * This is a safety tool — it flags potential issues, not a diagnostic tool.
 */

const OPENFDA_BASE = 'https://api.fda.gov/drug';

/**
 * Check for known drug interactions and adverse events between medications.
 * @param {string[]} medications - Array of medication names
 * @returns {Object} - { interactions: [...], warnings: [...] }
 */
export async function checkDrugInteractions(medications) {
  if (!medications || medications.length === 0) {
    return { interactions: [], warnings: [] };
  }

  const interactions = [];
  const warnings = [];

  try {
    // For each medication, query OpenFDA for adverse events
    const promises = medications.map(async (drug) => {
      try {
        const searchTerm = drug.trim().toLowerCase();
        const res = await axios.get(`${OPENFDA_BASE}/event.json`, {
          params: {
            search: `patient.drug.medicinalproduct:"${searchTerm}"`,
            limit: 5,
          },
          timeout: 10000,
        });

        const events = res.data?.results || [];
        return events.map((event) => ({
          drug: drug,
          reactions: (event.patient?.reaction || [])
            .map((r) => r.reactionmeddrapt)
            .filter(Boolean)
            .slice(0, 5),
          seriousness: event.serious || 0,
          otherDrugs: (event.patient?.drug || [])
            .map((d) => d.medicinalproduct)
            .filter((d) => d && d.toLowerCase() !== searchTerm)
            .slice(0, 5),
        }));
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        interactions.push(...result.value);
      }
    }

    // Check for cross-interactions between the user's medications
    if (medications.length >= 2) {
      try {
        const drugPair = medications.slice(0, 2).map((d) => d.trim().toLowerCase());
        const res = await axios.get(`${OPENFDA_BASE}/event.json`, {
          params: {
            search: `patient.drug.medicinalproduct:"${drugPair[0]}"+AND+patient.drug.medicinalproduct:"${drugPair[1]}"`,
            limit: 3,
          },
          timeout: 10000,
        });

        const crossEvents = res.data?.results || [];
        if (crossEvents.length > 0) {
          const topReactions = crossEvents
            .flatMap((e) => (e.patient?.reaction || []).map((r) => r.reactionmeddrapt))
            .filter(Boolean);

          const uniqueReactions = [...new Set(topReactions)].slice(0, 5);

          if (uniqueReactions.length > 0) {
            warnings.push({
              type: 'cross_interaction',
              drugs: drugPair,
              reactions: uniqueReactions,
              severity: 'moderate',
              message: `Adverse events reported when ${drugPair[0]} and ${drugPair[1]} are used together: ${uniqueReactions.join(', ')}.`,
            });
          }
        }
      } catch {
        // Silently fail cross-interaction check
      }
    }

    // Check for individual drug label warnings via OpenFDA labeling API
    for (const drug of medications.slice(0, 3)) {
      try {
        const res = await axios.get(`${OPENFDA_BASE}/label.json`, {
          params: {
            search: `openfda.brand_name:"${drug.trim()}"`,
            limit: 1,
          },
          timeout: 10000,
        });

        const label = res.data?.results?.[0];
        if (label) {
          const boxWarning = label.boxed_warning?.[0];
          if (boxWarning) {
            warnings.push({
              type: 'boxed_warning',
              drug: drug,
              severity: 'high',
              message: boxWarning.slice(0, 300),
            });
          }

          const contraindications = label.contraindications?.[0];
          if (contraindications) {
            warnings.push({
              type: 'contraindication',
              drug: drug,
              severity: 'moderate',
              message: contraindications.slice(0, 300),
            });
          }
        }
      } catch {
        // Drug label not found — skip
      }
    }
  } catch (err) {
    console.error('[DrugInteraction] Error:', err.message);
  }

  console.log(`[DrugInteraction] Found ${interactions.length} events, ${warnings.length} warnings`);
  return { interactions: interactions.slice(0, 10), warnings: warnings.slice(0, 5) };
}
