# Мессеж Бичилцэх Системийн Архитектур

## 📋 Ерөнхий тойм

Энэхүү систем нь хэрэглэгчдэд хоорондоо мессеж бичилцэх боломжийг олгодог. Систем нь Firebase Firestore ашиглаж, React Query-гөөр data fetching удирдана.

---

## 🗂️ Файлуудын байршил

### 1. **Frontend хуудасууд (Pages)**

#### `src/pages/Messages.jsx` - Мессеж жагсаалтын хуудас
- **Үүрэг**: Хэрэглэгчийн бүх харилцлагыг (conversations) жагсаана
- **Гол функцүүд**:
  - Мессеж жагсаалтыг харуулах (39-93 мөр)
  - Админд мессеж илгээх (134-164 мөр)
  - Хайлт хийх (119-127 мөр)

#### `src/pages/Chat.jsx` - Мессеж бичилцэх хуудас
- **Үүрэг**: Тодорхой хэрэглэгчтэй мессеж бичилцэх интерфейс
- **Гол функцүүд**:
  - Conversation үүсгэх/олох (48-85 мөр)
  - Мессежүүдийг харуулах (96-104 мөр)
  - Мессеж илгээх (182-214 мөр)
  - Мессеж уншсан гэж тэмдэглэх (151-175 мөр)

### 2. **Service файлууд**

#### `src/services/conversationService.js` - Firestore CRUD үйлдлүүд
- **Үүрэг**: Conversation болон Message-үүдийн database үйлдлүүд
- **Гол функцүүд**:
  - `createConversation()` - 91-112 мөр
  - `findConversation()` - 145-178 мөр
  - `createMessage()` - 206-228 мөр
  - `listMessages()` - 181-204 мөр
  - `sendMessageToAllUsers()` - 321-383 мөр (зөвхөн админ)

### 3. **API Entities**

#### `src/api/entities.js` - Entity wrapper функцүүд
- **Үүрэг**: Conversation болон Message entity-үүдийг wrapper хийж ашиглахад хялбар болгох
- **Гол функцүүд**:
  - `Conversation.filter()` - 96-102 мөр
  - `Conversation.create()` - 104 мөр
  - `Conversation.update()` - 105 мөр
  - `Message.filter()` - 116-120 мөр
  - `Message.create()` - 122 мөр
  - `Message.update()` - 123 мөр

---

## 🔄 Функцүүдийн Холболт

### 1. Мессеж Жагсаалт Харуулах (Messages.jsx)

```
Messages Component (src/pages/Messages.jsx)
    ↓
useQuery (39-93 мөр)
    ↓
entities.Conversation.filter() (51-52 мөр)
    ↓
conversationService.filterConversations() (src/api/entities.js:102)
    ↓
Firestore: 'conversations' collection (src/services/conversationService.js:62-89)
```

**Ажиллах дараалал:**
1. `Messages.jsx` component mount болно
2. `useQuery` hook ажиллаж, `conversations` data fetch хийх хүсэлт илгээнэ (39 мөр)
3. `entities.Conversation.filter()` дуудагдана (51-52 мөр)
4. `conversationService.filterConversations()` Firestore-оос data татана (62-89 мөр)
5. Data ирээд UI дээр харуулна (228-283 мөр)

---

### 2. Шинэ Conversation Үүсгэх (Chat.jsx)

```
ListingDetail.jsx (430 мөр)
    ↓
User clicks "Мессеж илгээх" button
    ↓
Navigate to: Chat?otherUserEmail={email}&listingId={id}
    ↓
Chat.jsx Component
    ↓
useEffect (48-85 мөр) - Conversation үүсгэх/олох
    ↓
entities.Conversation.filter() (55-63 мөр)
    ↓
[If not exists] entities.Conversation.create() (71-80 мөр)
    ↓
conversationService.createConversation() (src/services/conversationService.js:91-112)
    ↓
Firestore: 'conversations' collection
```

**Ажиллах дараалал:**
1. Зар дээрх "Мессеж илгээх" товчийг дарах (`ListingDetail.jsx:430`)
2. `Chat.jsx` хуудас руу navigate хийх (`?otherUserEmail=...&listingId=...`)
3. `Chat.jsx` component mount болно
4. `useEffect` ажиллаж conversation олох/үүсгэх (48-85 мөр)
5. `entities.Conversation.filter()` дуудагдана - одоо байгаа conversation олох (55-63 мөр)
6. Хэрэв байхгүй бол `entities.Conversation.create()` дуудагдана (71-80 мөр)
7. `conversationService.createConversation()` Firestore-д шинэ document үүсгэнэ (91-112 мөр)
8. `setActualConversationId()` дуудагдаж conversation ID state-д хадгалагдана

---

### 3. Мессеж Илгээх (Chat.jsx)

