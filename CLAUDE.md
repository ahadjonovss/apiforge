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

## To'plam konfiguratsiyasining merosi

To'plamning `baseUrl`, `headers` va `auth` sozlamalari endpointga **nusxalanmaydi** —
so'rov yuborilayotganda qo'llanadi. Shuning uchun `baseUrl` o'zgarsa, barcha endpointlar
darhol yangi manzilga qaraydi.

`InheritedConfig` tab ichida saqlanadi (`Tab.inherited`) va `sendRequest` ga
`options.inherited` bo'lib uzatiladi. `collection-page` to'plam o'zgarganda
`syncInherited` orqali ochiq tablarni yangilaydi.

`build-http-call` da qoidalar:

- **URL** — `joinUrl(baseUrl, request.url)`. Absolyut URL (`https://…`) base'ni
  butunlay e'tiborsiz qoldiradi, nisbiy yo'l esa unga ulanadi. Slashlar ikkilanmaydi.
- **Headerlar** — avval to'plamniki, keyin endpointniki. Bir xil nom bo'lsa
  endpoint g'olib.
- **Auth** — faqat `mode === 'inherit'` bo'lganda meros olinadi. `none` aynan
  "auth yo'q" degani, meros emas.

Yangi endpointlar `auth: { mode: 'inherit' }` va bo'sh `url` bilan yaratiladi.
URL maydonida base prefiks sifatida ko'rinadi, lekin tahrirlanmaydi.

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

## Konfiguratsiya qayerda turadi

Firebase web konfiguratsiyasi `core/config/firebase-config.ts` da, `.env` faqat
ustidan yozadi. Sabab: Vercel repodagi `.env.*` fayllarini build'ga bermaydi,
faqat dashboard'dagi o'zgaruvchilarni beradi — bo'sh `apiKey` esa
`auth/invalid-api-key` bilan butun ilovani ishga tushirmay qo'yadi.

Bu qiymatlar maxfiy emas: ular baribir klient bundle'iga tushadi, himoya esa
`firestore.rules` va Auth orqali. Shu sababli ularni kodda saqlash xavf emas,
lekin deploy'ni bitta tashqi sozlamaga bog'liqlikdan xalos qiladi.

Xuddi shunday, `VITE_PROXY_PATH` berilmasa production build `/api/proxy` ni
ishlatadi.

## Proxy

Ikki implementatsiya, bitta shartnoma (`?target=…`, xato `x-apiforge-proxy-error`
va `x-apiforge-error-code` bilan):

| Muhit | Yo'l | Qayerda |
|---|---|---|
| dev server | `/__apiforge_proxy` | `vite.config.ts` plagini |
| Vercel | `/api/proxy` | `api/proxy.ts` serverless funksiya |

Tanlovni `VITE_PROXY_PATH` qiladi; bo'sh bo'lsa to'g'ridan-to'g'ri `fetch`.

**Vercel proxy'sida SSRF himoyasi shart**, chunki u ochiq internetda turadi.
`api/_guard.ts` sof funksiya — shuning uchun sinaladi. Ikki qatlam: URL tekshiruvi
(protokol, `localhost`, private IP literal) va DNS'dan keyin **yechilgan IP**
tekshiruvi — ommaviy domen private manzilga ishora qilishi mumkin. Redirect'lar
qo'lda kuzatiladi va har bir hop qayta tekshiriladi; aks holda ochiq redirect
butun himoyani bir qadamda chetlab o'tardi.


Dev server'da so'rov `vite.config.ts` dagi `apiforge-dev-proxy` plagini orqali o'tadi
(`/__apiforge_proxy?target=…`), shuning uchun CORS to'sqinlik qilmaydi. Yo'nalishni
`resolveTarget` tanlaydi.

Bayroq — `__DEV_PROXY__`, uni plagin `command === 'serve'` bo'lgandagina `true` qilib
`define` qiladi. `import.meta.env.DEV` **ishlatilmaydi**: u `vite build --mode development`
da ham `true` bo'lib qoladi va deploy qilingan ilova mavjud bo'lmagan proxy yo'liga
murojaat qilardi. Ya'ni proxy har qanday build'da o'chiq, faqat dev server'da yoqiq.

Proxy xatolari `x-apiforge-proxy-error` header'i bilan belgilanadi va `HttpRequestFailure`
ga aylantiriladi — ular target'ning javobi emas, shuning uchun response sifatida ko'rsatilmaydi.

