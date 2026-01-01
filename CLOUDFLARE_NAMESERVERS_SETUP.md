# Cloudflare Nameservers Setup - zarmongolia.com

## 🔧 Domain Registrar дээр Nameservers өөрчлөх

### Cloudflare Nameservers:
```
dolly.ns.cloudflare.com
logan.ns.cloudflare.com
```

---

## 📋 Алхмууд

### Step 1: Domain Registrar олох

1. **ICANN Lookup ашиглах:**
   - https://lookup.icann.org руу орох
   - `zarmongolia.com` domain оруулах
   - Registrar-ийн нэрийг харах

**Эсвэл:**

2. **Domain худалдаж авсан вэбсайтыг санах:**
   - Namecheap
   - GoDaddy
   - Google Domains (одоо Squarespace)
   - Бусад

---

### Step 2: Domain Registrar-д нэвтрэх

1. Domain худалдаж авсан вэбсайт руу нэвтрэх
2. Domain list-рүү орох
3. `zarmongolia.com` domain олох

---

### Step 3: Nameservers өөрчлөх

#### Namecheap дээр:

1. **Domain List** → `zarmongolia.com` → **Manage**
2. **Advanced DNS** tab руу орох
3. **Nameservers** section олох
4. **Custom DNS** сонгох
5. Nameservers нэмэх:
   ```
   dolly.ns.cloudflare.com
   logan.ns.cloudflare.com
   ```
6. **Save** button дарах

#### GoDaddy дээр:

1. **My Products** → **Domains** → `zarmongolia.com`
2. **DNS** tab руу орох
3. **Nameservers** section олох
4. **Change** button дарах
5. **Custom** сонгох
6. Nameservers нэмэх:
   ```
   dolly.ns.cloudflare.com
   logan.ns.cloudflare.com
   ```
7. **Save** button дарах

#### Google Domains (Squarespace) дээр:

1. **Domains** → `zarmongolia.com`
2. **DNS** section руу орох
3. **Name servers** олох
4. **Use custom name servers** сонгох
5. Nameservers нэмэх:
   ```
   dolly.ns.cloudflare.com
   logan.ns.cloudflare.com
   ```
6. **Save** button дарах

---

### Step 4: DNSSEC унтраах (хэрэв байгаа бол)

1. Domain registrar дээр **DNSSEC** хайх
2. Хэрэв **ON** байвал **OFF** болгох
3. Хэрэв **OFF** байвал юу ч хийх хэрэггүй

**Яагаад?** Cloudflare дээр DNSSEC-ийг дараа нь идэвхжүүлэх боломжтой.

---

### Step 5: Хүлээх (DNS Propagation)

Nameservers өөрчлсний дараа:
- ⏱️ **5-30 минут**: Cloudflare дээр идэвхжинэ
- ⏱️ **1-24 цаг**: Дэлхий даяар тарна

**Шалгах:**
```bash
# Terminal эсвэл Command Prompt дээр:
nslookup -type=NS zarmongolia.com

# Эсвэл онлайн:
# https://www.whatsmydns.net/#NS/zarmongolia.com
```

---

### Step 6: Cloudflare дээр шалгах

1. Cloudflare Dashboard руу буцах
2. **Overview** хуудас дээр харагдах:
   - ✅ **"Active"** status (ногоон)
   - ✅ **"Status: Active"** гэж харагдах ёстой

---

## ⚠️ Анхаарах зүйлс

### 1. Хуучин Nameservers устгах:

- Registrar дээр бусад nameservers байвал устгах
- Зөвхөн Cloudflare nameservers л үлдээх:
  - `dolly.ns.cloudflare.com`
  - `logan.ns.cloudflare.com`

### 2. Downtime:

- **Downtime бага байх магадлалтай** (хэрэглэгч "unlikely to cause downtime" гэж хэлсэн)
- Гэхдээ 5-30 минут downtime байж болно

### 3. Email (MX Records):

- Хэрэв email ашиглаж байгаа бол:
  - Nameservers өөрчлсний дараа
  - Cloudflare DNS дээр MX records нэмэх хэрэгтэй
  - Email service provider-ийн MX records авах

---

## ✅ Checklist

- [ ] Domain registrar олсон
- [ ] Registrar дээр нэвтэрсэн
- [ ] DNSSEC унтраасан (хэрэв байгаа бол)
- [ ] Nameservers өөрчлсөн:
  - [ ] `dolly.ns.cloudflare.com` нэмсэн
  - [ ] `logan.ns.cloudflare.com` нэмсэн
  - [ ] Хуучин nameservers устгасан
- [ ] Registrar дээр хадгалсан
- [ ] 5-30 минут хүлээсэн
- [ ] Cloudflare Dashboard дээр **"Active"** status шалгасан

---

## 🔗 Холбоосууд

- **ICANN Lookup:** https://lookup.icann.org
- **Cloudflare Setup Docs:** https://developers.cloudflare.com/dns/zone-setups/full-setup/
- **DNS Propagation Check:** https://www.whatsmydns.net

---

## 💡 Зөвлөмж

**Одоо хийх:**
1. Domain registrar олох (ICANN Lookup ашиглах)
2. Registrar дээр нэвтрэх
3. Nameservers өөрчлөх
4. 5-30 минут хүлээх
5. Cloudflare дээр "Active" status шалгах

**Дараа нь:**
6. Cloudflare DNS дээр Vercel records нэмэх (`CLOUDFLARE_VERCEL_DNS.md` файлыг харна уу)

