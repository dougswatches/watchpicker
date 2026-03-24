export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
  },
};

const IDS = {
  amazon:      process.env.AMAZON_TRACKING_ID   || '',
  ebay:        process.env.EBAY_CAMPAIGN_ID      || '',
  awin:        process.env.AWIN_AFFILIATE_ID     || '',
  chrono24:    process.env.CHRONO24_PARTNER_ID   || '',
  zeitauktion: process.env.ZEITAUKTION_ID        || '',
};

const AWIN_MERCHANTS = {
  watchfinder:    '10552',
  goldsmiths:     '6666',
  beaverbrooks:   '9608',
  chisholmhunter: '15490',
  thbaker:        '14910',
  houseofwatches: '6543',
};

function encode(q) { return encodeURIComponent(q); }

function awinUrl(merchantId, dest) {
  if (!IDS.awin) return dest;
  return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${IDS.awin}&clickref=&p=${encodeURIComponent(dest)}`;
}

function buildLink(platform, name) {
  const q = encode(name);
  switch (platform) {
    case 'chrono24':
      return { label: 'Chrono24', url: IDS.chrono24 ? `https://www.chrono24.com/search/index.htm?query=${q}&partnerId=${IDS.chrono24}` : `https://www.chrono24.com/search/index.htm?query=${q}` };
    case 'watchfinder':
      return { label: 'WatchFinder', url: awinUrl(AWIN_MERCHANTS.watchfinder, `https://www.watchfinder.co.uk/search?q=${q}`) };
    case 'watchenclave':
      return { label: 'Watch Enclave', url: `https://www.watchenclave.co.uk/search?type=product&q=${q}` };
    case 'zeitauktion':
      return { label: 'Zeitauktion', url: IDS.zeitauktion ? `https://www.zeitauktion.com/en/search?q=${q}&ref=${IDS.zeitauktion}` : `https://www.zeitauktion.com/en/search?q=${q}` };
    case 'ebay':
      return { label: 'eBay', url: IDS.ebay ? `https://www.ebay.co.uk/sch/i.html?_nkw=${q}&_sacat=281&campid=${IDS.ebay}` : `https://www.ebay.co.uk/sch/i.html?_nkw=${q}&_sacat=281` };
    case 'amazon':
      return { label: 'Amazon', url: IDS.amazon ? `https://www.amazon.co.uk/s?k=${q}&i=watches&tag=${IDS.amazon}` : `https://www.amazon.co.uk/s?k=${q}&i=watches` };
    case 'goldsmiths':
      return { label: 'Goldsmiths', url: awinUrl(AWIN_MERCHANTS.goldsmiths, `https://www.goldsmiths.co.uk/search?q=${q}`) };
    case 'beaverbrooks':
      return { label: 'Beaverbrooks', url: awinUrl(AWIN_MERCHANTS.beaverbrooks, `https://www.beaverbrooks.co.uk/search?q=${q}`) };
    case 'chisholmhunter':
      return { label: 'Chisholm Hunter', url: awinUrl(AWIN_MERCHANTS.chisholmhunter, `https://www.chisholmhunter.co.uk/search?q=${q}`) };
    case 'thbaker':
      return { label: 'TH Baker', url: awinUrl(AWIN_MERCHANTS.thbaker, `https://www.thbaker.co.uk/search?q=${q}`) };
    case 'houseofwatches':
      return { label: 'House of Watches', url: awinUrl(AWIN_MERCHANTS.houseofwatches, `https://www.houseofwatches.co.uk/search?q=${q}`) };
    case 'cwsellors':
      return { label: 'CW Sellors', url: `https://www.cwsellors.co.uk/search?q=${q}` };
    case 'fhinds':
      return { label: 'F.Hinds', url: `https://www.fhinds.co.uk/search?q=${q}` };
    case 'citizen':
      return { label: 'Citizen', url: `https://www.citizenwatch.com/us/en/search/?q=${q}` };
    default:
      return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { prompt } = body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'Gemini API error', details: data });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'No text from Gemini' });

    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No JSON array found', raw: text });

    const watches = JSON.parse(clean.slice(start, end + 1));

    const enriched = watches.map(watch => ({
      ...watch,
      buy_links: (watch.platforms || [])
        .map(p => buildLink(p, watch.name))
        .filter(Boolean),
    }));

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ watches: enriched });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
