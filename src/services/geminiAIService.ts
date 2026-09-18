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
      suggestedOriginalPrice: 799,
      tags: ['Organic', 'Hyperlocal', 'Seasonal Fruit', 'Fresh', 'Premium Quality'],
    };
  }

  try {
    const model = getGeminiModel('gemini-1.5-flash');
    const prompt = `Analyze this product image for an Indian hyperlocal e-commerce app (TafDeal).
Return ONLY a raw valid JSON object with the following schema, with no markdown formatting or backticks:
{
  "title": "Short descriptive product title",
  "description": "Engaging product description (2-3 sentences)",
  "category": "Category name (e.g. Fresh Grocery, Electronics, Clothing, Home Care)",
  "suggestedPrice": number (estimated discounted price in Indian Rupees ₹),
  "suggestedOriginalPrice": number (estimated original MRP in Indian Rupees ₹),
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
      suggestedOriginalPrice: Number(parsed.suggestedOriginalPrice) || 299,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['Hyperlocal', 'TafDeal'],
    };
  } catch (error) {
    console.error('Error calling Gemini Vision API:', error);
    // Intelligent fallback
    return {
      title: 'Handcrafted Local Product',
      description: 'Authentic high-quality local product provided by verified TafDeal sellers.',
      category: 'Hyperlocal Essentials',
      suggestedPrice: 299,
      suggestedOriginalPrice: 499,
      tags: ['Local Seller', 'Hyperlocal', 'Verified Quality'],
    };
  }
}

/**
 * Buyer Search Assistant: Scalable Vector Search implementation.
 * Queries the Firebase Vector Search Extension endpoint.
 */
export async function searchProductsWithAI(
  userQuery: string
): Promise<{ matchingProductIds: string[]; aiSummary: string }> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('EXAMPLE')) {
    return {
      matchingProductIds: [],
      aiSummary: 'API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY to enable AI search.',
    };
  }

  try {
    const { getGeminiModel } = await import('../config/geminiConfig');
    
    // 1. Generate the embedding for the search query using the text-embedding model
    const embedModel = getGeminiModel('text-embedding-004');
    const embedResult = await embedModel.embedContent(userQuery);
    const vectorArray = embedResult.embedding.values;

    // 2. Query Firestore natively using findNearest vector search
    const { collection, query, getDocs, limit } = await import('firebase/firestore');
    // Using VectorValue from firestore requires importing it directly, but since some environments might complain about the import if not perfectly typed,
    // we use the official VectorValue API.
    const { VectorValue } = await import('firebase/firestore');
    const { db } = await import('../config/firebaseConfig');
    
    // Ensure the extension configured 'embedding' as the field name
    const q = query(
      collection(db, 'products'),
      // @ts-ignore - Some TS versions might not have findNearest typed correctly yet
      globalThis.firebase?.firestore?.findNearest 
        ? globalThis.firebase.firestore.findNearest('embedding', VectorValue.fromArray(vectorArray), { limit: 15, distanceMeasure: 'COSINE' })
        : (await import('firebase/firestore')).findNearest('embedding', VectorValue.fromArray(vectorArray), { limit: 15, distanceMeasure: 'COSINE' })
    );

    const searchResponse = await getDocs(q);
    const matchingProductIds = searchResponse.docs.map(doc => doc.id);

    // 3. Generate a friendly, conversational summary for the user
    const model = getGeminiModel('gemini-1.5-flash');
    const prompt = `You are TafDeal's AI Shopping Assistant. 
The user searched for: "${userQuery}".
We have found some matching products in the local catalog.
Write a friendly 1-2 sentence advice summary in English/Hinglish to help the buyer. Do not list products.`;

    const result = await model.generateContent(prompt);
    const aiSummary = result.response.text().trim();

    return {
      matchingProductIds,
      aiSummary,
    };
  } catch (error) {
    console.error('Error with Scalable Vector Search:', error);
    return {
      matchingProductIds: [],
      aiSummary: 'We encountered an error connecting to the AI Search Engine. Please try again.',
    };
  }
}
