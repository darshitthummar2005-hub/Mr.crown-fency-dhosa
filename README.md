# Mr. Crown Fancy Dosa - Deployment Guide (GitHub + Vercel)

Is website ko GitHub par daal kar Vercel se **FREE** me publish karo. Publish hone ke baad:

- Sab log aapka **Menu** dekh sakte hain
- Koi bhi **Order** kar sakta hai (WhatsApp par order aayega)
- Koi bhi **Table Book** kar sakta hai (live availability ke saath)
- Aap **Admin Panel** se menu aur bookings manage kar sakte ho

---

## STEP 1: Local par test karo (optional)

```bash
npm install
npm start
```

Phir browser me kholo: `http://localhost:3000`

---

## STEP 2: GitHub par code upload karo

### 2.1 Naya repository banao
1. https://github.com/new kholo
2. Repository name: `Mr.Crown` (ya jo chaaho)
3. **Private** ya **Public** — dono chalega
4. "Create Repository" pe click karo

### 2.3 Code push karo

Is folder me terminal/CMD kholo aur ye commands chalao (`YOUR_USERNAME` ki jagah apna GitHub username likhna):

```bash
git init
git add .
git commit -m "Mr. Crown Fancy Dosa website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Mr.Crown.git
git push -u origin main
```

> Pehli baar push karte time GitHub login window khulegi — login kar dena.

---

## STEP 3: Vercel par deploy karo

1. https://vercel.com kholo → **Sign up with GitHub** (ya login)
2. **Add New → Project** pe click karo
3. Apna `Mr.Crown` repository **Import** karo
4. Framework Preset kuch mat chuno (auto detect ho jayega) — koi build command change mat karna
5. **Deploy** button dabao
6. 30 second me website live! Link milega jaise `https://mr-crown-fancy-dosa.vercel.app`

Bas itna hi — ab ye link kisi ko bhi bhejo, sab log menu dekh sakte hain, order kar sakte hain aur table book kar sakte hain.

---

## STEP 4 (IMPORTANT): Admin password badlo

Deploy ke baad Vercel me jaao:

1. Project kholo → **Settings → Environment Variables**
2. Ye variables add karo:

| Name             | Value                        |
|------------------|------------------------------|
| ADMIN_USERNAME   | admin                        |
| ADMIN_PASSWORD   | *koi strong password*        |

3. Add karne ke baad **Deployments** tab me jaakar latest deployment par **Redeploy** karo (taaki naya password apply ho).

Ab admin panel: `https://aapki-site.vercel.app/admin` par isi username/password se login hoga.

> Default password `crown123` hai — use zaroor badalna!

---

## STEP 5 (Recommended): Bookings/menu PERMANENT save karo

By default Vercel ka free server temporary hota hai — matlab kabhi-kabhi server restart hone par naye bookings ya admin ki kiye hue menu changes reset ho sakte hain. Isko fix karna bahut aasan hai (bilkul FREE):

1. Vercel me apna project kholo → **Storage** tab
2. **Create Database** → **Redis** (Upstash) select karo → Create
3. Aane wale popup me **Connect to Project** karo (aapke project select karke)
4. Bas! Environment variables automatically add ho jate hain
5. Ab **Redeploy** karo

Iske baad har booking aur har menu change **permanent** save hoga. Local testing me data `backend/data/` folder ki JSON files me save hota hai.

> Note: Agar Redis connect nahi bhi kiya to bhi website 100% chalegi — orders WhatsApp par aate rahenge. Sirf live table availability thodi time ke liye reset ho sakti hai.

---

## Website publish hone ke baad

Jab Vercel aapko final link de (jaise `https://mr-crown-xxx.vercel.app`), to in files me placeholder URL badal dena (SEO ke liye):

- `index.html` — 3 jagah `mr-crown-fancy-dosa.vercel.app`
- `robots.txt` — sitemap line
- `sitemap.xml` — `<loc>` line

Phir dobara push karna:

```bash
git add .
git commit -m "Update site URL"
git push
```

Vercel automatically dobara deploy kar dega.

## Custom Domain (baad me, optional)

Vercel → Project → Settings → Domains me jaakar apna domain (jaise `mrcrowndosa.com`) connect kar sakte ho.

## Zaroori Links

| Kya                    | Kahan                              |
|------------------------|------------------------------------|
| Website                | `https://aapki-site.vercel.app`    |
| Admin Panel            | `https://aapki-site.vercel.app/admin` |
| Orders kahan aate hain | WhatsApp: +91 99049 41966          |
