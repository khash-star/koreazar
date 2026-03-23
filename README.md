# Koreazar App - Classified Ads Platform

🇲🇳 Монгол хэл дээрх ангилалт зар мэдээллийн платформ (South Korea)

## 📋 Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Vercel Serverless Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Hosting**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account
- Vercel account

### Installation

```bash
# Dependencies суулгах
npm install

# Development server эхлүүлэх
npm run dev
```

### Environment Variables

`.env` файл үүсгээд (`.env.example`-ийг ашиглах):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=koreazar-32e7a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Building for Production

```bash
npm run build
```

## 📚 Documentation

- [Migration Analysis](./MIGRATION_ANALYSIS.md) - Base44 SDK-ийг судласан тайлан
- [Firebase + Vercel Setup](./FIREBASE_VERCEL_SETUP.md) - Firebase болон Vercel тохируулах заавар
- [Migration Roadmap](./MIGRATION_ROADMAP.md) - Migration хийх алхмууд
- [GitHub Setup](./GITHUB_SETUP.md) - GitHub repository тохируулах

## 🔄 Migration Status

⚠️ **Migration хийгдэж байна**: Base44 SDK → Firebase + Vercel

- [x] GitHub repository үүсгэгдсэн
- [ ] Firebase project тохируулагдсан
- [ ] Vercel deploy хийгдсэн
- [ ] Authentication migration
- [ ] Backend API migration
- [ ] Frontend integration
- [ ] Testing & cleanup

## 🛠️ Development

### Project Structure

```
src/
  ├── api/          # API clients (migrating from base44)
  ├── components/   # React components
  ├── pages/        # Page components
  ├── firebase/     # Firebase configuration
  └── utils/        # Utility functions
```

## 📝 License

Copyright © 2026 KHASH Co Ltd