export default function PublicationCard({ pub, index }) {
  const sourceClass = pub.source === 'PubMed' ? 'pubmed' : 'openalex';

  return (
    <div className="pub-card">
      <div className="pub-card-header">
        <span className={`pub-source-badge ${sourceClass}`}>{pub.source}</span>
        {pub.year > 0 && <span className="pub-year">{pub.year}</span>}
      </div>
      <div className="pub-title">{pub.title}</div>
      {pub.authors && pub.authors.length > 0 && (
        <div className="pub-authors">
          {pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ` +${pub.authors.length - 3}` : ''}
        </div>
      )}
      {pub.abstract && (
        <div className="pub-abstract">{pub.abstract}</div>
      )}
      {pub.url && (
        <a href={pub.url} target="_blank" rel="noopener noreferrer" className="pub-link">
          View Publication →
        </a>
      )}
    </div>
  );
}
