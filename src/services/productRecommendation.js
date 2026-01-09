// Product Recommendation Service using Gemini AI
// Similar to LangChain approach but adapted for Gemini API

import { generateGeminiReply } from './gemini';

/**
 * Get AI-powered product recommendations based on user context
 * @param {Array} allProducts - All available products
 * @param {string} userQuery - User search query or context (optional)
 * @param {Array} userOrders - User's previous orders (optional)
 * @param {Array} recentSearches - User's recent searches (optional)
 * @param {number} numRecommendations - Number of recommendations to return (default: 3)
 * @returns {Promise<Array>} Array of recommended product objects
 */
export async function getAIProductRecommendations({
  allProducts = [],
  userQuery = '',
  userOrders = [],
  recentSearches = [],
  numRecommendations = 3,
}) {
  try {
    // Validate inputs
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
      console.warn('No products available for recommendations');
      return [];
    }

    // Build user context
    let contextParts = [];
    
    if (userQuery && userQuery.trim()) {
      contextParts.push(`User searched for: "${userQuery.trim()}"`);
    }
    
    if (Array.isArray(userOrders) && userOrders.length > 0) {
      const orderNames = userOrders
        .filter(item => item && item.name)
        .map(item => item.name)
        .slice(0, 5); // Limit to recent 5 orders
      if (orderNames.length > 0) {
        contextParts.push(`User previously ordered: ${orderNames.join(', ')}`);
      }
    }
    
    if (Array.isArray(recentSearches) && recentSearches.length > 0) {
      const searches = recentSearches
        .filter(s => s && typeof s === 'string')
        .slice(0, 5); // Limit to recent 5 searches
      if (searches.length > 0) {
        contextParts.push(`User recently searched for: ${searches.join(', ')}`);
      }
    }

    // If no context, use general recommendation
    const userContext = contextParts.length > 0 
      ? contextParts.join('\n')
      : 'User is browsing products and needs general recommendations';

    // Build product list for AI
    const productList = allProducts
      .filter(p => p && p.name && p.id)
      .map((p, idx) => {
        const productInfo = [
          `${idx + 1}. ${p.name}`,
          p.brand ? `   Brand: ${p.brand}` : '',
          p.category ? `   Category: ${p.category}` : '',
        ].filter(Boolean).join('\n');
        return productInfo;
      })
      .join('\n\n');

    // Create prompt similar to LangChain template
    const prompt = `You are a shopping assistant for Kisan One, an agricultural marketplace.

${userContext}

You must recommend EXACTLY ${numRecommendations} products from the product list below.
Do NOT add or invent any new product.
Only recommend products that exist in the list.

Available products:
${productList}

Instructions:
1. Analyze the user's context and needs
2. Select the ${numRecommendations} most relevant products from the list above
3. Return ONLY the product numbers (e.g., "1, 5, 12") separated by commas
4. Do NOT include any explanation, just the numbers

Format your response as: "1, 5, 12"`;

    // Call Gemini API
    const messages = [
      {
        role: 'user',
        text: prompt,
      },
    ];

    const response = await generateGeminiReply(messages);
    
    // Parse response to extract product numbers
    let recommendedProducts = [];
    const productNumbers = parseProductNumbers(response, allProducts.length);
    
    if (productNumbers.length > 0) {
      // Map product numbers to actual product objects
      recommendedProducts = productNumbers
        .map(num => {
          const idx = num - 1; // Convert to 0-based index
          return allProducts[idx];
        })
        .filter(p => p != null); // Remove any invalid products
    } else {
      // Fallback: try to match by product name if numbers weren't found
      recommendedProducts = matchProductsByName(response, allProducts, numRecommendations);
    }

    // If we got fewer recommendations than requested, fill with fallback
    if (recommendedProducts.length < numRecommendations) {
      const usedIds = new Set(recommendedProducts.map(p => p.id));
      const fallback = allProducts
        .filter(p => p && !usedIds.has(p.id))
        .slice(0, numRecommendations - recommendedProducts.length);
      recommendedProducts.push(...fallback);
    }

    return recommendedProducts.slice(0, numRecommendations);
  } catch (error) {
    console.error('Error getting AI product recommendations:', error);
    // Fallback: return first N products
    return allProducts.slice(0, numRecommendations);
  }
}

/**
 * Parse product numbers from AI response
 * @param {string} response - AI response text
 * @param {number} maxProducts - Maximum valid product number
 * @returns {Array<number>} Array of product numbers (1-based)
 */
function parseProductNumbers(response, maxProducts) {
  if (!response || typeof response !== 'string') {
    return [];
  }

  // Try to extract numbers from response
  // Look for patterns like "1, 5, 12" or "1,5,12" or "1 5 12"
  const numberPatterns = [
    /(\d+)[,\s]+(\d+)[,\s]+(\d+)/,  // "1, 5, 12" or "1,5,12" or "1 5 12"
    /(\d+)[,\s]+(\d+)/,              // "1, 5" or "1,5"
    /(\d+)/,                          // Single number
  ];

  for (const pattern of numberPatterns) {
    const matches = response.match(pattern);
    if (matches) {
      const numbers = matches
        .slice(1) // Skip full match
        .map(m => parseInt(m, 10))
        .filter(n => !isNaN(n) && n > 0 && n <= maxProducts);
      
      if (numbers.length > 0) {
        return numbers;
      }
    }
  }

  // Fallback: extract all numbers from response
  const allNumbers = response.match(/\d+/g);
  if (allNumbers) {
    return allNumbers
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n) && n > 0 && n <= maxProducts)
      .slice(0, 3); // Limit to 3
  }

  return [];
}

/**
 * Match products by name from AI response (fallback method)
 * @param {string} response - AI response text
 * @param {Array} allProducts - All available products
 * @param {number} numRecommendations - Number of recommendations needed
 * @returns {Array} Array of matched product objects
 */
function matchProductsByName(response, allProducts, numRecommendations) {
  if (!response || typeof response !== 'string' || !Array.isArray(allProducts)) {
    return [];
  }

  const matched = [];
  const responseLower = response.toLowerCase();
  
  // Try to find products by matching names in the response
  for (const product of allProducts) {
    if (matched.length >= numRecommendations) break;
    
    if (product && product.name) {
      const productNameLower = product.name.toLowerCase();
      // Check if product name appears in response
      if (responseLower.includes(productNameLower) || 
          productNameLower.split(' ').some(word => 
            word.length > 3 && responseLower.includes(word)
          )) {
        matched.push(product);
      }
    }
  }
  
  return matched;
}

/**
 * Get recommendations with caching to avoid excessive API calls
 */
let recommendationCache = {
  key: null,
  products: null,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedAIRecommendations({
  allProducts = [],
  userQuery = '',
  userOrders = [],
  recentSearches = [],
  numRecommendations = 3,
}) {
  // Create cache key from context
  const cacheKey = JSON.stringify({
    query: userQuery,
    orders: userOrders.slice(0, 3).map(o => o?.name).filter(Boolean),
    searches: recentSearches.slice(0, 3),
    productCount: allProducts.length,
  });

  // Check cache
  const now = Date.now();
  if (
    recommendationCache.key === cacheKey &&
    recommendationCache.products &&
    (now - recommendationCache.timestamp) < CACHE_DURATION
  ) {
    return recommendationCache.products;
  }

  // Get fresh recommendations
  const recommendations = await getAIProductRecommendations({
    allProducts,
    userQuery,
    userOrders,
    recentSearches,
    numRecommendations,
  });

  // Update cache
  recommendationCache = {
    key: cacheKey,
    products: recommendations,
    timestamp: now,
  };

  return recommendations;
}

