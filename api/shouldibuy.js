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

function buildShouldIBuyPrompt({ watch_description, asking_price, seller_description, platform_source }) {
  return `You are a world-class watch buying advisor and fraud detection expert. A buyer is considering purchasing a watch and wants your honest assessment before they commit.

Here is the listing they are considering:

- Watch description: ${watch_description}
${asking_price ? `- Asking price: ${asking_price}` : '- Asking price: not specified'}
${seller_description ? `- Seller / listing details: ${seller_description}` : ''}
${platform_source ? `- Where they found it: ${platform_source}` : ''}

Your job is to:
1. Identify the exact watch being described (brand, model, reference if possible)
2. Assess whether the asking price is fair compared to current market values
3. Flag any red flags in the description, seller, or pricing
4. Give a clear verdict
5. Suggest better alternatives at the same price point if relevant

Available platform keys for alternative recommendations:
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

- "identified_watch": string (your best identification e.g. "Omega Speedmaster Professional 311.30.42.30.01.005")
- "verdict": "BUY" | "PROCEED WITH CAUTION" | "AVOID" (your overall recommendation)
- "verdict_summary": string (1 sentence headline verdict)
- "verdict_detail": string (2-3 sentences expanding on the verdict)

- "price_assessment": "great_deal" | "fair" | "slightly_high" | "overpriced" | "cannot_assess"
- "market_value_low": number or null (low market estimate in GBP if you can assess)
- "market_value_high": number or null (high market estimate in GBP if you can assess)
- "price_commentary": string (2-3 sentences on whether the price is fair and why)

- "red_flags": array of objects, each with:
  - "flag": string (short title e.g. "Price below market average")
  - "severity": "high" | "medium" | "low"
  - "detail": string (1-2 sentence explanation)
(return empty array if no red flags found)

- "green_flags": array of objects, each with:
  - "flag": string (short title e.g. "Box and papers included")
  - "detail": string (1 sentence)
(return empty array if none)

- "questions_to_ask": array of strings (3-5 specific questions the buyer should ask the seller before purchasing)

- "alternatives": array of up to 2 objects, each with:
  - "name": string (watch name)
  - "price": string (approximate price)
  - "reason": string (1-2 sentences on why it's a good alternative)
  - "platforms": array of platform keys where this alternative can be found
(return empty array if the listing watch is the best option)

- "confidence": "high" | "medium" | "low"
- "confidence_note": string (1 sentence explaining confidence)

Be direct and honest. If something looks dodgy, say so clearly. If it's a great deal, say that too. The buyer is trusting you to protect them.

No markdown, no code blocks. Start with { end with }.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { watch_description, asking_price, seller_description, platform_source } = body || {};

  if (!watch_description) return res.status(400).json({ error: 'Watch description is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const prompt = buildShouldIBuyPrompt({ watch_description, asking_price, seller_description, platform_source });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 6144 },
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

    const analysis = JSON.parse(clean.slice(start, end + 1));

    // Build affiliate links for alternatives
    if (analysis.alternatives) {
      analysis.alternatives = analysis.alternatives.map(alt => ({
        ...alt,
        buy_links: (alt.platforms || [])
          .map(p => buildLink(p, alt.name))
          .filter(Boolean),
      }));
    }

    // Build links for the identified watch itself
    const watchName = analysis.identified_watch || watch_description;
    analysis.search_links = [
      buildLink('chrono24', watchName),
      buildLink('ebay', watchName),
      buildLink('watchfinder', watchName),
    ].filter(Boolean);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ analysis });

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
