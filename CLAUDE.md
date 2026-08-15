# APIForge

Web-based API client (Postman analogi), Firebase backend.

## Buyruqlar

```bash
npm run dev              # vite dev server
npm run build            # tsc -b && vite build
npm run lint             # oxlint
firebase emulators:start # auth 9099, firestore 8080, functions 5001
```

Build tekshiruvsiz o'zgarish qo'shilmasin — `npm run build` typecheck'ni ham bajaradi.

## Konvensiyalar

- **Kod izohlari yozilmaydi.** Tushuntirish chatda beriladi.
- Import alias: `@/*` → `src/*`
- Fayl nomlari: kebab-case (`request-panel.tsx`, `tabs-store.ts`)
- Komponentlar: named export, `PascalCase`
- Domen tiplari `src/types/` da, biznes-logika `src/lib/` da, React'ga bog'liq emas
- Zustand store'lar: selector bilan o'qiladi (`useTabsStore((s) => s.tabs)`), butun store emas
- Tailwind: semantik tokenlar (`bg-card`, `text-muted-foreground`, `text-method-get`),
  hardcode rang yo'q. Tokenlar `src/index.css` da, `@theme inline` blokida.

## Arxitektura

`src/lib/http-client.ts` — sof funksiya, React'ga bog'liq emas. `RequestDef` qabul qiladi,
`ResponseResult` qaytaradi, xatolikda `HttpRequestFailure` tashlaydi.

Dev rejimida so'rov `vite.config.ts` dagi `apiforge-dev-proxy` plagini orqali o'tadi
(`/__apiforge_proxy?target=…`), shuning uchun CORS to'sqinlik qilmaydi. Production build'da
to'g'ridan-to'g'ri `fetch`. Yo'nalishni `resolveTarget` tanlaydi; `VITE_DEV_PROXY=false` o'chiradi.

Proxy xatolari `x-apiforge-proxy-error` header'i bilan belgilanadi va `HttpRequestFailure`
ga aylantiriladi — ular target'ning javobi emas, shuning uchun response sifatida ko'rsatilmaydi.

Cloud Function proxy qo'shilganda faqat shu fayl o'zgaradi — chaqiruvchi kod
(`tabs-store.ts`) tegilmaydi.

`src/lib/interpolate.ts` — `{{variable}}` almashtirish. URL, header, param, body — hammasida
ishlatiladi, `sendRequest` ichida chaqiriladi.

## Keyingi qadamlar

1. Cloud Function proxy (SSRF himoyasi bilan) — README'dagi cheklovlarga qarang
2. Firestore persistence: collection'lar, environment'lar, history
3. Firebase Auth ekranlari
4. Environment tanlash UI + `{{var}}` autocomplete
5. Auth muharriri UI, form-data body
6. cURL import/export
