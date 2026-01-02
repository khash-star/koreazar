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

