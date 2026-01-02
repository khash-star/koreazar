# DNS Алдааны Шийдэл - www.zarmongolia.com

## ⚠️ Алдаа: `DNS_PROBE_FINISHED_NXDOMAIN`

**Алдааны шалтгаан:**
- DNS records зөв тохируулагдаагүй
- Domain Vercel дээр нэмэгдээгүй
- Nameservers буруу тохируулагдсан

---

## ✅ ШАГ 1: Vercel дээр Domain нэмэх

### 1.1 Vercel Dashboard дээр:

1. **Vercel Dashboard** → **koreazar** project → **Settings** → **Domains**
2. **"Add Domain"** button дарах
3. Domain оруулах:
   - `zarmongolia.com` (root domain)
   - `www.zarmongolia.com` (www subdomain)
4. Vercel DNS records өгнө (дараагийн шатанд ашиглана)

---

## ✅ ШАГ 2: Domain Registrar шалгах

Домэйнийг хаанаас авсан бэ?

### Option A: Cloudflare (Рекомендлэсэн)

#### 2.1 Cloudflare Dashboard дээр:

1. **Cloudflare Dashboard** → **zarmongolia.com** → **DNS** → **Records**
2. Дараах records байгаа эсэхийг шалгах:

#### Root Domain (@):
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com (эсвэл Vercel-ийн өгсөн CNAME)
Proxy: 🟠 Proxied (Orange cloud)
TTL: Auto
```

#### WWW Subdomain:
```
Type: CNAME
Name: www
Target: zarmongolia.com (root domain руу point хийх)
Proxy: 🟠 Proxied (Orange cloud)
TTL: Auto
```

**Эсвэл:**

```
Type: CNAME
Name: www
Target: cname.vercel-dns.com (Vercel-ийн өгсөн CNAME шууд)
Proxy: 🟠 Proxied
TTL: Auto
```

---

### Option B: Namecheap

#### 2.1 Namecheap Dashboard дээр:

1. **Namecheap** → **Domain List** → **zarmongolia.com** → **Manage**
2. **Advanced DNS** tab сонгох
3. Дараах records нэмэх эсвэл шалгах:

#### Root Domain (@):
```
Type: A Record
Host: @
Value: 76.76.21.21 (Vercel IP, Vercel-ээс авна)
TTL: Automatic
```

#### WWW Subdomain:
```
Type: CNAME Record
Host: www
Value: zarmongolia.com (эсвэл Vercel CNAME)
TTL: Automatic
```

---

### Option C: GoDaddy

#### 2.1 GoDaddy Dashboard дээр:

1. **GoDaddy** → **My Products** → **DNS**
2. DNS Records нэмэх (дээрхтэй ижил)

---

## ✅ ШАГ 3: Nameservers шалгах

### 3.1 Cloudflare ашиглаж байгаа бол:

1. **Cloudflare Dashboard** → **Overview**
2. Nameservers харагдана (жишээ: `adam.ns.cloudflare.com`, `diana.ns.cloudflare.com`)
3. Domain registrar дээр эдгээр nameservers-ийг тохируулах

### 3.2 Domain Registrar дээр Nameservers тохируулах:

1. **Namecheap** эсвэл **GoDaddy** → Domain → **Nameservers**
2. **Custom Nameservers** сонгох
3. Cloudflare-ийн nameservers оруулах
4. **Save** button дарах

---

## ✅ ШАГ 4: DNS Propagation хүлээх

DNS records өөрчлсний дараа:
- **1-5 минут:** Cloudflare/Namecheap дээр идэвхжинэ
- **5-60 минут:** Дэлхий даяар тарна
- **Зарим тохиолдолд:** 24 цаг хүртэл үргэлжилж болно

---

## ✅ ШАГ 5: DNS Resolution шалгах

### 5.1 Terminal/Command Prompt дээр:

```bash
# Windows PowerShell:
nslookup www.zarmongolia.com

# Эсвэл:
nslookup zarmongolia.com
```

**Хүлээгдэж буй үр дүн:**
- Vercel IP address эсвэл CNAME харагдах ёстой
- Хэрэв "NXDOMAIN" эсвэл "not found" байвал DNS records буруу байна

### 5.2 Online DNS checker:

1. https://dnschecker.org руу орох
2. Domain оруулах: `www.zarmongolia.com`
3. **"Search"** button дарах
4. Дэлхийн олон сервер дээр DNS records харагдах ёстой

---

## ✅ ШАГ 6: Vercel дээр Domain Configuration шалгах

1. **Vercel Dashboard** → **koreazar** project → **Settings** → **Domains**
2. `www.zarmongolia.com` байгаа эсэхийг шалгах
3. Status: **"Valid Configuration"** эсвэл **"Valid"** байх ёстой
4. Хэрэв **"Invalid Configuration"** байвал DNS records буруу байна

---

## 🔧 Түр зуурын шийдэл

DNS propagation хүлээхгүй байвал:

1. **Vercel free domain ашиглах:**
   - `koreazar.vercel.app` эсвэл `koreazar-khash.vercel.app`
   - Энэ нь шууд ажиллана

2. **Browser cache цэвэрлэх:**
   - Ctrl + Shift + Delete
   - DNS cache цэвэрлэх

---

## 📋 Checklist

- [ ] Domain Vercel дээр нэмэгдсэн (`zarmongolia.com` болон `www.zarmongolia.com`)
- [ ] DNS records зөв тохируулагдсан (Cloudflare/Namecheap/GoDaddy)
- [ ] Nameservers зөв тохируулагдсан (Cloudflare ашиглаж байгаа бол)
- [ ] DNS propagation хүлээсэн (5-60 минут)
- [ ] `nslookup` command-оор DNS resolution шалгасан
- [ ] Vercel Dashboard дээр domain "Valid Configuration" байна
- [ ] Browser дээр `https://www.zarmongolia.com` шалгасан

---

## 🆘 Хэрэв асуудал хэвээр байвал:

1. **Vercel Dashboard** → **koreazar** → **Settings** → **Domains** → Screenshot авна
2. **Cloudflare/Namecheap DNS Records** screenshot авна
3. **Terminal** дээр `nslookup www.zarmongolia.com` output screenshot авна
4. Эдгээр screenshot-уудыг илгээнэ үү

---

## 🔗 Холбоосууд

- **Vercel Domains:** https://vercel.com/docs/concepts/projects/domains
- **Cloudflare DNS:** https://developers.cloudflare.com/dns/
- **DNS Checker:** https://dnschecker.org

