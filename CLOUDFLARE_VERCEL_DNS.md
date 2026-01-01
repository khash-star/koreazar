# Cloudflare + Vercel DNS Setup Guide

## 🔧 Cloudflare DNS Records тохируулах

### 1. Vercel дээр Domain тохируулах (Эхлээд)

1. **Vercel Dashboard** → **Project** → **Settings** → **Domains**
2. **"Add Domain"** button дарах
3. Domain оруулах: `zarmongolia.com`
4. Vercel DNS records-ийг харуулна:
   - `A` record эсвэл `CNAME` record
   - IP address эсвэл CNAME value

### 2. Cloudflare дээр DNS Records нэмэх

#### Option 1: CNAME Record (Рекомендлэсэн) ⭐

1. Cloudflare Dashboard → **DNS** → **Records**
2. **"Add record"** button дарах
3. Тохиргоо:
   - **Type:** `CNAME`
   - **Name:** `@` (root domain) эсвэл `www` (www subdomain)
   - **Target:** Vercel-ийн өгсөн CNAME value (жишээ: `cname.vercel-dns.com`)
   - **Proxy status:** 🟠 **Proxied** (Orange cloud) - Cloudflare CDN ашиглах
   - **TTL:** Auto
4. **"Save"** button дарах

#### Option 2: A Record (IP Address)

1. **"Add record"** button дарах
2. Тохиргоо:
   - **Type:** `A`
   - **Name:** `@` (root domain)
   - **IPv4 address:** Vercel-ийн өгсөн IP address (жишээ: `76.76.21.21`)
   - **Proxy status:** 🟠 **Proxied**
   - **TTL:** Auto
3. **"Save"** button дарах

### 3. WWW Subdomain нэмэх (Optional)

1. **"Add record"** button дарах
2. Тохиргоо:
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Target:** `zarmongolia.com` (root domain)
   - **Proxy status:** 🟠 **Proxied**
   - **TTL:** Auto
3. **"Save"** button дарах

---

## 📋 Cloudflare DNS Records Жишээ

Vercel-д `zarmongolia.com` domain нэмсний дараа дараах records нэмэх:

### Root Domain (@):
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy: 🟠 Proxied
TTL: Auto
```

### WWW Subdomain:
```
Type: CNAME
Name: www
Target: zarmongolia.com
Proxy: 🟠 Proxied
TTL: Auto
```

---

## ⚠️ Анхаарах зүйлс

### 1. Proxy Status:

**🟠 Proxied (Orange cloud)** - Рекомендлэсэн:
- ✅ Cloudflare CDN ашиглана (хурдан)
- ✅ DDoS protection
- ✅ SSL certificate автоматаар
- ✅ Vercel-тай зөв ажиллана

**⚪ DNS only (Gray cloud)**:
- ⚠️ Cloudflare CDN ашиглахгүй
- ✅ DNS resolution л хурдан
- Vercel-тай зөв ажиллана

### 2. MX Record (Email):

Хэрэв email ашиглахгүй бол MX record шаардлагагүй. Гэхдээ warning харагдах болно, энэ нь хэвийн.

### 3. DNS Propagation:

DNS records нэмсний дараа:
- 1-5 минут: Cloudflare дээр идэвхжинэ
- 5-60 минут: Дэлхий даяар тарна
- Зарим тохиолдолд 24 цаг хүртэл үргэлжилж болно

---

## ✅ Шалгах

### 1. Vercel Dashboard дээр:
- Domain **"Valid Configuration"** байх ёстой
- SSL certificate **"Issuing"** эсвэл **"Valid"** байх ёстой

### 2. Browser дээр:
```bash
# DNS resolution шалгах
nslookup zarmongolia.com

# HTTPS шалгах
https://zarmongolia.com
```

### 3. Cloudflare Dashboard дээр:
- DNS records **"Active"** байх ёстой
- "Continue to activation" button дарах (хэрэв байгаа бол)

---

## 🔗 Холбоосууд

- **Vercel Domains:** https://vercel.com/docs/concepts/projects/domains
- **Cloudflare DNS:** https://developers.cloudflare.com/dns/

---

## 🎯 Алхмуудын Дүгнэлт

1. ✅ Vercel дээр `zarmongolia.com` domain нэмэх
2. ✅ Vercel-ийн DNS records авах
3. ✅ Cloudflare дээр CNAME эсвэл A record нэмэх
4. ✅ Proxy status: **🟠 Proxied** сонгох
5. ✅ 5-60 минут хүлээх (DNS propagation)
6. ✅ Browser дээр `https://zarmongolia.com` шалгах

