# APIForge

Web-based API client (Postman analogi), Firebase backend.

## Buyruqlar

```bash
npm run dev              # vite dev server (mode=development, .env.development)
npm run build            # tsc -b && vite build (mode=production, .env.production)
npm run build:dev        # dev muhiti uchun build
npm run lint             # oxlint
npm run emulators        # auth 9099, firestore 8080
npm run deploy:dev       # build:dev + hosting va firestore:rules -> apiforge-dev
npm run deploy:prod      # build + hosting va firestore:rules -> apiforge-prod
```

Muhitlar `.env.development` / `.env.production` orqali ajratiladi, project alias'lari
`.firebaserc` da (`dev`, `prod`; `default` = dev, ya'ni tasodifiy deploy prod'ga tushmaydi).

Build tekshiruvsiz o'zgarish qo'shilmasin — `npm run build` typecheck'ni ham bajaradi.

## Konvensiyalar

- **Kod izohlari yozilmaydi.** Tushuntirish chatda beriladi.
- Import alias: `@/*` → `src/*`
- Fayl nomlari: kebab-case (`request-panel.tsx`, `tabs-store.ts`)
- Komponentlar: named export, `PascalCase`
- Feature-first + clean architecture — pastdagi "Arxitektura" bo'limiga qarang
- Zustand store'lar: selector bilan o'qiladi (`useTabsStore((s) => s.tabs)`), butun store emas
- Tailwind: semantik tokenlar (`bg-card`, `text-muted-foreground`, `text-method-get`),
  hardcode rang yo'q. Tokenlar `src/index.css` da, `@theme inline` blokida.

## Arxitektura

Feature-first, har bir feature ichida clean architecture qatlamlari.

```
src/
  app/          ilova qobig'i — main, router, providerlar
  core/         yadro: domen primitivlari, config, utilitalar (feature'larga bog'liq emas)
  shared/       qayta ishlatiladigan "soqov" UI
  features/
    request/      domain → application → infrastructure → presentation
    tabs/
    collections/
    environments/
```

**Bog'liqlik qoidasi — ichkariga qarab:**

```
presentation ─┐
              ├──> application ──> domain
infrastructure┘
```

- `domain/` — tiplar, entity'lar, interfeyslar. Hech qanday framework, hech qanday I/O.
- `application/` — use case'lar va sof mantiq. `domain` ga tayanadi, `infrastructure` ga **yo'q**.
- `infrastructure/` — tashqi dunyo (fetch, Firestore). `domain` dagi interfeysni amalga oshiradi.
- `presentation/` — React komponentlar va store'lar.

`core/` va `shared/` hech qachon `features/` ga bog'lanmaydi. Feature'lar bir-birining
faqat ochiq API'siga (`features/<nom>/index.ts`) yoki `domain/` iga murojaat qiladi.

**Asosiy seam — transport almashtirish.** `features/request` shunday bo'lingan:

| Fayl | Vazifa |
|---|---|
| `domain/request-gateway.ts` | `RequestGateway` interfeysi + `HttpCall` |
| `application/build-http-call.ts` | `RequestDef` + scope → `HttpCall` (sof, I/O yo'q) |
| `application/send-request.ts` | use case: build → gateway → timeout/xato xaritalash |
| `infrastructure/fetch-request-gateway.ts` | brauzer `fetch` implementatsiyasi |
| `index.ts` | kompozitsiya: `createSendRequest(fetchRequestGateway)` |

Cloud Function proxy qo'shilganda **yangi gateway yoziladi va `index.ts` da bitta qator
almashadi** — `build-http-call`, use case va butun UI tegilmaydi.

Dev server'da so'rov `vite.config.ts` dagi `apiforge-dev-proxy` plagini orqali o'tadi
(`/__apiforge_proxy?target=…`), shuning uchun CORS to'sqinlik qilmaydi. Yo'nalishni
`resolveTarget` tanlaydi.

Bayroq — `__DEV_PROXY__`, uni plagin `command === 'serve'` bo'lgandagina `true` qilib
`define` qiladi. `import.meta.env.DEV` **ishlatilmaydi**: u `vite build --mode development`
da ham `true` bo'lib qoladi va deploy qilingan ilova mavjud bo'lmagan proxy yo'liga
murojaat qilardi. Ya'ni proxy har qanday build'da o'chiq, faqat dev server'da yoqiq.

Proxy xatolari `x-apiforge-proxy-error` header'i bilan belgilanadi va `HttpRequestFailure`
ga aylantiriladi — ular target'ning javobi emas, shuning uchun response sifatida ko'rsatilmaydi.

`features/request/application/interpolate.ts` — `{{variable}}` almashtirish. URL, header,
param, body — hammasida ishlatiladi, `build-http-call` ichida chaqiriladi.

**Ma'lum bo'shliq:** `tabs-store` `sendRequest` ni `scope` uzatmasdan chaqiradi, shuning
uchun interpolation hozircha hech nima almashtirmaydi. Environment feature'i qo'shilganda
ulanadi.

## Keyingi qadamlar

1. Cloud Function proxy (SSRF himoyasi bilan) — README'dagi cheklovlarga qarang
2. Firestore persistence: collection'lar, environment'lar, history
3. Firebase Auth ekranlari
4. Environment tanlash UI + `{{var}}` autocomplete
5. Auth muharriri UI, form-data body
6. cURL import/export
