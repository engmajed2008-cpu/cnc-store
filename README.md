# إعلاني | E3lani — متجر CNC الإلكتروني

> متجر إلكتروني احترافي لخدمات قص المعادن CNC، الديكور، واللوحات — يدعم العربية والإنجليزية مع RTL/LTR تلقائي، حاسبة أسعار فورية، سلة تسوق كاملة، وبوابات دفع سعودية.

---

## 🗂️ بنية المشروع الكاملة

```
cnc-store/
├── Dockerfile                          # Multi-stage Docker build
├── docker-compose.yml                  # App + Nginx + Redis
├── deploy.sh                           # Deploy script for STC Cloud
├── .env.example                        # Environment variables template
├── .dockerignore
├── next.config.mjs                     # standalone output + i18n + headers
├── tailwind.config.js
├── nginx/
│   ├── nginx.conf                      # Main Nginx config
│   ├── conf.d/
│   │   └── e3lani.conf               # Virtual host + SSL + cache
│   └── ssl/                            # ← Put your SSL certs here
│       ├── fullchain.pem
│       ├── privkey.pem
│       └── chain.pem
├── messages/
│   ├── ar.json                         # Arabic translations
│   └── en.json                         # English translations
└── src/
    ├── app/
    │   ├── api/health/route.ts         # Docker HEALTHCHECK endpoint
    │   └── [locale]/
    │       ├── layout.tsx              # CartProvider + i18n + fonts
    │       ├── page.tsx                # Home page
    │       ├── cart/page.tsx           # 🛒 Full shopping cart
    │       ├── checkout/page.tsx       # 💳 3-step checkout + payment
    │       └── products/cnc/page.tsx   # ⚙️  CNC product configurator
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx              # Live cart badge + mobile drawer
    │   │   └── Footer.tsx
    │   ├── sections/
    │   │   ├── HeroSection.tsx
    │   │   ├── CategoryGrid.tsx
    │   │   └── ServicesSection.tsx
    │   ├── product/
    │   │   └── CNCConfigurator.tsx     # 6-step configurator + price panel
    │   └── ui/
    │       └── LanguageSwitcher.tsx
    ├── store/
    │   └── cartStore.ts                # React Context + localStorage
    ├── lib/
    │   ├── i18n.ts                     # next-intl config
    │   ├── priceCalculator.ts          # Price engine (SAR + USD)
    │   └── utils.ts
    └── styles/
        └── globals.css                 # RTL/LTR variables + animations
```

---

## ⚡ تشغيل محلي

```bash
npm install
npm run dev
# http://localhost:3000/ar  ← عربي RTL
# http://localhost:3000/en  ← إنجليزي LTR
```

---

## 🐳 Docker (إنتاج)

```bash
# بناء وتشغيل
docker compose up -d --build

# مشاهدة السجلات
docker compose logs -f app
docker compose logs -f nginx

# إعادة تشغيل الـ app فقط
docker compose restart app

# إيقاف الكل
docker compose down
```

---

## ☁️ الرفع على STC Cloud

### المتطلبات على السيرفر
```bash
# Ubuntu 22.04 LTS — STC Cloud VM
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git curl

# تفعيل Docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

### أول نشر
```bash
# استنساخ المشروع
git clone https://github.com/your-org/cnc-store /opt/e3lani
cd /opt/e3lani

# إعداد البيئة
cp .env.example .env
nano .env   # ← أضف مفاتيح API الحقيقية

# تثبيت شهادة SSL (Let's Encrypt)
sudo apt install -y certbot
sudo certbot certonly --standalone -d e3lani.com -d www.e3lani.com
sudo cp /etc/letsencrypt/live/e3lani.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/e3lani.com/privkey.pem   nginx/ssl/
sudo cp /etc/letsencrypt/live/e3lani.com/chain.pem     nginx/ssl/

# رفع المشروع
bash deploy.sh
```

### تجديد SSL تلقائي (Cron)
```bash
sudo crontab -e
# أضف السطر التالي:
0 3 * * 1 certbot renew --quiet && docker compose -f /opt/e3lani/docker-compose.yml restart nginx
```

---

## 💳 بوابات الدفع المدعومة

| البوابة | النوع | الحالة |
|---------|-------|--------|
| **Moyasar** | مدى + Visa + Mastercard | Stub جاهز |
| **Tabby** | BNPL — 4 أقساط | Stub جاهز |
| **Tamara** | BNPL — 3/6 أقساط | Stub جاهز |
| **STC Pay** | محفظة رقمية | Stub جاهز |
| **Apple Pay** | عبر Moyasar | Stub جاهز |
| **تحويل بنكي** | IBAN مباشر | مفعّل |
| **واتساب** | يدوي | مفعّل |

> لتفعيل أي بوابة، أضف مفاتيح API في `.env` وابحث عن تعليق `🔌 PAYMENT GATEWAY INTEGRATION STUB` في `checkout/page.tsx`.

---

## 🔧 متغيرات البيئة الضرورية

```bash
MOYASAR_PUBLISHABLE_KEY=pk_live_...
MOYASAR_SECRET_KEY=sk_live_...
TABBY_PUBLIC_KEY=pk_...
TAMARA_MERCHANT_TOKEN=...
TAQNYAT_TOKEN=...         # SMS التأكيد
RESEND_API_KEY=re_...     # إيميل التأكيد
```

---

## 📊 Nginx Cache Strategy

| المسار | Cache | المدة |
|--------|-------|-------|
| `/_next/static/*` | Immutable | 1 سنة |
| `/_next/image` | Public | 7 أيام |
| `/public/*` | Public | 30 يوم |
| صفحات SSR | Proxy Cache | 1 دقيقة |
| `/api/*` | No Cache | — |