## Javobdan o'zgaruvchiga olish (capture)

Postman'ning test skriptlari o'rnini bosadi. `RequestDef.captures` — qoidalar
ro'yxati: javob body'sining JSON yo'li yoki header nomi → to'plam o'zgaruvchisi.

`application/apply-captures.ts` sof funksiya: qoidalar + javob → olingan
qiymatlar va **sabablari bilan** o'tkazib yuborilganlar. Jimgina muvaffaqiyatsizlik
yo'q — javob JSON bo'lmasa yoki yo'l topilmasa, javob panelida ko'rinadi.

Oqim: `tabs-store.send` javobdan qiymatlarni ajratadi va tabga yozadi →
`collection-page` ularni `captureVariables` orqali to'plam o'zgaruvchilariga
saqlaydi → `clearCaptures` bilan tozalaydi. Shu sababli tabs feature'i
collections'ga bog'lanmaydi, aksincha collections tabs'dan o'qiydi.

Yo'l sintaksisi: `access_token`, `data.tokens.0.access`, `data.tokens[1].access`,
`$.` prefiksi ham qabul qilinadi.

## Avtomatik saqlash

Endpoint tahrirlanganda 800ms tinchlikdan keyin o'zi saqlanadi. Qo'lda "Saqlash"
tugmasi yo'q, o'rniga holat ko'rsatiladi: Saqlanmagan → Saqlanmoqda → Saqlandi.

**`Tab.revision` nima uchun kerak.** Saqlash tugagach `dirty` ni tozalash uchun
"o'shandan beri yana yozildimi?" degan savolga javob kerak. Buni `updatedAt`
bilan solishtirish **noto'g'ri**: u `Date.now()` dan olinadi, ikki tez tahrir
bir xil millisekundga tushadi va eski saqlash yangi o'zgarishni "saqlangan"
deb belgilab yuboradi — matn jimgina yo'qoladi. Shuning uchun har `patchRequest`
da monoton `revision` oshiriladi va `markSaved(tabId, revision)` faqat raqam
mos kelgandagina tozalaydi.

`autoSave` umumiy `pending` bayrog'iga tegmaydi — aks holda fon saqlashi
boshqa tugmalarni "yuklanmoqda" holatiga tushirardi va `run()` ichidagi
`pending` tekshiruvi saqlashni bloklardi.

`beforeunload` saqlanmagan tab bo'lsa sahifani yopishdan ogohlantiradi.

Collection bosh sahifasi bundan mustasno — u ochiq tahrir rejimiga
(Saqlash/Bekor) ega, ya'ni foydalanuvchi ataylab kiradi va chiqadi.

## Tillar

`core/i18n` — uch til: `uz` (asos), `ru`, `en`. Kutubxona ishlatilmagan:
lug'atlar oddiy obyekt, `translate` sof funksiya, React qatlami esa kichik
provider. Tanlov `localStorage` da, boshlang'ich qiymat `navigator.languages`
dan aniqlanadi.

**To'liqlikni kompilyator tekshiradi:** `ru` va `en` `typeof uz` deb
tiplangan, ya'ni yetishmagan yoki xato yozilgan kalit runtime'da emas,
build'da yiqiladi.

React'dan tashqarida hosil bo'ladigan xabarlar (Firebase auth kodlari,
Firestore xatolari, zod sxemalari, tarmoq xatolari) **kalit** saqlaydi va
ko'rsatilayotgan joyda tarjima qilinadi. `RequestError` va `DataErrorDetail`
da `params` bor — host, email yoki davomiylik istalgan tilda o'rniga qo'yiladi.

Noma'lum kalit o'zini qaytaradi, shuning uchun oddiy jumla ham `t()` dan
o'tkazilsa buzilmaydi.

## Hujjatlar

Uch daraja, hammasi markdown:

| Qayerda | Maydon | Ko'rinishi |
|---|---|---|
| To'plam | `ApiCollection.docs` | Collection bosh sahifasi — to'plam ochilganda birinchi shu chiqadi |
| Endpoint | `RequestDef.docs` | **Docs** tugmasi — alohida to'liq sahifa |
| Status kod | `RequestDef.responseDocs[]` | Javob panelining tepasida, **doim ko'rinadi** |

`responseDocs` da `status` **matn**, chunki `4xx` kabi guruhlar ham yoziladi.

