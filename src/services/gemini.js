// Lightweight Gemini API client for text chat
// Expects an API key provided via EXPO_PUBLIC_GEMINI_API_KEY or setGeminiApiKey

let API_KEY = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_GEMINI_API_KEY) 
  ? process.env.EXPO_PUBLIC_GEMINI_API_KEY.trim() 
  : '';

export const setGeminiApiKey = (key) => {
  if (key && typeof key === 'string') {
    API_KEY = key.trim();
  } else {
    API_KEY = '';
  }
};

// Export function to check if API key is set (for debugging)
export const hasApiKey = () => {
  return !!(API_KEY && API_KEY.length > 0);
};

// messages: Array<{ role: 'user' | 'model', text: string }>
export async function generateGeminiReply(messages) {
  // Check if API key is set
  if (!API_KEY || API_KEY.length === 0) {
    throw new Error('Gemini API key is missing. Set EXPO_PUBLIC_GEMINI_API_KEY or call setGeminiApiKey().');
  }

  // Validate messages
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required and must not be empty.');
  }

  // System instruction matching LangChain configuration for Kisan One
  const systemInstruction = {
    parts: [{ 
      text: `You are a helpful AI assistant that works for Kisan One app. Kisan One is an AI-powered, voice-first advisory and marketplace platform, connecting farmers and agri innovators both online and offline. Solve agricultural queries related to farming, crops, soil, fertilizers, and weather. Always respond politely and clearly in simple language. Try not to give the response in long paragraph instead give bullet points or numbered list wherever possible.`
    }]
  };

  const contents = messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text || '') }],
  }));

  // Try models in order: gemini-1.5-flash first (higher rate limits on free tier)
  const modelsToTry = [
    'gemini-1.5-flash',      // Fast model with higher free tier quotas - USE THIS FIRST
    'gemini-1.5-pro',        // Pro model (lower quotas)
    'gemini-2.0-flash-exp'   // Latest experimental model (if available)
  ];

  // Prepare request body with system instruction and generation config
  // Using lower max tokens to reduce quota usage and avoid rate limits
  const requestBody = {
    contents: contents,
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,  // Reduced from 2048 to use less quota
    },
  };

  let lastError = null;
  
  try {
    // Try each model until one works
    for (const modelName of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        
        const res = await fetch(`${endpoint}?key=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          
          // Handle rate limit errors (429) - stop trying other models immediately
          if (res.status === 429) {
            let errorMsg = 'Rate limit exceeded';
            try {
              const errorData = errText ? JSON.parse(errText) : null;
              if (errorData && errorData.error && errorData.error.message) {
                errorMsg = errorData.error.message;
              }
            } catch (_) {}
            throw new Error(`429 - ${errorMsg}`);
          }
          
          // If model not found (404), try next model
          if (res.status === 404) {
            lastError = new Error(`Model ${modelName} not found`);
            continue; // Try next model
          }
          
          // For other errors, throw immediately (don't try more models)
          let errorMsg = `Gemini request failed: ${res.status}`;
          try {
            const errorData = errText ? JSON.parse(errText) : null;
            if (errorData && errorData.error && errorData.error.message) {
              errorMsg = `${errorMsg} - ${errorData.error.message}`;
            } else if (errText) {
              errorMsg = `${errorMsg} - ${errText.substring(0, 200)}`;
            }
          } catch (_) {
            if (errText) {
              errorMsg = `${errorMsg} - ${errText.substring(0, 200)}`;
            }
          }
          throw new Error(errorMsg);
        }

        // Success - parse and return response
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
        return text;
        
      } catch (error) {
        // If it's a model not found error, try next model
        if (error.message && error.message.includes('not found') && modelsToTry.indexOf(modelName) < modelsToTry.length - 1) {
          lastError = error;
          continue;
        }
        // For network errors, wrap and re-throw
        if (error.message && !error.message.includes('Gemini')) {
          throw new Error(`Network error contacting Gemini: ${error.message}`);
        }
        // Otherwise, re-throw the error
        throw error;
      }
    }
    
    // If all models failed, throw the last error
    if (lastError) {
      throw lastError;
    }
    
    throw new Error('All model attempts failed');
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error.message && !error.message.includes('Gemini') && !error.message.includes('Network error')) {
      throw new Error(`Network error contacting Gemini: ${error.message}`);
    }
    throw error;
  }
}


