import React, { useState, useEffect, useRef } from 'react';
import { redirectToLogin } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { getAIResponse, getRemainingRequests } from '@/services/aiService';
import { getDailyUsage } from '@/services/aiUsageService';
import { 
  getOrCreateAIConversation, 
  listAIMessages, 
  createAIMessage,
  subscribeToAIMessages 
} from '@/services/aiConversationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Bot, User, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function AIBot() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const { user, userData } = useAuth();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState(null);
  const [dailyUsage, setDailyUsage] = useState(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  
  const userEmail = userData?.email || user?.email;
  const DAILY_LIMIT = 20; // Daily request limit

  // Бэлэн хариултууд
  const quickAnswers = {
    'Зар хэрхэн оруулах вэ?': `Зар оруулах заавар:

1. **Апп-ыг нээгээд** нүүр хуудас руу орох
2. **"Зар нэмэх"** товчийг дарж шинэ зар үүсгэх
3. **Категори-г сонгоно уу** (жишээ: Автомашин, Орон сууц, Ажлын байр гэх мэт)
4. **Зарын мэдээлэл-ийг бөглөж, зураг оруулах**
5. **"Хадгалах" эсвэл "Танилцуулах"** товчийг дарж зар оруулах

Зар оруулсны дараа админ баталгаажуулаад идэвхтэй болно.`,

    'VIP зар гэж юу вэ?': `VIP зар гэдэг нь:

**VIP заруудын онцлог:**
- Зар жагсаалтын дээд талд онцолж харагдана
- Илүү их харагдах боломжтой
- Хайлтын үр дүнд эхэлж харагдана
- Онцгой тэмдэглэгээтэй байна

**VIP зар болгох:**
- Зар оруулсны дараа "VIP болгох" товчийг дарах
- VIP зар нь тодорхой хугацааны турш идэвхтэй байна
- VIP зарууд илүү их анхаарал татаж, борлуулалт хурдан болдог`,

    'Мессеж хэрхэн илгээх вэ?': `Мессеж илгээх заавар:

**Зар эзэмшлийн мессеж илгээх:**
1. Зар дээр ороод **"Мессеж илгээх"** товчийг дарна
2. Мессежийн агуулга бичнэ
3. **"Илгээх"** товчийг дарна

**Админтай мессеж илгээх:**
1. **"Мессеж"** хуудас руу орох
2. **"Админтай мессеж"** товчийг дарна
3. Мессеж бичээд илгээнэ

**Мессеж унших:**
- "Мессеж" хуудас дээр бүх ярилцлагууд харагдана
- Шинэ мессеж ирсэн бол тоогоор мэдэгдэнэ`,

    'Категориуд юу байна?': `Koreazar апп-д дараах категориуд байна:

**Үндсэн категориуд:**
1. **Автомашин** - Машин, мотоцикл, эд анги
2. **Орон сууц** - Байр, оффис, газар
3. **Ажлын байр** - Ажлын байр, ажил олох
4. **Бараа** - Гоёл чимэглэл, хувцас, бусад бараа
5. **Үйлчилгээ** - Бизнес, үйлчилгээний зар

**Категори сонгох:**
- Нүүр хуудас дээр категориуд харагдана
- Категори дээр дарж тухайн категорийн заруудыг харах
- Зар оруулахдаа категори сонгох шаардлагатай`
  };

  useEffect(() => {
    if (!user && !userData) {
      redirectToLogin(window.location.href);
    }
  }, [user, userData]);

  // Get or create conversation
  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['aiConversation', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const conv = await getOrCreateAIConversation(userEmail);
      setConversationId(conv.id);
      return conv;
    },
    enabled: !!userEmail
  });

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        setIsLoadingMessages(false);
        return;
      }

      try {
        setIsLoadingMessages(true);
        const msgs = await listAIMessages(conversationId);
        setMessages(msgs);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Real-time listener for messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToAIMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load usage information
  useEffect(() => {
    const loadUsage = async () => {
      if (!userEmail) return;
      
      try {
        const remaining = await getRemainingRequests(userEmail, DAILY_LIMIT);
        const usage = await getDailyUsage(userEmail);
        setRemainingRequests(remaining);
        setDailyUsage(usage);
        
        // Check if limit exceeded
        if (remaining === 0) {
          setLimitExceeded(true);
          setShowLimitDialog(true);
        } else {
          setLimitExceeded(false);
        }
      } catch (error) {
        // Silently handle permission errors - use default values
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          setRemainingRequests(DAILY_LIMIT);
          setLimitExceeded(false);
          return;
        }
        console.error('Error loading usage:', error);
        setRemainingRequests(DAILY_LIMIT);
        setLimitExceeded(false);
      }
    };
    
    loadUsage();
  }, [userEmail]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage) => {
      if (!conversationId || !userEmail) {
        throw new Error('Conversation not initialized');
      }

      // Save user message
      await createAIMessage({
        conversation_id: conversationId,
        sender: 'user',
        message: userMessage,
        user_email: userEmail
      });

      // Check if limit exceeded before processing
      if (limitExceeded || remainingRequests === 0) {
        setShowLimitDialog(true);
        throw new Error('Daily limit exceeded');
      }

      // Check if question is about admin or system
      const adminKeywords = ['админ', 'админий', 'админтай', 'админ руу', 'админ-с', 'систем', 'апп', 'тохиргоо', 'алдаа', 'бүртгэл', 'нэвтрэх', 'бүртгүүлэх'];
      const isAdminQuestion = adminKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword.toLowerCase())
      );

      // Check if there's a quick answer
      let aiResponse;
      const isQuickAnswer = quickAnswers[userMessage];
      
      if (isQuickAnswer) {
        // Use quick answer - no API call needed, no usage tracking
        aiResponse = isQuickAnswer;
      } else if (isAdminQuestion) {
        // Admin or system related questions - direct answer
        aiResponse = 'Энэ асуудлын талаар **АДМИН-с мессеж-р асуугаарай**. Админ танд туслах болно.';
      } else {
        // Get conversation history for context
        const history = messages.slice(-10).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message
        }));

        // Get AI response from API
        const result = await getAIResponse(userMessage, history, userEmail, DAILY_LIMIT);
        aiResponse = typeof result === 'string' ? result : result.response;

        // Refresh usage information only if API was called
        if (userEmail) {
          try {
            const remaining = await getRemainingRequests(userEmail, DAILY_LIMIT);
            const usage = await getDailyUsage(userEmail);
            setRemainingRequests(remaining);
            setDailyUsage(usage);
            
            // Check if limit exceeded after API call
            if (remaining === 0) {
              setLimitExceeded(true);
              setShowLimitDialog(true);
            }
          } catch (error) {
            // Silently handle permission errors
            if (error.code === 'permission-denied' || error.message?.includes('permission')) {
              setRemainingRequests(DAILY_LIMIT);
              return;
            }
            console.error('Error refreshing usage:', error);
          }
        }
      }

      // Save AI response
      await createAIMessage({
        conversation_id: conversationId,
        sender: 'assistant',
        message: aiResponse,
        user_email: userEmail
      });

      return aiResponse;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['aiConversation', userEmail]);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      // If API key is not configured, show special error
      if (error.message?.includes('OpenAI API key is not configured') || error.message?.includes('API key')) {
        setApiKeyError(true);
        return;
      }
      // If limit exceeded, show dialog instead of alert
      if (error.message?.includes('limit') || error.message?.includes('лимит') || error.message?.includes('хязгаар')) {
        setShowLimitDialog(true);
        setLimitExceeded(true);
      } else {
        alert(error.message || 'Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
      }
    }
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync(message.trim());
    } catch (error) {
      // Error already handled in mutation
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Home">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-10 h-10 bg-amber-100 hover:bg-amber-200"
              >
                <HelpCircle className="h-5 w-5 text-amber-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Санал болгосон асуултууд</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {[
                  'Зар хэрхэн оруулах вэ?',
                  'VIP зар гэж юу вэ?',
                  'Мессеж хэрхэн илгээх вэ?',
                  'Категориуд юу байна?'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setMessage(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">AI Туслах</h1>
              <p className="text-sm text-gray-500">Апп-н талаар асуух</p>
            </div>
            {remainingRequests !== null && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Өдрийг сайхан өнгөрүүлээрэй</p>
                <p className={`text-sm font-semibold ${remainingRequests === 0 ? 'text-red-600' : remainingRequests < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {remainingRequests} / {DAILY_LIMIT}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4 min-h-[calc(100vh-200px)]">
          {isLoadingMessages ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Сайн байна уу! 👋
              </h2>
              <p className="text-gray-600">
                Би танд Koreazar апп-н талаар туслах бэлэн байна.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isUser
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-amber-200 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                    {msg.created_date && (
                      <span className="text-xs text-gray-500 px-2">
                        {format(msg.created_date, 'HH:mm', { locale: mn })}
                      </span>
                    )}
                  </div>
                  {isUser && (
                    <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="max-w-4xl mx-auto px-4 pb-6 sticky bottom-0 bg-gradient-to-br from-amber-50 to-orange-50 pt-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => !limitExceeded && setMessage(e.target.value)}
            placeholder={limitExceeded ? "Өдрийн лимит дууссан" : "Асуулт асуух..."}
            className="min-h-[60px] max-h-[120px] resize-none bg-white border-amber-200 focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !limitExceeded) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            disabled={isSending || !conversationId || limitExceeded}
          />
          <Button
            type="submit"
            disabled={!message.trim() || isSending || !conversationId || limitExceeded}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>

      {/* API Key Error Dialog */}
      <Dialog open={apiKeyError} onOpenChange={setApiKeyError}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              ⚠️ Тохиргооны алдаа
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p className="text-gray-700 mb-4">
                OpenAI API key тохируулагдаагүй байна. Энэ нь техникийн асуудал бөгөөд админ шийдэх ёстой.
              </p>
              <p className="text-gray-600 mb-2">
                Хэрэв танд асуулт байвал <span className="font-semibold text-blue-600">АДМИН-с мессеж-р асуугаарай</span>.
              </p>
              <p className="text-sm text-gray-500">
                Админ энэ асуудлыг шийдэх болно.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                setApiKeyError(false);
                window.location.href = '/Home';
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Нүүр хуудас руу буцах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limit Exceeded Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={(open) => {
        // Prevent closing by clicking outside - force navigation
        if (!open) {
          window.location.href = '/Home';
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-600">
              ✅ Бүх асуултуудын хариулт авлаа
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p className="text-gray-700 mb-4">
                Та өнөөдөр <span className="font-bold text-amber-600">{DAILY_LIMIT} асуулт</span> асууж, бүх хариулт авсан байна.
              </p>
              <p className="text-gray-600 mb-2">
                Хэрэв та нэмж тодруулах зүйл байвал <span className="font-semibold text-blue-600">АДМИН-с мессеж-р асуугаарай</span>.
              </p>
              <p className="text-sm text-gray-500">
                Дараа өдөр дахин ашиглах боломжтой.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowLimitDialog(false);
                window.location.href = '/Home';
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Нүүр хуудас руу буцах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

