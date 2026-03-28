export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
  },
};

function buildAuthPrompt({ brand, model, reference, details, seller_claims }) {
  return `You are a world-class watch authentication expert with decades of experience identifying counterfeit watches. A buyer wants your help checking whether a watch they are considering is likely genuine or fake.

Here is the watch in question:

- Brand: ${brand}
- Model: ${model}
${reference ? `- Reference number: ${reference}` : '- Reference number: not provided'}
${details ? `- What the buyer can see / describe: ${details}` : ''}
${seller_claims ? `- What the seller claims: ${seller_claims}` : ''}

Your job is to provide a detailed authentication guide specific to THIS exact watch reference. You must:

1. Identify the specific reference and what a genuine example should look like
2. List the known counterfeit tells for this specific model — things fakers commonly get wrong
3. Tell the buyer exactly what to check and what to look for
4. Flag any concerns based on what they've described or what the seller claims
5. Give an overall risk assessment

Return ONLY a raw JSON object with these fields:

- "identified_watch": string (your best identification e.g. "Rolex Submariner Date 126610LN")
- "production_years": string (e.g. "2020–present" or "2005–2010")
- "counterfeit_risk": "high" | "medium" | "low" (how commonly this specific reference is faked)
- "counterfeit_risk_note": string (1-2 sentences on how often this model is counterfeited and why)

- "verdict": "LIKELY GENUINE" | "INCONCLUSIVE" | "SUSPICIOUS" | "CANNOT ASSESS" (based on information provided — use CANNOT ASSESS if they haven't described enough for you to judge)
- "verdict_reason": string (2-3 sentences explaining your assessment based on the details provided)

- "dial_checks": array of objects, each with:
  - "check": string (what to look for, e.g. "Coronet printing quality")
  - "genuine_detail": string (what a genuine example looks like)
  - "fake_tell": string (what counterfeits typically get wrong)
(provide 3-5 checks specific to this model's dial)

- "case_checks": array of objects, same structure as dial_checks
(provide 3-5 checks for the case, caseback, crown, lugs)

- "movement_checks": array of objects, same structure
(provide 2-3 checks if the buyer can see or access the movement)

- "bracelet_checks": array of objects, same structure
(provide 2-3 checks for the bracelet/strap and clasp)

- "document_checks": array of objects, same structure
(provide 2-3 checks for box, papers, warranty card, serial numbers)

- "concerns_from_description": array of objects, each with:
  - "concern": string (what caught your attention)
  - "severity": "high" | "medium" | "low"
  - "explanation": string (1-2 sentences)
(based on what the buyer described or seller claims — return empty array if nothing concerning or not enough info)

- "next_steps": array of strings (3-5 specific actionable next steps, e.g. "Ask for a photo of the movement", "Request the serial number and check it against Rolex records", "Take it to an authorised service centre for inspection")

- "confidence": "high" | "medium" | "low" (how confident you are in your assessment)
- "confidence_note": string (1 sentence explaining confidence — low if limited info provided, high if enough details to assess)

Be thorough and specific to this exact reference. Generic advice is useless — the buyer needs to know exactly what dial font, crown guard shape, date magnification, rehaut engraving, or movement decoration to look for on THIS specific watch. If the brand and model are too vague or obscure for you to give reference-specific checks, say so clearly and give the best general guidance you can.

No markdown, no code blocks. Start with { end with }.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { brand, model, reference, details, seller_claims } = body || {};

  if (!brand || !model) return res.status(400).json({ error: 'Brand and model are required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const prompt = buildAuthPrompt({ brand, model, reference, details, seller_claims });
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
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

    const report = JSON.parse(clean.slice(start, end + 1));

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ report });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
