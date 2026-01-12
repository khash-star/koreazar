// AI Service - OpenAI API integration
import axios from 'axios';
import { recordAIUsage, checkDailyLimit } from './aiUsageService';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Default daily limits
const DEFAULT_DAILY_LIMIT = 20; // requests per day

/**
 * Get AI response from OpenAI
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @param {string} userEmail - User's email for usage tracking
 * @param {number} dailyLimit - Daily request limit (default: 50)
 * @returns {Promise<{response: string, usage?: Object}>} AI response and usage data
 */
export const getAIResponse = async (userMessage, conversationHistory = [], userEmail = null, dailyLimit = DEFAULT_DAILY_LIMIT) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // Check daily limit if userEmail is provided
  if (userEmail) {
    try {
      const limitCheck = await checkDailyLimit(userEmail, dailyLimit);
      if (limitCheck.exceeded) {
        throw new Error(`Өдрийн хязгаар хэтэрсэн байна. Та өнөөдөр ${limitCheck.usage.request_count} удаа ашигласан. Дараа өдөр дахин оролдоно уу.`);
      }
    } catch (error) {
      // If permission error, continue without limit check
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.warn('Could not check daily limit, continuing without limit check');
      } else {
        // Re-throw if it's a limit exceeded error
        throw error;
      }
    }
  }

  // System prompt - AI ботны үүрэг, зөвхөн зарын тухай хариулах
  const systemPrompt = `Та Koreazar апп-н туслах AI бот. Таны үүрэг бол хэрэглэгчдэд ЗАРЫН ТУХАЙ туслах явдал юм.

ЧУХАЛ ДҮРЭМ:
1. Зөвхөн ЗАРЫН ТУХАЙ асуултуудад хариулах
2. Системийн, аппын, техникийн асуултуудад хариулахгүй
3. Админтай холбоотой асуултуудад: "Энэ асуудлын талаар АДМИН-с мессеж-р асуугаарай" гэж хариулах
4. Аппын тохиргоо, системийн асуудлуудад: "Энэ асуудлын талаар АДМИН-с мессеж-р асуугаарай" гэж хариулах

ЗАРЫН ТУХАЙ МЭДЭЭЛЭЛ:
- Зар хэрхэн оруулах
- Зар хэрхэн хайх
- Зар хэрхэн хадгалах
- VIP зар гэж юу вэ
- Категориуд юу байна
- Зарны мэдээлэл, үнэ, байршил гэх мэт

ХАРИУЛТЫН ДҮРЭМ:
- Монгол хэл дээр байх ёстой
- Товч, тодорхой, хэрэгтэй байх ёстой
- Зөвхөн зарын тухай мэдээлэл өгөх
- Системийн, техникийн асуултуудад: "АДМИН-с мессеж-р асуугаарай"
- Админтай холбоотой асуултуудад: "АДМИН-с мессеж-р асуугаарай"`;

  try {
    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
        content: msg.content || msg.message
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini', // More cost-effective model
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || 'Уучлаарай, хариулт өгөхөд алдаа гарлаа.';
    
    // Record usage if userEmail is provided
    if (userEmail && response.data.usage) {
      try {
        await recordAIUsage(userEmail, {
          prompt_tokens: response.data.usage.prompt_tokens || 0,
          completion_tokens: response.data.usage.completion_tokens || 0,
          total_tokens: response.data.usage.total_tokens || 0
        });
      } catch (usageError) {
        console.error('Error recording usage:', usageError);
        // Don't fail the request if usage recording fails
      }
    }

    return {
      response: aiResponse,
      usage: response.data.usage || null
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('OpenAI API key буруу байна');
    } else if (error.response?.status === 429) {
      throw new Error('Хэт олон хүсэлт илгээсэн. Түр хүлээгээд дахин оролдоно уу.');
    } else if (error.response?.status === 500) {
      throw new Error('OpenAI сервер дээр алдаа гарлаа. Дахин оролдоно уу.');
    } else {
      throw new Error('AI хариулт авахад алдаа гарлаа. Дахин оролдоно уу.');
    }
  }
};

/**
 * Get user's remaining daily requests
 * @param {string} userEmail - User's email
 * @param {number} dailyLimit - Daily request limit (default: 50)
 * @returns {Promise<number>} Remaining requests
 */
