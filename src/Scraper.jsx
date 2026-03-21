import { useState } from 'react';

const Scraper = () => {
  const [formData, setFormData] = useState({ 
    url: '', 
    keyword: '', 
    contentType: 'text', 
    filterType: 'sentence'
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<mark style="background: yellow; color: black;">$1</mark>');
  };

  const handleScrape = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔍 Web Scraper</h2>
      
      <input type="text" placeholder="URL..." value={formData.url}
        onChange={(e) => setFormData({...formData, url: e.target.value})}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />

      <input type="text" placeholder="Keyword..." value={formData.keyword}
        onChange={(e) => setFormData({...formData, keyword: e.target.value})}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />

      {/* FILTER DROPDOWN */}
      <select 
        value={formData.filterType}
        onChange={(e) => setFormData({...formData, filterType: e.target.value})}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}>
        <option value="sentence">Extract Exact Sentences</option>
        <option value="paragraph">Extract Full Paragraphs</option>
      </select>

      <button onClick={handleScrape} disabled={loading} style={{ padding: '10px 20px', width: '100%' }}>
        {loading ? 'Scraping...' : 'Start Scrape'}
      </button>

      {/* ERROR DISPLAY */}
      {error && <p style={{ color: 'red', marginTop: '20px', fontWeight: 'bold' }}>⚠️ {error}</p>}

      {/* RESULTS DISPLAY */}
      {results && (
        <div style={{ marginTop: '20px', background: '#f4f4f4', padding: '15px', color: '#333' }}>
          <h3>Matches: {results.matches?.length || 0}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.matches?.map((match, i) => (
              <li key={i} style={{ marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}
                  dangerouslySetInnerHTML={{ __html: highlightText(match, formData.keyword) }} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Scraper;