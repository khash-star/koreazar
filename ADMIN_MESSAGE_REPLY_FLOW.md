# Админий Ирсэн Мессеж Дээр Дарж Ороод Хариу Бичих Үйлдлийн Тайлбар

## 📋 Ерөнхий Тойм

Энэхүү тайлбар нь хэрэглэгч админий ирсэн мессеж дээр дарж Chat хуудас руу ороод хариу бичих бүх үйлдлийг дэлгэрэнгүй тайлбарлана.

---

## 🔄 Үйлдлийн Дараалал

### Алхам 1: Messages хуудас дээр Conversation дээр Дарах

**Файл:** `src/pages/Messages.jsx`

**Мөр:** 230-283

```230:283:src/pages/Messages.jsx
{filteredConversations.map((conv) => (
  <Link
    key={conv.id}
    to={createPageUrl(`Chat?conversationId=${conv.id}`)}
  >
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="bg-white rounded-xl p-4 hover:shadow-md transition-all"
    >
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {conv.otherUser.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {conv.otherUser.displayName || conv.otherUser.email}
            </h3>
            {(conv.last_message_time || conv.last_message_date) && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(conv.last_message_time || conv.last_message_date), { 
                  addSuffix: true,
                  locale: mn 
                })
                  .replace(/ойролцоогоор\s*/gi, '')
                  .replace(/өдрийн/gi, 'Ө')
                  .replace(/цагийн/gi, 'Ц')
                  .replace(/сарын/gi, 'С')}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate flex-1 min-w-0">
              {conv.last_message_sender === userEmail && (
                <span className="text-gray-500">Та: </span>
              )}
              <span className="truncate">
                {conv.last_message || 'Мессеж илгээх...'}
              </span>
            </p>
            {conv.unreadCount > 0 && (
              <span className="flex-shrink-0 ml-2 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
))}
```

**Ажиллах дараалал:**
1. Хэрэглэгч админий conversation card дээр дарах
2. `Link` component ажиллаж URL-ийг үүсгэнэ: `Chat?conversationId={conv.id}`
3. React Router URL-ийг өөрчилж Chat хуудас руу navigate хийх
4. `createPageUrl()` функц URL-ийг зөв форматлана

**Ашигласан функцүүд:**
- `createPageUrl()` - URL үүсгэх (`src/utils/index.ts`)
- `Link` - React Router navigation component
- `motion.div` - Framer Motion animation

---

### Алхам 2: Chat хуудас Mount Болох

**Файл:** `src/pages/Chat.jsx`

**Мөр:** 16-27

```16:27:src/pages/Chat.jsx
export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const otherUserEmail = urlParams.get('otherUserEmail');
  const listingId = urlParams.get('listingId');
  
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const { user, userData, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [actualConversationId, setActualConversationId] = useState(conversationId);
  const [adminEmail, setAdminEmail] = useState(null);
```

**Ажиллах дараалал:**
1. Chat component mount болно
2. URL parameters-ийг уншина:
   - `conversationId` - Conversation ID
   - `otherUserEmail` - Холбогдох хэрэглэгчийн имэйл (optional)
   - `listingId` - Зарны ID (optional)
3. State variables идэвхжүүлнэ:
   - `message` - Бичиж буй мессеж
   - `actualConversationId` - Conversation ID
   - `adminEmail` - Админий имэйл

**Ашигласан функцүүд:**
- `URLSearchParams` - URL query parameters унших
- `useState` - React state management
- `useRef` - DOM reference (scroll хийхэд)
- `useAuth` - Authentication context

---

### Алхам 3: Админий Имэйл Авах

**Файл:** `src/pages/Chat.jsx`

**Мөр:** 29-36

```29:36:src/pages/Chat.jsx
// Get admin email
useEffect(() => {
  const fetchAdminEmail = async () => {
    const email = await getAdminEmail();
    setAdminEmail(email);
  };
  fetchAdminEmail();
}, []);
```

