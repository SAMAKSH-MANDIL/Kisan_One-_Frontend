// Lightweight Gemini API client for text chat
// Expects an API key provided via EXPO_PUBLIC_GEMINI_API_KEY or setGeminiApiKey

let API_KEY = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_GEMINI_API_KEY) ? process.env.EXPO_PUBLIC_GEMINI_API_KEY : '';

export const setGeminiApiKey = (key) => {
  API_KEY = key || '';
};

// messages: Array<{ role: 'user' | 'model', text: string }>
export async function generateGeminiReply(messages) {
  if (!API_KEY) {
    throw new Error('Gemini API key is missing. Set EXPO_PUBLIC_GEMINI_API_KEY or call setGeminiApiKey().');
  }

  const contents = (messages || []).map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text || '') }],
  }));

  // Use a supported model for v1beta API
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  const res = await fetch(`${endpoint}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini request failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  // Extract first candidate text
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
  return text;
}


