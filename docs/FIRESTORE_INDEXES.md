# Firestore Indexes

## Шаардлагатай индексүүд

Эдгээр индексүүд `firestore.indexes.json` дээр тодорхойлогдсон. Firebase Console эсвэл `firebase deploy --only firestore:indexes` ашиглан deploy хийнэ.

### Listings collection

| Query | Fields | Хэрэглээ |
|-------|--------|----------|
| `status` + `created_date` | status ASC, created_date DESC | Home хуудас - идэвхтэй зарууд |
| `created_by` + `created_date` | created_by ASC, created_date DESC | Миний зарууд |
| `status` + `category` + `created_date` | status ASC, category ASC, created_date DESC | Категориар шүүсэн зарууд |

### Deploy заавар

```bash
# Firebase CLI суулгасан бол
firebase deploy --only firestore:indexes
```

Алдаа гарвал Firebase Console → Firestore → Indexes дээр гарсан холбоос дараад индекс үүсгэнэ үү.