**Ажиллах дараалал:**
1. Component mount болоход `useEffect` ажиллана
2. `getAdminEmail()` функц дуудагдана
3. Админий имэйл Firestore-оос татагдана
4. `setAdminEmail()` state-д хадгалагдана

**Ашигласан функцүүд:**
- `getAdminEmail()` - Админий имэйл авах (`src/services/authService.js`)

---

### Алхам 4: Мессежүүдийг Ачаалах

**Файл:** `src/pages/Chat.jsx`

**Мөр:** 96-104

```96:104:src/pages/Chat.jsx
const { data: messages = [], isLoading } = useQuery({
  queryKey: ['messages', actualConversationId],
  queryFn: () => entities.Message.filter(
    { conversation_id: actualConversationId },
    'created_date'
  ),
  enabled: !!actualConversationId,
  refetchInterval: 3000 // Refresh every 3 seconds
});
```

**Ажиллах дараалал:**
1. `actualConversationId` байвал `useQuery` ажиллана
2. `entities.Message.filter()` дуудагдана
3. Firestore-оос мессежүүдийг татана:
   - Query: `where('conversation_id', '==', actualConversationId)`
   - Order: `orderBy('created_date', 'desc')`
4. Мессежүүд `messages` array болж ирнэ
5. `refetchInterval: 3000` - 3 секунд тутамд автоматаар шинэчилнэ

**Ашигласан функцүүд:**
- `useQuery` - React Query data fetching
- `entities.Message.filter()` - Message entity filter (`src/api/entities.js`)
- `conversationService.listMessages()` - Firestore query (`src/services/conversationService.js`)

**Firestore Query:**
```javascript
// src/services/conversationService.js:181-204
const messagesRef = collection(db, 'messages');
const q = query(
  messagesRef,
  where('conversation_id', '==', conversationId),
  orderBy('created_date', 'desc'),
  limit(100)
);
```

---

### Алхам 5: Мессежүүдийг UI Дээр Харуулах

**Файл:** `src/pages/Chat.jsx`

**Мөр:** 310-358

```310:358:src/pages/Chat.jsx
{messages.length > 0 ? (
  <div className="space-y-4">
    {messages.map((msg, index) => {
      const email = userData?.email || user?.email;
      const isOwnMessage = msg.sender_email === email;
      const showDate = index === 0 || 
        format(new Date(messages[index - 1].created_date), 'yyyy-MM-dd') !== 
        format(new Date(msg.created_date), 'yyyy-MM-dd');
      
      return (
        <React.Fragment key={msg.id}>
          {showDate && (
            <div className="text-center my-4">
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {format(new Date(msg.created_date), 'yyyy оны MM сарын dd', { locale: mn })}
              </span>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                isOwnMessage
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              <p className={`text-xs mt-1 ${
                isOwnMessage ? 'text-amber-100' : 'text-gray-500'
              }`}>
                {format(new Date(msg.created_date), 'HH:mm')}
              </p>
            </div>
          </motion.div>
        </React.Fragment>
      );
    })}
    <div ref={messagesEndRef} />
  </div>
```

**Ажиллах дараалал:**
1. `messages` array-ийг map хийж мессеж бүрийг render хийх
2. `isOwnMessage` шалгах - өөрийн мессеж эсэхийг тодорхойлох
3. `showDate` шалгах - огноо харуулах эсэхийг тодорхойлох
4. Мессеж card render хийх:
   - Өөрийн мессеж: баруун талд, amber өнгөтэй
   - Админий мессеж: зүүн талд, цагаан өнгөтэй
5. `messagesEndRef` - Scroll доош чиглүүлэх

**Ашигласан функцүүд:**
- `format()` - Date форматлах (`date-fns`)
- `motion.div` - Framer Motion animation

---

### Алхам 6: Мессеж Бичих (Input)

**Файл:** `src/pages/Chat.jsx`

**Мөр:** 362-393

