# GitHub Setup Заавар

## 📋 GitHub Repository үүсгэх

### 1. GitHub дээр repository үүсгэх

1. https://github.com руу оч
2. "New" эсвэл "+" → "New repository" дарах
3. Repository нэрийг оруулах (жишээ: `koreazar` эсвэл `base44-migration`)
4. Description бичих (optional)
5. **Public** эсвэл **Private** сонгох
6. **README.md**, **.gitignore**, **license** үүсгэхгүй байх (аль хэдийн байгаа)
7. "Create repository" дарах

### 2. Local repository-г GitHub-д холбох

PowerShell эсвэл Command Prompt дээр:

```bash
# zar-746103b7 folder руу орох
cd C:\Users\khash\OneDrive\Desktop\koreazar\zar-746103b7

# Git-ийг initialize хийх (хэрэв хийгдээгүй бол)
git init

# Бүх файлуудыг add хийх
git add .

# Эхний commit хийх
git commit -m "Initial commit: Base44 app before migration"

# GitHub remote нэмэх (YOUR_USERNAME болон YOUR_REPO_NAME-ийг өөрчлөх)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Branch-ийг main эсвэл master болгох
git branch -M main

# GitHub-д push хийх
git push -u origin main
```

**Анхаар:** `YOUR_USERNAME` болон `YOUR_REPO_NAME`-ийг өөрийн GitHub username болон repository нэрээр солих!

### 3. Authentication (GitHub Personal Access Token)

GitHub-д push хийхэд authentication хэрэгтэй. 2 арга байна:

#### Арга 1: GitHub CLI ашиглах (Хамгийн хялбар)
```bash
# GitHub CLI суулгах (хэрэв байхгүй бол)
winget install --id GitHub.cli

# Login хийх
gh auth login

# Push хийх
git push -u origin main
```

#### Арга 2: Personal Access Token ашиглах

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" дарах
3. Token name оруулах (жишээ: "koreazar-project")
4. Expiration сонгох
5. Scopes сонгох: **repo** (бүх checkbox-ууд)
6. "Generate token" дарах
7. Token-ийг хуулж авах (дараа нь харагдахгүй!)

Token-ийг аваад:

```bash
# Push хийхэд username болон password-ийн оронд token ашиглах
git push -u origin main

# Username: төө GitHub username
# Password: Personal Access Token (password биш!)
```

---

## 🔄 Дараа нь код өөрчлөх үед

```bash
# Өөрчлөлтийг add хийх
git add .

# Commit хийх
git commit -m "Ойлголттой commit message"

# GitHub-д push хийх
git push
```

---

## 📝 .gitignore файл

`.gitignore` файл аль хэдийн байгаа. Энэ нь дараах файлуудыг GitHub-д оруулахгүй:
- `node_modules/`
- `.env` (чухал! API keys байгаа файлууд)
- `dist/`
- Log файлууд

---

## ⚠️ Анхаарах зүйлс

1. **.env файл** GitHub-д оруулахгүй! (API keys, secrets байгаа)
2. **node_modules/** GitHub-д оруулахгүй (том хэмжээтэй)
3. **Personal Access Token** аюулгүй газар хадгалах

---

## 🚀 Vercel/Netlify-д deploy хийхэд

GitHub-д push хийсний дараа:
- Vercel/Netlify → New Project → GitHub repository сонгох
- Automatic deploy идэвхжүүлнэ

---

## 💡 Тусламж

Асуудал гарвал:
- `git remote -v` - remote-уудыг харах
- `git status` - одоогийн байдлыг харах
- `git log` - commit түүхийг харах

