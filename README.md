# Ateliê

Estoque, geração de fotos e busca de tamanho. One Next.js app, deployed as a single Render Web Service.

| Surface | Who | Route | Auth |
|---|---|---|---|
| Estoque / Peça / Gerar / Nova peça | her, alone | `/`, `/pecas/*` | password cookie |
| Achar meu tamanho | customers | `/tamanho` | none — it's a WhatsApp link |

Customers never install anything. That constraint is why this is a PWA, not a native app.

---

## Deploy to Render

1. Push this repo to GitHub.
2. Render → **New Web Service** → pick the repo. It reads `render.yaml`.
3. Set the env vars (below) in the Render dashboard.
4. Deploy. Health check is `/api/health`.

### Use the Starter plan, not Free

Render's free tier spins the service down after ~15 minutes idle. Her first "Gerar" tap after a quiet morning would sit through a 30–60 second cold start and she'd assume it's broken. $7/mo fixes it. This is the single highest-value $7 in the project.

Region `frankfurt` is Render's closest to Dubai/Riyadh.

### Env vars

```
REPLICATE_API_TOKEN=r8_...        # server only
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...       # server only, bypasses RLS
APP_SHARED_SECRET=<long random>   # this is also her login password
LOGO_URL=https://.../logo.png     # transparent PNG

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Anything without `NEXT_PUBLIC_` stays on the server. Keep it that way.

### Database

Supabase, not Render Postgres — images want object storage with a CDN in front, not a Node process serving files off a disk.

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Then create a **public** storage bucket named `generated`, and one named `brand` for the logo.

---

## The one rule

**`REPLICATE_API_TOKEN` never leaves the server.** The browser calls `/api/generate`; the route calls Replicate. If you're ever tempted to call Replicate straight from the phone to "keep it simple": the token ships inside the APK and anyone can unzip it.

`lib/auth.js` is one password for one person, by design. It exists to stop a stranger who finds the URL spending your Replicate credits — not to be a hardened auth system. Swap it for Supabase Auth the day a second person needs access.

## Spend guard

`generation_budget` caps the day at $5. The route checks before calling and records after, so a stuck retry loop on her phone can't drain the account overnight.

`EST_COST_PER_IMAGE_USD` in `app/api/generate/route.js` is an **estimate** — confirm it on the model page. The cap is only as honest as that number.

---

## Installable APK, no Play Store

1. Deploy, confirm the PWA installs from Chrome ("Install app" in the menu).
2. **pwabuilder.com** → paste the URL → package for Android → signed APK.
3. **Save the signing key.** Lose it and you can't ship updates to an installed app — she'd have to uninstall and reinstall.
4. Send her the `.apk` on WhatsApp. She allows "install from unknown sources" once.

Web updates reach her instantly without a new APK, as long as the manifest hasn't changed.

Register the service worker once, in a client component:
```js
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
```
It deliberately never caches `/api/*` — stale stock is worse than no stock.

---

## Things that will bite you if you don't know them

**`print_description` is not optional.** It goes straight into the image prompt. The toucan grid survived generation because the motifs were described explicitly — toucans, bananas, palms, square borders, the colours. Blank it and the generator invents a print that merely rhymes with the real one. The new-piece form treats it as a first-class field for exactly this reason.

**Don't edit the prose in `lib/presets.js` → `RECIPE`.** Four generations with four different models produced an identical frame because those lines went through verbatim. The one that dropped the FRAMING line cut the model's head off.

**Coverage is a composition, not an outfit.** `sarong` and `cropped` specify what the frame *contains*. "A kaftan over the bikini" was tried and returned a sheer open robe that covered nothing, because resortwear photography is built to show the swimwear.

**There is no `gulf` market preset.** Tested; the casting read closer to South Asian than Khaliji. Re-add only with evidence.

**Always keep the real flat-lay in the listing.** Generated prints are faithful but reinterpreted — motif placement shifts. The flat-lay is the honest record of what she's actually selling.

**Stock toggles are optimistic and roll back on failure.** She's standing in a shop; a round-trip before the chip moves feels broken. But a silent failure would be worse, so a failed save reverts the chip and says so.

---

## Languages

Her screens (`/`, `/pecas/*`) are pt-BR only — she's the sole user and translating them is work nobody reads.

`/tamanho` is **pt-BR, English and Arabic**. Locale comes from `?l=pt|en|ar`, falling back to the browser's `Accept-Language`, falling back to pt. A visible switcher lets the customer override — an Arabic speaker on an English handset is common enough in the Gulf that auto-detection alone isn't enough.

Four things change per locale, not one:

1. **Strings** — `lib/i18n.js`.
2. **Direction** — `middleware.js` resolves the locale and passes it to the root layout as a header, so `<html lang>` and `<html dir>` are correct on the *document*, not just an inner div. A root layout gets no searchParams, which is why the middleware exists. Every directional utility in the customer components is logical (`ms`/`me`, `text-start`) so the markup mirrors itself; the back-arrow glyph is flipped by hand because `←` is a character, not a layout property.
3. **Size letters** — the DB stores `P/M/G` (Portuguese). Showing a Saudi customer "G" for large is meaningless, so `sizeLabel()` maps to `S/M/L` for en and ar. The size chip row is pinned `dir="ltr"` so S·M·L always reads small→large even on an RTL page.
4. **The shop named in question 2** — "Renner" is a Brazilian chain and means nothing in Riyadh. The question only works if it names a shop the person has actually bought clothes in, so en/ar say Zara / H&M instead.

**Have a native speaker read the Arabic before it goes live.** It's MSA, addressed to a female customer throughout (`تعرفينه`, `تواصلي`), which is right for a swimwear shop — but register and warmth are what a translator earns their fee on, and this hasn't had one.

Arabic renders in IBM Plex Sans Arabic. Inter has no Arabic coverage at all; without that face the page falls back to whatever the device happens to have and looks broken.

Schema is ready for more: `products.description` is jsonb by locale, `size_quiz.locale` is recorded. Product names stay plain — "Tucano" reads the same everywhere.

## Privacy

`size_quiz` stores no name, phone, photo or measurements — only what improves the recommendation. Schedule the 14-day delete noted in `db/schema.sql`. Don't add a photo upload field later; the whole design rests on not asking for one.
