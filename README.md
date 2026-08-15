# APIForge

Web-based API client (Postman analogi). Firebase backend.

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- TanStack Router (file-based, `src/routes/`) + TanStack Query
- Zustand — tab/request state
- CodeMirror 6 — body va response muharriri
- react-resizable-panels v4 — panel layout
- Firebase Auth + Firestore + Cloud Functions

## Ishga tushirish

```bash
npm install
npm run dev
```

## Muhitlar

Ikki muhit, Vite mode fayllari orqali ajratilgan:

| Muhit | Fayl | Firebase project | Buyruq |
|---|---|---|---|
| dev | `.env.development` | `apiforge-dev` | `npm run dev`, `npm run build:dev`, `npm run deploy:dev` |
| prod | `.env.production` | `apiforge-prod` | `npm run build`, `npm run deploy:prod` |

Firebase web konfiguratsiyasi (`apiKey` va boshqalar) maxfiy emas — u baribir brauzer
bundle'iga tushadi. Himoya `firestore.rules` va Auth orqali bo'ladi. Shuning uchun mode
fayllari repoga commit qilinadi; faqat `.env.*.local` gitignore'da.

Lokal ravishda emulyatorlarga o'tish uchun `.env.development.local` yarating:

```bash
echo "VITE_USE_EMULATORS=true" > .env.development.local
npm run emulators
```

`npm run build` — typecheck (`tsc -b`) + production build.

## Loyiha strukturasi

Feature-first, har bir feature ichida clean architecture qatlamlari:

```
src/
  app/                        ilova qobig'i
    main.tsx
    providers/                theme
    routes/                   TanStack Router fayl-marshrutlari
  core/                       yadro — feature'larga bog'liq emas
    domain/                   HttpMethod, KeyValue, VariableScope
    config/                   firebase
    lib/                      cn, id, key-value
  shared/
    ui/                       method-badge, key-value-editor
  features/
    auth/
      domain/                 AuthUser, AuthGateway, AuthFailure
      application/            schemas (zod), auth-service
      infrastructure/         firebase-auth-gateway
      presentation/           login-page, register-page, auth-store, require-auth, user-menu
      composition.ts          createAuthService(firebaseAuthGateway)
    request/
      domain/                 RequestDef, ResponseResult, RequestGateway
      application/            build-http-call, send-request, interpolate, request-factory
      infrastructure/         fetch-request-gateway
      presentation/           request-panel, response-panel
      index.ts                feature'ning ochiq API'si + kompozitsiya
    workspaces/
      domain/                 Workspace, Team, WorkspaceGateway, UserLookup
      application/            workspace-service, team-service, schemas
      infrastructure/         firestore-workspace-gateway, firestore-team-gateway
      presentation/           home-page, workspace-page, workspaces-store
    collections/
      domain/                 ApiCollection, Folder, CollectionGateway
      application/            collection-service, tree (buildTree, kaskad)
      infrastructure/         firestore-collection-gateway
      presentation/           collection-page, collection-tree, modallar
    landing/                  landing sahifa
    users/                    email → uid katalogi
    profile/                  presentation (profile-page)
    tabs/                     domain, presentation (tabs-store, tab-bar)
    environments/             domain
```

## Marshrutlar

| Yo'l | Sahifa | Himoya |
|---|---|---|
| `/` | Landing sahifa — platforma haqida | Ochiq |
| `/workspaces` | Ish maydonlari ro'yxati va yaratish | Auth talab qilinadi |
| `/workspace/$id` | Jamoalar, a'zolar, API to'plamlari | Auth talab qilinadi |
| `/workspace/$id/collection/$cid` | Papkalar daraxti, endpointlar, sozlamalar | Auth talab qilinadi |
| `/login` | Kirish + parolni tiklash | Ochiq |
| `/register` | Ro'yxatdan o'tish | Ochiq |
| `/profile` | Profil, parol almashtirish | Auth talab qilinadi |

Bog'liqlik yo'nalishi ichkariga: `presentation`/`infrastructure` → `application` → `domain`.
`core` va `shared` hech qachon `features` ga bog'lanmaydi.