```
User types message in Textarea (366-378 мөр)
    ↓
User clicks Send button or presses Enter (379-390 мөр)
    ↓
handleSend() (216-219 мөр)
    ↓
sendMutation.mutate(message) (218 мөр)
    ↓
sendMutation.mutationFn() (182-207 мөр)
    ↓
entities.Message.create() (187-193 мөр)
    ↓
conversationService.createMessage() (src/services/conversationService.js:206-228)
    ↓
Firestore: 'messages' collection
    ↓
entities.Conversation.update() (199-204 мөр)
    ↓
conversationService.updateConversation() (src/services/conversationService.js:114-122)
    ↓
Firestore: 'conversations' collection update
    ↓
queryClient.invalidateQueries() (209-211 мөр)
    ↓
UI шинэчлэгдэнэ (refetch)
```

**Ажиллах дараалал:**
1. Хэрэглэгч Textarea дээр мессеж бичнэ (366-378 мөр)
2. "Send" товчийг дарна эсвэл Enter дарах (379-390 мөр)
3. `handleSend()` функц дуудагдана (216-219 мөр)
4. `sendMutation.mutate(message)` ажиллана (218 мөр)
5. `sendMutation.mutationFn()` ажиллаж:
   - `entities.Message.create()` - шинэ мессеж үүсгэнэ (187-193 мөр)
   - `conversationService.createMessage()` - Firestore-д хадгална (206-228 мөр)
   - `entities.Conversation.update()` - conversation-ийг шинэчлэнэ (199-204 мөр)
     - `last_message`, `last_message_time`, `last_message_sender` шинэчилнэ
     - `unread_count` нэмэгдэнэ
6. `onSuccess` callback ажиллана (208-213 мөр):
   - `queryClient.invalidateQueries()` - cache шинэчлэнэ
   - `setMessage('')` - input талбарыг хоослоно
7. React Query автоматаар data refetch хийж UI шинэчлэгдэнэ

---

### 4. Мессежүүдийг Харуулах (Chat.jsx)

```
Chat.jsx Component
    ↓
useQuery (96-104 мөр)
    ↓
entities.Message.filter({ conversation_id }) (98-101 мөр)
    ↓
conversationService.listMessages() (src/services/conversationService.js:181-204)
    ↓
Firestore: 'messages' collection
    ↓
Query: where('conversation_id', '==', conversationId)
    ↓
orderBy('created_date', 'desc')
    ↓
Data returns → UI renders (310-358 мөр)
```

**Ажиллах дараалал:**
1. `Chat.jsx` component mount болно
2. `actualConversationId` байвал `useQuery` ажиллана (96-104 мөр)
3. `entities.Message.filter()` дуудагдана (98-101 мөр)
4. `conversationService.listMessages()` Firestore-оос мессежүүдийг татана (181-204 мөр)
5. Firestore query: `where('conversation_id', '==', conversationId)` + `orderBy('created_date', 'desc')`
6. Data ирээд messages array болж ирнэ
7. UI дээр map хийж харуулна (310-358 мөр)
8. `refetchInterval: 3000` - 3 секунд тутамд автоматаар шинэчилнэ (103 мөр)

---

### 5. Мессеж Уншсан Гэж Тэмдэглэх (Chat.jsx)

```
Messages rendered in UI (310-358 мөр)
    ↓
useEffect (151-175 мөр)
    ↓
Filter unread messages (157-159 мөр)
    ↓
For each unread message:
    ↓
entities.Message.update(msg.id, { is_read: true }) (162 мөр)
    ↓
conversationService.updateMessage() (src/services/conversationService.js:230-238)
    ↓
Firestore: 'messages' collection update
    ↓
entities.Conversation.update() (168-170 мөр)
    ↓
Update unread_count to 0
```

**Ажиллах дараалал:**
1. Мессежүүд UI дээр render болно (310-358 мөр)
2. `useEffect` ажиллаж уншсан гэж тэмдэглэх (151-175 мөр)
3. `messages.filter()` - өөрийн хүлээн авсан уншаагүй мессежүүдийг олно (157-159 мөр)
4. Loop-оор дамжиж `entities.Message.update()` дуудагдана (162 мөр)
5. `conversationService.updateMessage()` - Firestore дээр `is_read: true` болгоно (230-238 мөр)
6. `entities.Conversation.update()` - conversation-ийн `unread_count`-ийг 0 болгоно (168-170 мөр)

---

## 📊 Database Структур

### Firestore Collections

#### 1. `conversations` Collection
```javascript
{
  id: "conversation_id",
  participant_1: "user1@email.com",
  participant_2: "user2@email.com",
  last_message: "Сайн уу!",
  last_message_time: "2024-01-15T10:30:00Z",
  last_message_sender: "user1@email.com",
  unread_count_p1: 0,
  unread_count_p2: 2,
  created_date: Timestamp,
  last_message_date: Timestamp
}
```

#### 2. `messages` Collection
```javascript
{
  id: "message_id",
  conversation_id: "conversation_id",
  sender_email: "user1@email.com",
  receiver_email: "user2@email.com",
  message: "Сайн уу!",
  is_read: false,
  created_date: Timestamp
}
```

---

