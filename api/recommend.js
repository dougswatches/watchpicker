export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
 
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
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set' });
  }
 
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
 
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
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
 
    if (!text) {
      return res.status(500).json({
        error: 'No text returned from Gemini',
        raw: data,
      });
    }
 
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