```362:393:src/pages/Chat.jsx
{/* Input */}
<div className="bg-white border-t border-gray-200 sticky bottom-0 md:bottom-0 pb-20 md:pb-3 z-30">
  <div className="max-w-4xl mx-auto px-4 py-3">
    <div className="flex gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Мессеж бичих..."
        className="flex-1 min-h-[44px] max-h-32 rounded-xl resize-none"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || sendMutation.isPending}
        className="h-11 w-11 rounded-xl bg-amber-500 hover:bg-amber-600 flex-shrink-0"
        size="icon"
      >
        {sendMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </Button>
    </div>
  </div>
</div>
```

**Ажиллах дараалал:**
1. Хэрэглэгч Textarea дээр мессеж бичнэ
2. `onChange` event ажиллаж `setMessage()` state шинэчилнэ
3. Enter дарах эсвэл Send товч дарах:
   - Enter + Shift: Шинэ мөр
   - Enter (Shiftгүй): Мессеж илгээх
4. `handleSend()` функц дуудагдана

**Ашигласан функцүүд:**
- `Textarea` - Input component (`@/components/ui/textarea`)
- `Button` - Button component (`@/components/ui/button`)
- `setMessage()` - State update

---

### Алхам 7: Мессеж Илгээх (handleSend)

**Файл:** `src/pages/Chat.jsx`

**Мөр:** 216-219

```216:219:src/pages/Chat.jsx
const handleSend = () => {
  if (!message.trim() || sendMutation.isPending) return;
  sendMutation.mutate(message);
};
```

**Ажиллах дараалал:**
1. Мессеж хоосон эсэхийг шалгах
2. `sendMutation.isPending` шалгах (аль хэдийн илгээж байгаа эсэх)
3. `sendMutation.mutate(message)` дуудагдана

**Ашигласан функцүүд:**
- `sendMutation.mutate()` - React Query mutation

---

### Алхам 8: Мессеж Firestore-д Хадгалах (sendMutation)

**Файл:** `src/pages/Chat.jsx`

**Мөр:** 182-214

```182:214:src/pages/Chat.jsx
const sendMutation = useMutation({
  mutationFn: async (messageText) => {
    const email = userData?.email || user?.email;
    if (!email || !actualConversationId || !otherUser?.email) return;
    
    // 1. Шинэ мессеж үүсгэх
    const newMessage = await entities.Message.create({
      conversation_id: actualConversationId,
      sender_email: email,
      receiver_email: otherUser.email,
      message: messageText,
      is_read: false
    });
    
    // 2. Conversation-ийг шинэчлэх (сүүлийн мессеж, unread count)
    const isParticipant1 = conversation.participant_1 === email;
    const otherUnreadCount = isParticipant1 ? conversation.unread_count_p2 : conversation.unread_count_p1;
    
    await entities.Conversation.update(actualConversationId, {
      last_message: messageText,
      last_message_time: new Date().toISOString(),
      last_message_sender: email,
      [isParticipant1 ? 'unread_count_p2' : 'unread_count_p1']: otherUnreadCount + 1
    });
    
    return newMessage;
  },
  onSuccess: () => {
    // 3. Cache шинэчлэх
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['conversation'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    setMessage('');
  }
});
```

**Ажиллах дараалал:**

#### 8.1. Мессеж Үүсгэх
1. `entities.Message.create()` дуудагдана
2. Firestore `messages` collection-д шинэ document үүсгэнэ:
   ```javascript
   {
     conversation_id: actualConversationId,
     sender_email: email, // Хэрэглэгчийн имэйл
     receiver_email: otherUser.email, // Админий имэйл
     message: messageText,
     is_read: false,
     created_date: Timestamp.now()
   }
   ```

**Ашигласан функцүүд:**
- `entities.Message.create()` → `conversationService.createMessage()` (`src/services/conversationService.js:206-228`)

