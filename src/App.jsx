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

function buildValuationPrompt({ brand, model, reference, condition, notes }) {
  return `You are a world-class watch valuation expert with deep knowledge of the pre-owned and new watch markets. You have access to current market data and recent sale prices. Provide a comprehensive market valuation for this watch:

- Brand: ${brand}
- Model: ${model}
${reference ? `- Reference number: ${reference}` : ''}
- Condition: ${condition}
${notes ? `- Additional notes: ${notes}` : ''}

IMPORTANT RULES:
- All prices MUST be in GBP (£). Never use USD.
- Be realistic and honest. If the watch is common and affordable, say so. If it's highly sought after, explain why.
- Base your valuation on actual market prices, not aspirational pricing.
- Only include platforms where this SPECIFIC brand and model is genuinely sold.

Available platform keys for buying/selling this watch:
- "chrono24" — pre-owned and grey market, all brands
- "watchfinder" — pre-owned luxury (Rolex, Omega, TAG, Breitling, IWC etc)
- "watchenclave" — pre-owned mid to high-end
- "zeitauktion" — pre-owned European auction, mid to high-end
- "ebay" — pre-owned all price points, vintage, grey market
- "amazon" — new watches, mainstream brands ONLY (Seiko, Citizen, Casio, Orient, Tissot, Hamilton)
- "goldsmiths" — new, authorised dealer (TAG, Longines, Omega, Breitling, Tudor, Gucci)
- "beaverbrooks" — new, authorised dealer (Seiko, Citizen, TAG, Tissot, Frederique Constant)
- "chisholmhunter" — new, authorised dealer (mid to luxury, Scotland-based)
- "thbaker" — new, authorised dealer (mid range UK)
- "houseofwatches" — new and pre-owned, wide range
- "cwsellors" — new, mid range UK (Seiko, Citizen, Tissot, Hamilton, Rotary)
- "fhinds" — new, budget to mid range UK ONLY (Seiko, Citizen, Casio, Rotary, Lorus)
- "citizen" — new Citizen brand watches only

Return ONLY a raw JSON object with these fields:

- "watch_name": string (full identified name e.g. "Rolex Submariner Date 126610LN")
- "value_low": number (low estimate in GBP, no currency symbol)
- "value_mid": number (mid estimate in GBP)
- "value_high": number (high estimate in GBP)
- "retail_price": string (approximate new retail price with £ symbol, or "Discontinued" if no longer made)
- "retail_price_number": number or null (retail price as a number for calculation, null if discontinued or unknown)
- "value_retention_pct": number or null (percentage of retail price the watch currently retains, e.g. 92 for 92%. null if retail unknown or discontinued and no meaningful comparison)

- "price_2_years_ago": number or null (approximate market value of this model 2 years ago in GBP, null if unknown or too new)
- "price_change_pct": number or null (percentage change over the last 2 years, e.g. 15 for +15%, -8 for -8%. null if unknown)
- "price_history_note": string (2-3 sentences describing how this model's price has moved over the past 2-3 years and why. Be specific about the direction and any notable events that affected pricing.)

- "verdict": "BUY" | "HOLD" | "SELL" (based on current market position relative to historical pricing)
- "verdict_reason": string (2-3 sentences explaining the buy/sell/hold recommendation in a warm, expert tone)

- "suggested_listing_price": number or null (if you'd recommend selling, what should they list it at? Factor in the described condition. null if verdict is BUY or HOLD)
- "listing_price_note": string or null (1 sentence explaining the listing price recommendation, e.g. "List slightly above mid-market to leave room for negotiation." null if not applicable)

- "comparable_sales": array of 2-3 objects, each with:
  - "description": string (e.g. "Excellent condition, full set, 2021")
  - "price": number (sale price in GBP)
  - "source": string (e.g. "Chrono24", "Auction", "Dealer")
(These should be realistic recent comparable sales for this model. Make them varied in condition and source.)

- "condition_grade": "Mint" | "Excellent" | "Very Good" | "Good" | "Fair"
- "condition_notes": string (1-2 sentences on how condition affects this specific valuation)
- "model_history": string (2-3 sentences about the model's history, desirability, and collectability)
- "market_trend": "rising" | "stable" | "falling"
- "market_trend_note": string (1 sentence on recent price movement)
- "platforms_buy": array of platform keys where someone could BUY this watch
- "platforms_sell": array of platform keys where someone could SELL this watch
- "confidence": "high" | "medium" | "low"
- "confidence_note": string (1 sentence explaining confidence level)

No markdown, no code blocks. Start with { end with }.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { brand, model, reference, condition, notes } = body || {};

  if (!brand || !model) return res.status(400).json({ error: 'Brand and model are required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const prompt = buildValuationPrompt({ brand, model, reference, condition: condition || 'Unknown', notes });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
      }),
    });

    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'Gemini API error', details: data });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'No text from Gemini' });

    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return res.status(500).json({ error: 'No JSON object found', raw: text });

    const valuation = JSON.parse(clean.slice(start, end + 1));

    // Build affiliate links for buy and sell platforms
    const watchName = valuation.watch_name || `${brand} ${model}`;
    valuation.buy_links = (valuation.platforms_buy || [])
      .map(p => buildLink(p, watchName))
      .filter(Boolean);
    valuation.sell_links = (valuation.platforms_sell || [])
      .map(p => buildLink(p, watchName))
      .filter(Boolean);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ valuation });

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
