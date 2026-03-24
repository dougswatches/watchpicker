export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// Affiliate IDs from environment variables
const IDS = {
  amazon:       process.env.AMAZON_TRACKING_ID      || '',
  ebay:         process.env.EBAY_CAMPAIGN_ID         || '',
  awin:         process.env.AWIN_AFFILIATE_ID        || '',
  chrono24:     process.env.CHRONO24_PARTNER_ID      || '',
  zeitauktion:  process.env.ZEITAUKTION_ID           || '',
};

// Awin merchant IDs
const AWIN_MERCHANTS = {
  watchfinder:     '10552',
  goldsmiths:      '6666',
  beaverbrooks:    '9608',
  chisholmhunter:  '15490',
  thbaker:         '14910',
  houseofwatches:  '6543',
};

function encode(query) {
  return encodeURIComponent(query);
}

function awinUrl(merchantId, destinationUrl) {
  if (!IDS.awin) return destinationUrl;
  return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${IDS.awin}&clickref=&p=${encodeURIComponent(destinationUrl)}`;
}

function buildLinks(name, availability) {
  const q = encode(name);
  const links = [];

  const isNew      = availability === 'new' || availability === 'both';
  const isPreowned = availability === 'preowned' || availability === 'both';

  // --- Pre-owned platforms ---
  if (isPreowned) {
    // Chrono24
    const c24base = `https://www.chrono24.com/search/index.htm?query=${q}`;
    links.push({
      label: 'Chrono24',
      url: IDS.chrono24
        ? `${c24base}&partnerId=${IDS.chrono24}`
        : c24base,
    });

    // WatchFinder
    links.push({
      label: 'WatchFinder',
      url: awinUrl(
        AWIN_MERCHANTS.watchfinder,
        `https://www.watchfinder.co.uk/search?q=${q}`
      ),
    });

    // Watch Enclave
    links.push({
      label: 'Watch Enclave',
      url: `https://www.watchenclave.co.uk/search?type=product&q=${q}`,
    });

    // Zeitauktion
    const ztbase = `https://www.zeitauktion.com/en/search?q=${q}`;
    links.push({
      label: 'Zeitauktion',
      url: IDS.zeitauktion
        ? `${ztbase}&ref=${IDS.zeitauktion}`
        : ztbase,
    });

    // eBay
    const ebaybase = `https://www.ebay.co.uk/sch/i.html?_nkw=${q}&_sacat=281&LH_TitleDesc=0`;
    links.push({
      label: 'eBay',
      url: IDS.ebay
        ? `${ebaybase}&campid=${IDS.ebay}`
        : ebaybase,
    });
  }

  // --- New platforms ---
  if (isNew) {
    // Amazon
    const amzbase = `https://www.amazon.co.uk/s?k=${q}&i=watches`;
    links.push({
      label: 'Amazon',
      url: IDS.amazon
        ? `${amzbase}&tag=${IDS.amazon}`
        : amzbase,
    });

    // Goldsmiths
    links.push({
      label: 'Goldsmiths',
      url: awinUrl(
        AWIN_MERCHANTS.goldsmiths,
        `https://www.goldsmiths.co.uk/search?q=${q}`
      ),
    });

    // Beaverbrooks
    links.push({
      label: 'Beaverbrooks',
      url: awinUrl(
        AWIN_MERCHANTS.beaverbrooks,
        `https://www.beaverbrooks.co.uk/search?q=${q}`
      ),
    });

    // Chisholm Hunter
    links.push({
      label: 'Chisholm Hunter',
      url: awinUrl(
        AWIN_MERCHANTS.chisholmhunter,
        `https://www.chisholmhunter.co.uk/search?q=${q}`
      ),
    });

    // TH Baker
    links.push({
      label: 'TH Baker',
      url: awinUrl(
        AWIN_MERCHANTS.thbaker,
        `https://www.thbaker.co.uk/search?q=${q}`
      ),
    });

    // House of Watches
    links.push({
      label: 'House of Watches',
      url: awinUrl(
        AWIN_MERCHANTS.houseofwatches,
        `https://www.houseofwatches.co.uk/search?q=${q}`
      ),
    });

    // CW Sellors (no affiliate needed)
    links.push({
      label: 'CW Sellors',
      url: `https://www.cwsellors.co.uk/search?q=${q}`,
    });

    // F Hinds (no affiliate needed)
    links.push({
      label: 'F.Hinds',
      url: `https://www.fhinds.co.uk/search?q=${q}`,
    });
  }

  return links;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { prompt } = body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

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

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Gemini API error',
        status: response.status,
        details: data,
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'No text from Gemini', raw: data });

    // Parse the JSON from Gemini
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: 'Could not find JSON array', raw: text });
    }

    const watches = JSON.parse(clean.slice(start, end + 1));

    // Inject affiliate links server-side
    const enriched = watches.map(watch => ({
      ...watch,
      buy_links: buildLinks(watch.name, watch.availability || 'both'),
    }));

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ watches: enriched });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