#### 8.2. Conversation Шинэчлэх
1. `entities.Conversation.update()` дуудагдана
2. Firestore `conversations` collection-д update хийх:
   - `last_message` - Сүүлийн мессеж
   - `last_message_time` - Сүүлийн мессежийн цаг
   - `last_message_sender` - Сүүлийн мессеж илгээсэн хүн
   - `unread_count_p2` эсвэл `unread_count_p1` - Unread count нэмэгдэнэ

**Ашигласан функцүүд:**
- `entities.Conversation.update()` → `conversationService.updateConversation()` (`src/services/conversationService.js:114-122`)

#### 8.3. Cache Шинэчлэх
1. `queryClient.invalidateQueries()` дуудагдана
2. React Query cache шинэчлэгдэнэ:
   - `['messages']` - Мессежүүдийн cache
   - `['conversation']` - Conversation cache
   - `['conversations']` - Conversations list cache
3. Автоматаар refetch хийгдэнэ
4. `setMessage('')` - Input талбарыг хоослоно

**Ашигласан функцүүд:**
- `queryClient.invalidateQueries()` - React Query cache invalidation

---

## 📊 Функцүүдийн Холболтын Диаграм

```
User clicks on Admin conversation
    │
    ├─→ Link component (Messages.jsx:231-233)
    │       │
    │       └─→ Navigate to: Chat?conversationId={id}
    │
    ├─→ Chat.jsx component mounts
    │       │
    │       ├─→ useEffect: Get admin email (Chat.jsx:29-36)
    │       │       │
    │       │       └─→ getAdminEmail() (authService.js)
    │       │
    │       ├─→ useQuery: Load messages (Chat.jsx:96-104)
    │       │       │
    │       │       └─→ entities.Message.filter()
    │       │               │
    │       │               └─→ conversationService.listMessages()
    │       │                       │
    │       │                       └─→ Firestore: 'messages' collection
    │       │
    │       └─→ Render messages in UI (Chat.jsx:310-358)
    │
    ├─→ User types message in Textarea (Chat.jsx:366-378)
    │       │
    │       └─→ setMessage() state update
    │
    ├─→ User clicks Send or presses Enter (Chat.jsx:379-390)
    │       │
    │       └─→ handleSend() (Chat.jsx:216-219)
    │               │
    │               └─→ sendMutation.mutate() (Chat.jsx:218)
    │                       │
    │                       ├─→ mutationFn() (Chat.jsx:182-207)
    │                       │       │
    │                       │       ├─→ entities.Message.create() (Chat.jsx:187)
    │                       │       │       │
    │                       │       │       └─→ conversationService.createMessage()
    │                       │       │               │
    │                       │       │               └─→ Firestore: 'messages' collection
    │                       │       │
    │                       │       └─→ entities.Conversation.update() (Chat.jsx:199)
    │                       │               │
    │                       │               └─→ conversationService.updateConversation()
    │                       │                       │
    │                       │                       └─→ Firestore: 'conversations' collection
    │                       │
    │                       └─→ onSuccess() (Chat.jsx:208-213)
    │                               │
    │                               ├─→ queryClient.invalidateQueries()
    │                               │       │
    │                               │       └─→ Auto refetch messages & conversations
    │                               │
    │                               └─→ setMessage('')
    │
    └─→ UI Updates (React Query refetch)
            │
            └─→ New message appears in chat
```

---

## 🔍 Гол Функцүүдийн Дэлгэрэнгүй Тайлбар

### 1. `handleSend()` - Мессеж Илгээх

**Файл:** `src/pages/Chat.jsx:216-219`

```javascript
const handleSend = () => {
  if (!message.trim() || sendMutation.isPending) return;
  sendMutation.mutate(message);
};
```

**Параметрүүд:**
- `message` - State variable (бичиж буй мессеж)

**Ажиллах:**
1. Мессеж хоосон эсэхийг шалгах
2. Аль хэдийн илгээж байгаа эсэхийг шалгах
3. React Query mutation ажиллуулах

---

