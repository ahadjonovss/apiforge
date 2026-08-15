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
    users/                    email → uid katalogi
    profile/                  presentation (profile-page)
    tabs/                     domain, presentation (tabs-store, tab-bar)
    environments/             domain
```

## Marshrutlar

| Yo'l | Sahifa | Himoya |
|---|---|---|
| `/` | Ish maydonlari ro'yxati va yaratish | Auth talab qilinadi |
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

- Tab'lar: ochish, yopish, almashish
- Method + URL + query params + headers
- Body: `none`, `json`, `raw`, `urlencoded` (form-data hali yo'q)
- Auth: `bearer`, `basic`, `apiKey` — http-client'da bor, UI hali yo'q
- Response: status, vaqt, hajm, JSON pretty-print, headerlar
- `{{variable}}` interpolation — `src/lib/interpolate.ts` (environment UI hali yo'q)
- Light/dark tema

- CORS'siz so'rovlar — dev proxy orqali (pastga qarang)
- Auth: kirish, ro'yxatdan o'tish, parolni tiklash, profil, parol almashtirish

⚠️ `apiforge-dev` da Firebase Authentication xizmati hali yoqilmagan
(`CONFIGURATION_NOT_FOUND`). Konsolda **Authentication → Get started → Email/Password**
ni yoqmaguningizcha login/register faqat emulyatorda ishlaydi:

```bash
echo "VITE_USE_EMULATORS=true" > .env.development.local
npm run emulators
```

Hali yo'q:

- **Cloud Function proxy** — production uchun, pastga qarang
- Firestore persistence (collection'lar, environment'lar, history)
- Auth ekranlari
- cURL import/export

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
