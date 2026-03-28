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
      return { label: 'Citizen', url: `https://www.citizenwatch.com/uk/en/search/?q=${q}` };
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'Gemini API error', details: data });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'No text from Gemini' });

    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Try to parse as object first (new format), fall back to array (old format)
    let watches, collection_note;
    const objStart = clean.indexOf('{');
    const objEnd = clean.lastIndexOf('}');
    const arrStart = clean.indexOf('[');
    const arrEnd = clean.lastIndexOf(']');

    if (objStart !== -1 && objEnd !== -1 && (objStart < arrStart || arrStart === -1)) {
      const parsed = JSON.parse(clean.slice(objStart, objEnd + 1));
      watches = parsed.watches || [];
      collection_note = parsed.collection_note || '';
    } else if (arrStart !== -1 && arrEnd !== -1) {
      watches = JSON.parse(clean.slice(arrStart, arrEnd + 1));
      collection_note = '';
    } else {
      return res.status(500).json({ error: 'No JSON found', raw: text });
    }

    const enriched = watches.map(watch => ({
      ...watch,
      buy_links: (watch.platforms || [])
        .map(p => buildLink(p, watch.name))
        .filter(Boolean),
    }));

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ watches: enriched, collection_note });

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