export const getRemainingRequests = async (userEmail, dailyLimit = DEFAULT_DAILY_LIMIT) => {
  try {
    const limitCheck = await checkDailyLimit(userEmail, dailyLimit);
    return limitCheck.remaining;
  } catch (error) {
    console.error('Error getting remaining requests:', error);
    // Return full limit if can't check
    return dailyLimit;
  }
};

/**
 * Validate OpenAI API key
 * @returns {Promise<boolean>} True if API key is valid
 */
export const validateAPIKey = async () => {
  if (!OPENAI_API_KEY) {
    return false;
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Check listing with AI and get approval recommendation
 * @param {Object} listing - Listing object to check
 * @returns {Promise<{approved: boolean, reason: string, score: number, suggestions?: string[]}>} AI check result
 */
export const checkListingWithAI = async (listing) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // Prepare listing data for AI
  const listingData = {
    title: listing.title || '',
    description: listing.description || '',
    category: listing.category || '',
    subcategory: listing.subcategory || '',
    price: listing.price || 0,
    location: listing.location || '',
    condition: listing.condition || '',
    phone: listing.phone || '',
    hasImages: listing.images && listing.images.length > 0,
    imageCount: listing.images ? listing.images.length : 0
  };

  const systemPrompt = `Та Koreazar зарын сайтын админ туслах AI. Таны үүрэг бол заруудыг шалгаад батлах эсэхийг санал болгох явдал юм.

ЧУХАЛ: Та ЗӨВХӨН JSON формат дахь хариулт өгөх ёстой. Бусад текст бичэхгүй байх.

ШАЛГАХ ШАЛТГААНУУД:
1. Зарны гарчиг, тайлбар зөв, тодорхой эсэх
2. Үнэ зөв эсэх (0-ээс их байх ёстой)
3. Категори, байршил зөв эсэх
4. Холбоо барих мэдээлэл байгаа эсэх (phone, kakao_id, wechat_id гэх мэт)
5. Зураг байгаа эсэх (хүссэн, гэхдээ заавал биш)
6. Тайлбар хангалттай эсэх
7. Спам, хуурамч мэдээлэл эсэх

ХАРИУЛТЫН ФОРМАТ (ЗӨВХӨН JSON):
{
  "approved": true эсвэл false,
  "reason": "Шалтгаан (монгол хэлээр)",
  "score": 0-100 тоо (зарын чанарын оноо),
  "suggestions": ["санал 1", "санал 2"] эсвэл []
}

ДҮРЭМ:
- Зөв, бүрэн мэдээлэлтэй заруудыг батлах (approved: true)
- Хуурамч, спам заруудыг татгалзах (approved: false)
- Мэдээлэл дутуу байвал санал өгөх
- Монгол хэл дээр reason, suggestions бичих
- ЗӨВХӨН JSON формат дахь хариулт өгөх`;

  const userPrompt = `Дараах зарыг шалгаад батлах эсэхийг санал болгоно уу:

Гарчиг: ${listingData.title}
Тайлбар: ${listingData.description}
Категори: ${listingData.category}
Дэд категори: ${listingData.subcategory}
Үнэ: ${listingData.price}₩
Байршил: ${listingData.location}
Нөхцөл: ${listingData.condition}
Утас: ${listingData.phone || 'Байхгүй'}
Зураг: ${listingData.hasImages ? `${listingData.imageCount} зураг байна` : 'Зураг байхгүй'}

Зөвхөн JSON формат дахь хариулт өгнө үү.`;

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 500,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || '{}';
    
    try {
      const result = JSON.parse(aiResponse);
      return {
        approved: result.approved === true,
        reason: result.reason || 'Шалгалт хийгдсэн',
        score: result.score || 50,
        suggestions: result.suggestions || []
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: try to extract information from text response
      const lowerResponse = aiResponse.toLowerCase();
      const approved = lowerResponse.includes('батлах') || lowerResponse.includes('зөв') || lowerResponse.includes('approved');
      return {
        approved,
        reason: aiResponse.substring(0, 200) || 'AI шалгалт хийгдсэн',
        score: approved ? 75 : 40,
        suggestions: []
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('OpenAI API key буруу байна');
    } else if (error.response?.status === 429) {
      throw new Error('Хэт олон хүсэлт илгээсэн. Түр хүлээгээд дахин оролдоно уу.');
    } else if (error.response?.status === 500) {
      throw new Error('OpenAI сервер дээр алдаа гарлаа. Дахин оролдоно уу.');
    } else {
      throw new Error('AI шалгалт хийхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  }
};