### 2. `sendMutation.mutationFn()` - Мессеж Хадгалах

**Файл:** `src/pages/Chat.jsx:182-207`

```javascript
mutationFn: async (messageText) => {
  const email = userData?.email || user?.email;
  if (!email || !actualConversationId || !otherUser?.email) return;
  
  // 1. Шинэ мессеж үүсгэх
  const newMessage = await entities.Message.create({
    conversation_id: actualConversationId,
    sender_email: email,
    receiver_email: otherUser.email,
    message: messageText,
    is_read: false
  });
  
  // 2. Conversation шинэчлэх
  const isParticipant1 = conversation.participant_1 === email;
  const otherUnreadCount = isParticipant1 ? conversation.unread_count_p2 : conversation.unread_count_p1;
  
  await entities.Conversation.update(actualConversationId, {
    last_message: messageText,
    last_message_time: new Date().toISOString(),
    last_message_sender: email,
    [isParticipant1 ? 'unread_count_p2' : 'unread_count_p1']: otherUnreadCount + 1
  });
  
  return newMessage;
}
```

**Параметрүүд:**
- `messageText` - Илгээх мессеж

**Буцаах утга:**
- `newMessage` - Үүсгэсэн мессеж object

**Ажиллах:**
1. Хэрэглэгчийн имэйл авах
2. Шинэ мессеж үүсгэх (Firestore)
3. Conversation шинэчлэх (last_message, unread_count)

---

### 3. `entities.Message.create()` - Мессеж Үүсгэх

**Файл:** `src/api/entities.js:122`

**Дараалал:**
```
entities.Message.create()
    ↓
conversationService.createMessage()
    ↓
Firestore: addDoc(messagesRef, messageData)
```

**Firestore Document Структур:**
```javascript
{
  conversation_id: "conversation_id",
  sender_email: "user@email.com",
  receiver_email: "admin@email.com",
  message: "Мессежийн агуулга",
  is_read: false,
  created_date: Timestamp
}
```

---

### 4. `entities.Conversation.update()` - Conversation Шинэчлэх

**Файл:** `src/api/entities.js:105`

**Дараалал:**
```
entities.Conversation.update()
    ↓
conversationService.updateConversation()
    ↓
Firestore: updateDoc(convRef, data)
```

**Update хийх талбарууд:**
- `last_message` - Сүүлийн мессеж
- `last_message_time` - Сүүлийн мессежийн цаг
- `last_message_sender` - Сүүлийн мессеж илгээсэн хүн
- `unread_count_p1` эсвэл `unread_count_p2` - Unread count

---

### 5. `queryClient.invalidateQueries()` - Cache Шинэчлэх

**Файл:** `src/pages/Chat.jsx:209-211`

```javascript
queryClient.invalidateQueries({ queryKey: ['messages'] });
queryClient.invalidateQueries({ queryKey: ['conversation'] });
queryClient.invalidateQueries({ queryKey: ['conversations'] });
```

**Ажиллах:**
1. React Query cache-ийг invalidate хийх
2. Автоматаар refetch хийх
3. UI шинэчлэгдэнэ

---

## 📝 Дүгнэлт

Админий ирсэн мессеж дээр дарж ороод хариу бичих үйлдэл нь дараах алхмуудаас бүрдэнэ:

1. **Navigation** - Messages хуудас → Chat хуудас
2. **Data Loading** - Мессежүүдийг Firestore-оос татаж авах
3. **UI Rendering** - Мессежүүдийг UI дээр харуулах
4. **User Input** - Хэрэглэгч мессеж бичих
5. **Message Creation** - Шинэ мессеж Firestore-д хадгалах
6. **Conversation Update** - Conversation-ийг шинэчлэх
7. **Cache Invalidation** - React Query cache шинэчлэх
8. **UI Update** - Шинэ мессеж UI дээр харагдах

Бүх үйлдэл нь React Query, Firestore, React Router зэрэг library-үүдийг ашиглаж ажиллана.