Misol tanasi **xom JSON** sifatida saqlanadi va CodeMirror JSON muharririda
tahrirlanadi — sintaksis bo'yash, tartiblash tugmasi va buzuq JSON haqida
ogohlantirish bilan (ogohlantirish saqlashga to'sqinlik qilmaydi, chunki javob
har doim ham to'g'ri JSON bo'lavermaydi).

Eski yozuvlar markdown ``` bloklari ichida edi; `stripFence` ularni o'qishda
ochib beradi, ya'ni migratsiya kerak emas.

Javob paneli **faqat tanasi yozilgan** misollarni ko'rsatadi (`hasExampleData`),
oxirida `+` tugmasi bilan. Yangi kod qo'shilayotganda yozuv hali bo'sh bo'ladi —
shuning uchun ochiq turgani istisno qilinadi, aks holda yozayotganingizda
qatordan yo'qolib ketardi. Yopilganda bo'sh yozuv `pruneEmptyExample` bilan
o'chiriladi, ya'ni tasodifiy bosishlardan bo'sh yozuvlar to'planib qolmaydi.
Javob kelganda mos kod ajratiladi, «Javobni saqlash» tugmasi esa haqiqiy javobni
o'sha kod misoliga aylantiradi (JSON bo'lsa chiroyli formatlab, ```json blokka o'rab).
Tahrirlash ham shu yerda — hujjat tasvirlayotgan javobning yonida.

Endpoint hujjati esa **Docs** tugmasi ostida alohida to'liq sahifada: nomi, metodi,
hal qilingan manzili, markdown matn va pastda barcha javob misollari birga.

Markdown `react-markdown` bilan render qilinadi — u React element yasaydi,
`dangerouslySetInnerHTML` ishlatmaydi, ya'ni foydalanuvchi yozgan matn XSS
manbasi bo'lolmaydi. Sanitizatsiya kutubxonasi shu sababli kerak emas.

Postman import'da `item.description` → endpoint docs, `response[]` misollari →
`responseDocs` (body ```json blokka o'raladi). Bular ilgari tashlab
yuborilardi.

## Postman import

`features/import` — Postman Collection v2.x JSON'ini o'qiydi.
`application/parse-postman.ts` sof funksiya: JSON matnini `ImportPlan` ga aylantiradi,
hech narsani saqlamaydi. `application/import-service.ts` esa rejani `ImportSink`
porti orqali yozadi; portni `composition.ts` da collections gateway'i qondiradi.

Format juda mos tushadi: Postman'ning ichma-ich `item` daraxti bizning
`parentId` papkalarimizga, `{{variable}}` sintaksisi esa `interpolate.ts` ga
**aynan** to'g'ri keladi. Collection darajasidagi auth/header/variable — bizning
`InheritedConfig` merosimizga.

Mos kelmaydigan joylar ogohlantirish sifatida qaytariladi, jimgina tashlab
ketilmaydi: pre-request/test skriptlari (bizda JS ijro etuvchi yo'q), OAuth2/AWS/
NTLM/Digest auth, fayl body'lari va form-data ichidagi fayl maydonlari. GraphQL
body JSON'ga o'giriladi (bu ham ogohlantiriladi).

Parser buzuq ma'lumotda yiqilmaydi: notanish metod GET ga, notanish auth `none` ga
tushadi, `info` yo'q fayl esa aniq xato bilan rad etiladi.

## Xatolarni tasniflash

`RequestError` da `kind`, `title`, `message` va ixtiyoriy `hint` bor. Foydalanuvchi
hech qachon xom tizim xatosini ko'rmaydi (`getaddrinfo ENOTFOUND …` kabi).

Proxy tarmoq xatosi yuz berganda kodni `x-apiforge-error-code` header'ida qaytaradi
(`ENOTFOUND`, `ECONNREFUSED`, `CERT_HAS_EXPIRED` va h.k.).
`application/describe-error.ts` uni o'qiladigan xabarga aylantiradi. Bu sof funksiya —
tarmoqqa ham, React'ga ham bog'liq emas.

Notanish kod uchraganda funksiya yiqilmaydi: `network` turiga tushadi va baribir
host nomi bilan ma'noli xabar beradi. Proxy ishlatilmayotgan bo'lsa (production build),
brauzerning `Failed to fetch` xatosi `cors` deb tasniflanadi — sababi deyarli har doim
shu.

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
