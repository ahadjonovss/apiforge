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
    auth/         domain → application → infrastructure → presentation
    workspaces/   ish maydonlari, a'zolar, jamoalar
    collections/  API to'plamlari va endpointlar
    users/        email → uid katalogi (a'zo qo'shish uchun)
    request/      so'rov yuborish
    profile/ tabs/ environments/
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

## Auth

`features/auth` xuddi `request` kabi tuzilgan: `AuthGateway` interfeysi domain'da,
`firebaseAuthGateway` infrastructure'da, `createAuthService(gateway)` esa validatsiyani
qo'shib beradi. Kompozitsiya `features/auth/composition.ts` da (index.ts da emas —
`auth-store` uni import qilgani uchun sikl hosil bo'lardi).

Validatsiya zod sxemalari `application/schemas.ts` da. Formalar react-hook-form +
`zodResolver` orqali o'sha sxemalarni ishlatadi, ya'ni qoidalar bir joyda.

Firebase xato kodlari (`auth/invalid-credential` va h.k.) gateway ichida
`AuthErrorKind` ga xaritalanadi — UI hech qachon Firebase kodini ko'rmaydi.

**Marshrut himoyasi:** `RequireAuth` komponenti `status` ga qaraydi va `anonymous`
bo'lsa `/login` ga yo'naltiradi. Router `beforeLoad` ishlatilmaydi, chunki auth holati
Firebase'dan asinxron keladi.

**5 soniyalik timeout.** `auth-store.init` obunani qo'yadi va taymer ishga tushiradi;
Firebase 5s ichida javob bermasa status `anonymous` ga o'tadi. Sababi: Firebase Auth
IndexedDB'ga tayanadi va u bloklangan muhitlarda (private rejim, ba'zi ichki brauzerlar,
headless Chrome) na xato, na javob qaytaradi — bunda ilova abadiy spinnerda qolardi.
Kechikkan javob kelsa status o'zi to'g'rilanadi.

## Ma'lumot modeli

```
users/{uid}                                              email → uid katalogi
workspaces/{wid}                                         name, ownerId, memberIds[]
workspaces/{wid}/members/{uid}                           email, displayName, role
workspaces/{wid}/teams/{tid}                             name, memberIds[]
workspaces/{wid}/collections/{cid}                       name, baseUrl, headers, auth, variables
workspaces/{wid}/collections/{cid}/folders/{fid}         parentId, name, order
workspaces/{wid}/collections/{cid}/endpoints/{eid}       RequestDef (folderId bilan)
```

**Papkalar daraxti tekis saqlanadi.** Har bir papkada faqat `parentId` bor, ichma-ich
hujjat yo'q — shuning uchun ixtiyoriy chuqurlik bepul chiqadi va bitta `getDocs` butun
daraxtni oladi. Daraxt `application/tree.ts` da xotirada quriladi.

`buildTree` ikki xil buzuq holatga chidamli: **sikl** (a→b→a) va **yetim** (mavjud
bo'lmagan `parentId`). Ikkalasida ham tegishli tugun ildizga chiqariladi, ya'ni
ma'lumot ko'rinmay qolmaydi va rekursiya cheksizlikka ketmaydi. Papkani o'z avlodiga
ko'chirish `moveFolder` da rad etiladi.

Papkani o'chirish kaskadli: `descendantFolderIds` butun ostki daraxtni yig'adi,
undagi endpointlar ham o'chadi. Bu mantiq application qatlamida, gateway esa faqat
berilgan id'lar ro'yxatini o'chiradi.

`memberIds` massivi workspace hujjatining o'zida turadi, chunki `firestore.rules`
a'zolikni aynan shundan tekshiradi (`request.auth.uid in workspace.data.memberIds`).
Subkolleksiyalarga ruxsat bitta `match /{document=**}` qoidasi orqali beriladi.

**`users/` katalogi nega kerak.** Odamni jamoaga biriktirish uchun email'dan `uid`
topish kerak, Firebase Auth esa buni klientdan bermaydi (faqat Admin SDK). Shuning
uchun har kirishda `users/{uid}` yangilanadi va qoidalar uni har qanday tizimga
kirgan foydalanuvchiga o'qishga ruxsat beradi. Bu ataylab qilingan yon berish:
katalogda faqat email, ism va avatar bor.

`workspaces` ro'yxati `memberIds array-contains` + `createdAt desc` bo'yicha
so'raladi — bu kompozit indeks talab qiladi, u `firestore.indexes.json` da.
Emulyator indekssiz ham ishlaydi, real Firestore esa yo'q.

## Proxy

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

1. **Firebase konsolida Authentication'ni yoqish** — `apiforge-dev` da xizmat hali
   provisioning qilinmagan (`CONFIGURATION_NOT_FOUND`). Email/parol usuli yoqilmaguncha
   login va register real project'da ishlamaydi; emulyatorda ishlaydi.
2. Firestore persistence: collection'lar, environment'lar, history
3. Cloud Function proxy (SSRF himoyasi bilan) — README'dagi cheklovlarga qarang
4. Environment tanlash UI + `{{var}}` autocomplete
5. Auth muharriri UI (so'rov auth'i), form-data body
6. cURL import/export