`src/app/route-tree.gen.ts` avtomatik generatsiya qilinadi (gitignore'da).

## Hozirgi holat

Ishlaydi:

- Landing sahifa, uch til (uz / ru / en)
- Auth: kirish, ro'yxatdan o'tish, parolni tiklash, profil
- Ish maydonlari, jamoalar, a'zolar
- API to'plamlari, ichma-ich papkalar, endpointlar
- To'plamdan meros: base URL, headerlar, auth, o'zgaruvchilar
- Markdown hujjatlar: to'plam bosh sahifasi, endpoint docs, status kod misollari
- Javobdan o'zgaruvchiga olish (capture)
- Postman collection import
- Method + URL + params + headers + body (`none`, `json`, `raw`, `urlencoded`)
- Auth: `inherit`, `bearer`, `basic`, `apiKey`
- Avtomatik saqlash, xatolarni tasniflash
- Light/dark tema

- CORS'siz so'rovlar — dev proxy orqali (pastga qarang)
- Auth: kirish, ro'yxatdan o'tish, parolni tiklash, profil, parol almashtirish

`apiforge-dev` to'liq ulangan: Authentication (email/parol) yoqilgan, Firestore
`europe-west3` da, qoidalar va indekslar deploy qilingan. Ilova standart holatda
**real Firebase**'ga yozadi.

Emulyatorga o'tish uchun:

```bash
echo "VITE_USE_EMULATORS=true" > .env.development.local
npm run emulators
```

Emulyator ma'lumoti `.firebase-data` ga saqlanadi va real project bilan almashmaydi.

Hali yo'q:

- **Cloud Function proxy** — production uchun, pastga qarang
- Environment'lar (dev/prod almashish), so'rovlar tarixi
- Hosting deploy (`npm run deploy:dev` tayyor, hali ishlatilmagan)
- cURL import/export

## Vercel'ga deploy

```
Vercel → GitHub repo'ni ulang → Framework: Vite (avtomatik aniqlanadi)
```

`vercel.json` build buyrug'i, chiqish papkasi va SPA rewrite'larini beradi.
Rewrite `api/` dan tashqari hamma yo'lni `index.html` ga yo'naltiradi — TanStack
Router klient tomonda ishlaganligi uchun kerak.

**Muhit o'zgaruvchilari** `.env.production` da (Firebase web konfiguratsiyasi maxfiy
emas). Boshqa Firebase project'ga o'tmoqchi bo'lsangiz, Vercel dashboard'ida
`VITE_FIREBASE_*` ni qayta belgilang.

**Deploydan keyin bitta qo'lda qadam:** Firebase Console → Authentication →
Settings → Authorized domains ga Vercel domenini qo'shing (`*.vercel.app` yoki
o'z domeningiz). Aks holda kirish "unauthorized domain" bilan rad etiladi.

### Deploy qilingan proxy

`api/proxy.ts` — Vercel serverless funksiyasi, dev proxy bilan bir xil vazifani
bajaradi, lekin **ommaviy internetda turadi**. Shuning uchun himoya qo'shilgan:

- private IP oralig'lari bloklanadi (10/8, 172.16/12, 192.168/16, 127/8,
  169.254/16, 100.64/10, ::1, fc00::/7, fe80::/10 va IPv4-mapped shakllari)
- `localhost`, `*.internal` va `http(s)` dan boshqa protokollar rad etiladi
- host DNS orqali yechiladi va **yechilgan IP** ham tekshiriladi — ya'ni ommaviy
  domen private manzilga ishora qilsa ham o'tmaydi
- redirect'lar qo'lda kuzatiladi, **har bir hop qaytadan tekshiriladi** (aks holda
  ochiq redirect himoyani chetlab o'tardi), 5 hopdan ko'p bo'lsa to'xtatiladi
- so'rov va javob hajmi 8 MB bilan cheklangan, timeout 25s
- `cookie` va `x-forwarded-*` headerlari uzatilmaydi

Front-end qaysi yo'lni ishlatishini `VITE_PROXY_PATH` hal qiladi: dev server'da
plagin yo'li, production'da `/api/proxy`, bo'sh bo'lsa to'g'ridan-to'g'ri `fetch`.

## CORS va dev proxy

Brauzerdan to'g'ridan-to'g'ri `fetch` faqat `Access-Control-Allow-Origin` qaytaradigan API'lar
bilan ishlaydi — real dunyodagi API'larning ozchiligi.

**Dev rejimida bu hal qilingan.** `vite.config.ts` ichidagi `apiforge-dev-proxy` plagini
so'rovni Node tomondan uzatadi, shuning uchun CORS umuman qo'llanmaydi:

```
Browser → Vite dev server (/__apiforge_proxy?target=…) → Target API → qaytish
```

Beradigan qulayliklari: `localhost` va ichki tarmoq API'lari ishlaydi, response headerlarning
**hammasi** ko'rinadi (real CORS'da faqat safelist'dagilar ko'rinardi), qo'shimcha kechikish ~0ms.

O'chirish uchun `.env` da `VITE_DEV_PROXY=false`.

Proxy faqat `npm run dev` da faol (`import.meta.env.DEV`). Production build'da so'rov yana
to'g'ridan-to'g'ri ketadi — deploy qilingan APIForge uchun Cloud Function relay kerak:

```
Browser → Cloud Function (proxy) → Target API → qaytish
```

Kerak bo'ladi:

- Firebase **Blaze** plan (Spark'da Functions'dan tashqi tarmoqqa chiqish yopiq)
- SSRF himoyasi — private IP oralig'lari (10/8, 172.16/12, 192.168/16, 169.254/16, ::1) bloklanadi
- Auth tekshiruvi + foydalanuvchi boshiga rate limit
- Redirect'larni qo'lda kuzatish (har bir hop uchun qayta SSRF tekshiruvi)
- Response hajmi limiti

Cheklovlar: `localhost` va ichki tarmoq API'lari test qilinmaydi, cold start ~1-2s
response vaqti o'lchoviga qo'shiladi.
