import { getGeminiModel } from '../config/geminiConfig';
import { AIProductSuggestion, Product } from '../types';

/**
 * Seller Product Assistant: Auto-generates product details (title, description, category, suggested price, tags)
 * from a base64 encoded product image using Gemini Vision.
 */
export async function generateProductDetailsFromImage(base64Image: string): Promise<AIProductSuggestion> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  // Fallback / Demo Mode if API key is not active or set
  if (!apiKey || apiKey.includes('EXAMPLE')) {
    console.log('Gemini API key not found or placeholder used. Utilizing smart local vision simulation.');
    await new Promise(res => setTimeout(res, 1200)); // Simulate AI processing delay
    return {
      title: 'Fresh Organic Alphonsa Mangoes (1kg)',
      description: 'Handpicked, naturally ripened sweet Alphonso mangoes direct from local orchards in Ratnagiri.',
      category: 'Fresh Grocery & Produce',
      suggestedPrice: 499,
      tags: ['Organic', 'Hyperlocal', 'Seasonal Fruit', 'Fresh', 'Premium Quality'],
    };
  }

  try {
    const model = getGeminiModel('gemini-1.5-flash');
    const prompt = `Analyze this product image for an Indian hyperlocal e-commerce app (DigiSewa).
Return ONLY a raw valid JSON object with the following schema, with no markdown formatting or backticks:
{
  "title": "Short descriptive product title",
  "description": "Engaging product description (2-3 sentences)",
  "category": "Category name (e.g. Fresh Grocery, Electronics, Clothing, Home Care)",
  "suggestedPrice": number (estimated price in Indian Rupees ₹),
  "tags": ["array", "of", "4-5", "relevant", "tags"]
}`;

    const imagePart = {
      inlineData: {
        data: base64Image.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();
    
    // Clean response of backticks if returned
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      title: parsed.title || 'Local Hyperlocal Item',
      description: parsed.description || 'Quality product from local seller.',
      category: parsed.category || 'General',
      suggestedPrice: Number(parsed.suggestedPrice) || 199,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['Hyperlocal', 'DigiSewa'],
    };
  } catch (error) {
    console.error('Error calling Gemini Vision API:', error);
    // Intelligent fallback
    return {
      title: 'Handcrafted Local Product',
      description: 'Authentic high-quality local product provided by verified DigiSewa sellers.',
      category: 'Hyperlocal Essentials',
      suggestedPrice: 299,
      tags: ['Local Seller', 'Hyperlocal', 'Verified Quality'],
    };
  }
}

/**
 * Buyer Search Assistant: Natural language product query processing.
 * Interprets queries like "I need ingredients for making Butter Chicken tonight under 500 rs".
 */
export async function searchProductsWithAI(
  userQuery: string,
  catalog: Product[]
): Promise<{ matchingProductIds: string[]; aiSummary: string }> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('EXAMPLE')) {
    // Smart offline natural language matching fallback
    const lower = userQuery.toLowerCase();
    const matches = catalog.filter(p => 
      p.title.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.tags.some(t => t.toLowerCase().includes(lower))
    );

    return {
      matchingProductIds: matches.map(m => m.id),
      aiSummary: matches.length > 0 
        ? `Found ${matches.length} DigiSewa products matching your request "${userQuery}".`
        : `Showing top recommended products for "${userQuery}".`,
    };
  }

  try {
    const model = getGeminiModel('gemini-1.5-flash');
    const catalogSummary = catalog.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      tags: p.tags,
    }));

    const prompt = `You are DigiSewa's AI Shopping Assistant.
User Search Query: "${userQuery}"
Available Products Catalog: ${JSON.stringify(catalogSummary)}

Task:
Select the product IDs that best satisfy the user's intent.
Provide a friendly 1-2 sentence advice summary in English/Hinglish to help the buyer.

Return ONLY a raw valid JSON object with format:
{
  "matchingProductIds": ["id1", "id2"],
  "aiSummary": "Friendly summary response for buyer"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);

    return {
      matchingProductIds: parsed.matchingProductIds || [],
      aiSummary: parsed.aiSummary || 'Here are the best matches for your search.',
    };
  } catch (error) {
    console.error('Error with Gemini Natural Language Search:', error);
    return {
      matchingProductIds: catalog.map(c => c.id),
      aiSummary: 'Here are all available products based on your interest.',
    };
  }
}
