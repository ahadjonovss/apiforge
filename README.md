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
cp .env.example .env      # Firebase konsolidan qiymatlarni to'ldiring
npm run dev
```

`npm run build` — typecheck (`tsc -b`) + production build.

## Loyiha strukturasi

```
src/
  components/     UI (sidebar, tab-bar, request-panel, response-panel, ...)
  lib/            firebase, http-client, interpolate, request-factory, utils
  routes/         TanStack Router fayl-marshrutlari
  stores/         Zustand store'lar
  types/          domen modellari (RequestDef, ResponseResult, Environment, ...)
```

`src/routeTree.gen.ts` avtomatik generatsiya qilinadi (gitignore'da).

## Hozirgi holat

Ishlaydi:

- Tab'lar: ochish, yopish, almashish
- Method + URL + query params + headers
- Body: `none`, `json`, `raw`, `urlencoded` (form-data hali yo'q)
- Auth: `bearer`, `basic`, `apiKey` — http-client'da bor, UI hali yo'q
- Response: status, vaqt, hajm, JSON pretty-print, headerlar
- `{{variable}}` interpolation — `src/lib/interpolate.ts` (environment UI hali yo'q)
- Light/dark tema

Hali yo'q:

- **Cloud Function proxy** — eng muhim keyingi qadam, pastga qarang
- Firestore persistence (collection'lar, environment'lar, history)
- Auth ekranlari
- cURL import/export

## ⚠️ CORS cheklovi

Hozirgi `src/lib/http-client.ts` brauzerdan **to'g'ridan-to'g'ri** `fetch` qiladi. Bu faqat
`Access-Control-Allow-Origin` qaytaradigan API'lar bilan ishlaydi — real dunyodagi API'larning
ozchiligi.

Yechim: Cloud Function relay.

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
