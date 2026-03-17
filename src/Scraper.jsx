import { useState } from 'react';

const Scraper = () => {
  const [formData, setFormData] = useState({ url: '', keyword: '', contentType: 'text' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScrape = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error connecting to server:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔍 Web Scraper Dashboard</h2>
      <input 
        type="text" 
        placeholder="Enter URL..." 
        value={formData.url}
        onChange={(e) => setFormData({...formData, url: e.target.value})}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />
      <input 
        type="text" 
        placeholder="Keyword (e.g. prototype)" 
        value={formData.keyword}
        onChange={(e) => setFormData({...formData, keyword: e.target.value})}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />
      <button onClick={handleScrape} disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        {loading ? 'Scraping... (Puppeteer is working)' : 'Start Scrape'}
      </button>

      {results && (
        <div style={{ marginTop: '20px', textAlign: 'left', background: '#f4f4f4', padding: '15px' }}>
          <h3>Results Found: {results.matches?.length || 0}</h3>
          <ul>
            {results.matches?.map((match, i) => (
              <li key={i} style={{ marginBottom: '10px' }}>{match}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Scraper;