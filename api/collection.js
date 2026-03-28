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

function buildCollectionPrompt(watches) {
  const watchList = watches.map((w, i) => {
    return `${i + 1}. Brand: ${w.brand}, Model: ${w.model}${w.reference ? `, Ref: ${w.reference}` : ''}${w.purchase_price ? `, Paid: £${w.purchase_price}` : ''}${w.purchase_date ? `, Bought: ${w.purchase_date}` : ''}${w.condition ? `, Condition: ${w.condition}` : ''}`;
  }).join('\n');

  return `You are a world-class watch collection advisor and market analyst. A collector wants you to analyse their collection and provide current valuations, insights, and a recommendation for their next purchase.

Their collection:
${watchList}

Available platform keys for the "next watch" recommendation:
- "chrono24" — pre-owned and grey market, all brands
- "watchfinder" — pre-owned luxury (Rolex, Omega, TAG, Breitling, IWC etc)
- "watchenclave" — pre-owned mid to high-end
- "zeitauktion" — pre-owned European auction, mid to high-end
- "ebay" — pre-owned all price points, vintage, grey market
- "amazon" — new watches, mainstream brands (Seiko, Citizen, Casio, Orient, Tissot, Hamilton etc)
- "goldsmiths" — new, authorised dealer (mid to luxury: TAG, Longines, Omega, Breitling, Tudor)
- "beaverbrooks" — new, authorised dealer (mid range: Seiko, Citizen, TAG, Tissot, Frederique Constant)
- "chisholmhunter" — new, authorised dealer (mid to luxury, Scotland-based)
- "thbaker" — new, authorised dealer (mid range UK)
- "houseofwatches" — new and pre-owned, wide range
- "cwsellors" — new, mid range UK (Seiko, Citizen, Tissot, Hamilton, Rotary)
- "fhinds" — new, budget to mid range UK (Seiko, Citizen, Casio, Rotary, Lorus)
- "citizen" — new Citizen brand watches only

Return ONLY a raw JSON object with these fields:

- "watches": array of objects, one per watch in the collection, each with:
  - "name": string (full identified name e.g. "Rolex Submariner Date 126610LN")
  - "current_value_low": number (GBP, no symbol)
  - "current_value_mid": number (GBP)
  - "current_value_high": number (GBP)
  - "market_trend": "rising" | "stable" | "falling"
  - "trend_note": string (1 sentence on price direction)
  - "sell_timing": "sell_now" | "hold" | "strong_hold" (whether now is a good time to sell)
  - "sell_note": string (1 sentence explaining sell timing)

- "total_value_low": number (sum of all lows)
- "total_value_mid": number (sum of all mids)
- "total_value_high": number (sum of all highs)

- "collection_insight": string (2-3 sentences analysing the collection as a whole — strengths, gaps, style patterns, diversification)

- "next_watch": object with:
  - "name": string (recommended next purchase)
  - "price": string (approximate price)
  - "reason": string (2-3 sentences on why this fills a gap in the collection)
  - "platforms": array of platform keys where this watch can be found

- "sell_candidate": object or null — if any watch in the collection should be sold now:
  - "name": string (which watch)
  - "reason": string (1-2 sentences on why now is the time)
  (null if no watch should be sold)

Be realistic with valuations. Use current market prices in GBP. If a purchase price was provided, factor in whether the watch has gained or lost value.

No markdown, no code blocks. Start with { end with }.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { watches } = body || {};

  if (!watches || !Array.isArray(watches) || watches.length === 0) {
    return res.status(400).json({ error: 'At least one watch is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const prompt = buildCollectionPrompt(watches);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 8192 },
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'Gemini API error', details: data });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'No text from Gemini' });

    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No JSON object found', raw: text });

    const analysis = JSON.parse(clean.slice(start, end + 1));

    // Build affiliate links for next watch recommendation
    if (analysis.next_watch && analysis.next_watch.platforms) {
      analysis.next_watch.buy_links = analysis.next_watch.platforms
        .map(p => buildLink(p, analysis.next_watch.name))
        .filter(Boolean);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ analysis });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