## 🔗 Функцүүдийн Холболтын Диаграм

### Мессеж Илгээх Flow

```
User Input
    │
    ├─→ handleSend() [Chat.jsx:216-219]
    │       │
    │       └─→ sendMutation.mutate() [Chat.jsx:218]
    │               │
    │               ├─→ mutationFn() [Chat.jsx:182-207]
    │               │       │
    │               │       ├─→ entities.Message.create() [Chat.jsx:187]
    │               │       │       │
    │               │       │       └─→ conversationService.createMessage() [conversationService.js:206-228]
    │               │       │               │
    │               │       │               └─→ Firestore: 'messages' collection
    │               │       │
    │               │       └─→ entities.Conversation.update() [Chat.jsx:199]
    │               │               │
    │               │               └─→ conversationService.updateConversation() [conversationService.js:114-122]
    │               │                       │
    │               │                       └─→ Firestore: 'conversations' collection
    │               │
    │               └─→ onSuccess() [Chat.jsx:208-213]
    │                       │
    │                       ├─→ queryClient.invalidateQueries() [Chat.jsx:209-211]
    │                       │       │
    │                       │       └─→ Auto refetch messages & conversations
    │                       │
    │                       └─→ setMessage('') [Chat.jsx:212]
    │
    └─→ UI Updates (React Query refetch)
```

### Мессеж Унших Flow

```
Chat.jsx Component Mount
    │
    ├─→ useQuery [Chat.jsx:96-104]
    │       │
    │       └─→ entities.Message.filter() [Chat.jsx:98-101]
    │               │
    │               └─→ conversationService.listMessages() [conversationService.js:181-204]
    │                       │
    │                       └─→ Firestore Query:
    │                               where('conversation_id', '==', conversationId)
    │                               orderBy('created_date', 'desc')
    │                               limit(100)
    │
    └─→ useEffect (mark as read) [Chat.jsx:151-175]
            │
            ├─→ Filter unread messages [Chat.jsx:157-159]
            │
            ├─→ entities.Message.update() [Chat.jsx:162]
            │       │
            │       └─→ conversationService.updateMessage() [conversationService.js:230-238]
            │               │
            │               └─→ Firestore: messages/{id} update { is_read: true }
            │
            └─→ entities.Conversation.update() [Chat.jsx:168-170]
                    │
                    └─→ conversationService.updateConversation() [conversationService.js:114-122]
                            │
                            └─→ Firestore: conversations/{id} update { unread_count: 0 }
```

---

## 📝 Гол Мөрүүдийн Тайлбар

### Chat.jsx - Мессеж Илгээх

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

### conversationService.js - Мессеж Үүсгэх

```206:228:src/services/conversationService.js
export const createMessage = async (data) => {
  try {
    const messagesRef = collection(db, 'messages');
    const messageData = {
      ...data,
      created_date: Timestamp.now(),
      is_read: data.is_read !== undefined ? data.is_read : false
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    const result = {
      id: docRef.id,
      ...messageData,
      created_date: messageData.created_date.toDate() // Convert for easier use in components
    };
    
    return result;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};
```

### Chat.jsx - Conversation Үүсгэх/Олох

```48:85:src/pages/Chat.jsx
// Create conversation if needed
useEffect(() => {
  const createConversation = async () => {
    const email = userData?.email || user?.email;
    if (!email || !otherUserEmail || conversationId) return;
    
    // Check if conversation exists
    const existing1 = await entities.Conversation.filter({
      participant_1: email,
      participant_2: otherUserEmail
    });
    
    const existing2 = await entities.Conversation.filter({
      participant_1: otherUserEmail,
      participant_2: email
    });
    
    if (existing1.length > 0) {
      setActualConversationId(existing1[0].id);
    } else if (existing2.length > 0) {
      setActualConversationId(existing2[0].id);
    } else {
      // Create new conversation
      const newConv = await entities.Conversation.create({
        participant_1: email,
        participant_2: otherUserEmail,
        last_message: '',
        last_message_time: new Date().toISOString(),
        last_message_sender: email,
        unread_count_p1: 0,
        unread_count_p2: 0
      });
      setActualConversationId(newConv.id);
    }
  };
  
  createConversation();
}, [userData?.email, user?.email, otherUserEmail, conversationId]);
```

---

## 🎯 Дүгнэлт

Мессеж бичилцэх систем нь дараах бүтэцтэй:

1. **Frontend (React)**: 
   - `Messages.jsx` - Жагсаалт
   - `Chat.jsx` - Бичилцэх интерфейс

2. **Service Layer**: 
   - `conversationService.js` - Firestore CRUD үйлдлүүд

3. **API Layer**: 
   - `entities.js` - Entity wrapper функцүүд

4. **Database**: 
   - Firestore `conversations` collection
   - Firestore `messages` collection

5. **State Management**: 
   - React Query (data fetching, caching)
   - React useState (local state)

Систем нь polling механизм ашиглаж (3-5 секунд тутамд refetch) real-time мэдрэмжийг өгдөг.
