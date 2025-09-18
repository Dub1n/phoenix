# contextgrabber — author-driven anchors

**version:** 2.0
**date:** 2025-09-18
**status:** proposal

---

## 1) purpose

**make quotes carry their intended framing.** authors add lightweight markers to their pages; when readers share a quote, the share links to a **hosted card** that shows the verbatim quote plus the precise, author-selected context. the card renders well as a social link preview (open graph), and expands to an interactive page on click.

> scope note: this proposal intentionally omits any automatic context generation. every context block originates from the author’s explicit anchors. (original draft framed this as solving *sharing integrity* vs. truth arbitration)

---

## 2) outcomes & success criteria (first 90 days)

* **publisher adoption:** 2 pilot newsrooms + 3 independent blogs using the plugin.
* **usage:** 5k total shares; ≥40% source click-through from cards.
* **integrity:** ≤10% drift warnings (see §7) on viewed shares.
* **ergonomics:** avg. <20s to create a share via extension/composer.

---

## 3) core principles

* **deterministic context.** no fuzzy extraction; author intent is the source of truth.
* **durable linking.** selectors survive minor edits; archived snapshots backstop changes.
* **platform-realistic.** social feeds don’t run our JS; we rely on link previews + hosted renderer.
* **transparent state.** badges disclose when a page changed since sharing.
* **minimal friction.** a one-line script/plugin for publishers; a one-click composer for authors.

---

## 4) user stories

1. **author:** i mark a paragraph/span as the canonical context for a claim. when someone shares a quote from the page, my marked context appears with it.
2. **reader:** i select a quote; the extension packages it with the author’s context, producing a short, shareable link.
3. **reviewer:** if the source page changes, i see a drift badge and can view the archived capture.

---

## 5) terminology

* **anchor:** an attribute marking a block as context-eligible (e.g., `data-cg="id:intro-1;role:context"`).
* **selection:** the exact quoted text chosen by the sharer.
* **share:** an immutable record containing `url`, `quote_text`, `selectors`, `context_refs`, `source_hash`, `archive_url`, and `created_at`.
* **renderer:** a hosted page that shows the card; also controls OG metadata for previews.

---

## 6) author markup (publisher-side)

### 6.1 minimal attributes

authors add `data-cg` to any element that can serve as context.

```html
<p data-cg="id:p-12;group:intro;role:context">
  this paragraph clarifies the quoted claim with numbers and caveats…
</p>

<span data-cg="id:q-cta;role:note">definition used by this section…</span>
```

* `id:` stable within the page (must be unique).
* `role:` `context` | `note` (both are eligible; `note` renders compact).
* `group:` optional; used for ordering & proximity (e.g., intro, methods, results).

### 6.2 inline vs referenced placement

your original draft listed two ways to control placement; we formalize them (and their fallback) here.&#x20;

* **inline anchors**: place `data-cg` on the exact element near the prose.
* **ref anchors**: place anchors anywhere, then add a reference near the prose:

```html
<a href="#cg:context:p-12" data-cg-ref="p-12">[context]</a>
```

**placement resolution:**

1. if a selection overlaps an inline anchor → use that anchor’s block(s).
2. else if a `data-cg-ref` exists within the same section container → resolve to its target.
3. else → use page-level default anchors (`data-cg-default="true"`) if provided.
4. else → no context (share still allowed, disclosed as “no author context found”).

---

## 7) selectors, durability & drift

### 7.1 selector bundle (stored with each share)

* **TextQuoteSelector**: `exact`, `prefix`, `suffix` (per W3C Web Annotation).
* **TextPositionSelector**: character `start`/`end` offsets relative to the canonicalized text.
* **DOM anchor**: closest stable element `id` or `xpath/css` (as weak hints).
* **ContextRefs**: list of author anchor ids selected by placement rules.

### 7.2 resolution algorithm (client/renderer)

1. fetch page (respect robots, cache etag).
2. try **TextQuote** fuzzy match (Levenshtein ≤2 for minor edits).
3. confirm with **TextPosition** if ranges still consistent.
4. if mismatch → mark **drift** and prefer archived capture.
5. render selected **ContextRefs**; if missing, mark **drift** for context.

### 7.3 drift handling

* **badge:** `ok` | `changed` (quote moved/edited) | `context-missing`.
* **archive:** store `archive_url` at share time (memento/perma.cc or first-party snapshot).
* **hash:** SHA-256 of the normalized source block text; mismatch → `changed`.

---

## 8) rendering & distribution

### 8.1 hosted card (server-rendered)

* top: **quote block** (typographic emphasis, copy button, source URL, timestamp).
* middle: **context block(s)** (collapsible if >N chars; “show N more sentences”).
* footer: **source controls** (open live page, open archive, drift badge).

### 8.2 social previews (open graph)

the share URL `https://cg.rdr/s/ks8j3n` returns OG tags:

```html
<meta property="og:title" content="“the exact quoted text…” — example.com">
<meta property="og:description" content="context: this paragraph clarifies…">
<meta property="og:url" content="https://cg.rdr/s/ks8j3n">
<meta property="og:type" content="article">
<meta property="og:image" content="https://cg.rdr/s/ks8j3n/card.png"> <!-- optional -->
```

### 8.3 accessibility & i18n

* quotes/context exposed with `<blockquote>` & `<aside>` semantics; `lang` propagation.
* include transcript text in OG description for non-image previews.

---

## 9) creator ergonomics

### 9.1 publisher SDK (1-line)

```html
<script async src="https://cdn.contextgrabber.dev/sdk/v1.js" data-cg-site="SITE_ID"></script>
```

* adds a **“quote with context”** button to selected elements in CMS editors, driven by anchors.
* validates `data-cg` syntax on publish; warns on missing/duplicate ids.

### 9.2 plugins

* **wordpress**, **ghost**, **substack**: expose a sidebar to mark context blocks, auto-insert `data-cg`, and publish-time validation.

### 9.3 composer / browser extension

* highlights author anchors; lets the sharer pick which to include when multiple qualify.
* packages selectors + context refs → POSTs `/shares`.

---

## 10) legal, safety, and privacy

* **copyright/fair use:** default context cap (e.g., 800 chars per block). always link through. honor site-level opt-out:

  ```html
  <meta name="contextgrabber" content="noembed">
  ```

* **robots/policies:** renderer respects `noarchive` by omitting first-party snapshots (still stores selectors).
* **PII guard:** client-side scan (regex/heuristics) warns authors when an anchor likely leaks PII; soft block with override & audit trail.
* **abuse control:** rate-limits per site; signed shares (see §12) to prevent tampering.

---

## 11) data model (v0.2)

```json
{
  "id": "ks8j3n",
  "url": "https://example.com/article",
  "quote_text": "The exact quoted text…",
  "selectors": {
    "textQuote": { "exact": "…", "prefix": "…", "suffix": "…" },
    "textPosition": { "start": 1234, "end": 1290 },
    "dom": { "css": "#para-12" }
  },
  "context_refs": ["p-12","note-cta"],
  "source_hash": "sha256-…",
  "archive_url": "https://web.archive.org/web/20250918/…",
  "created_at": "2025-09-18T12:00:00Z",
  "display": { "truncate_chars": 280, "show_context": true },
  "signature": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.…"
}
```

---

## 12) trust & signatures (tamper-evidence)

* **format:** JWS (compact).
* **issuer:** either **service-signed** (default) or **org-signed** (publishers can upload a public key to sign their own shares).
* **payload fields:** `url`, `quote_text`, `selectors`, `context_refs`, `source_hash`, `created_at`, `display`.
* **verification:** renderer verifies signature before display; unsigned → clearly labeled.

---

## 13) API surface (v1)

* `POST /shares` → `{ id }`

  * body: the data model above (without `signature`); server signs & stores append-only.
* `GET /s/:id` → server-rendered HTML card (also returns OG tags).
* `GET /s/:id.json` → JSON share (for debugging/publisher QA).
* `HEAD /s/:id` → returns drift state in headers (`cg-drift: ok|changed|context-missing`).
* `POST /capture` (internal/queued) → request archive snapshot if allowed.

---

## 14) UI spec (quick)

* **quote block:** larger font, curly quotes optional, copy icon, monospaced source URL, timestamp.
* **context block:** label “context (by author)”, collapsible after N chars; small “expand N more” affordance.
* **badges:**

  * `ok` (green)
  * `changed` (amber: quote/context mismatch)
  * `archived` (blue: rendered from snapshot)
  * `no author context` (gray: rare; only if anchors not found at share time)

---

## 15) rollout plan (8 weeks)

**week 1–2:**

* selector engine (TextQuote/TextPosition + DOM hints + fuzz match).
* minimal renderer with OG tags + share store + service signing.
* alpha composer (extension) that reads anchors and posts `/shares`.

**week 3–4:**

* archive integration (memento/perma.cc; fallback first-party snapshot).
* drift detection + badges.
* wordpress plugin (mark anchors, validate on publish).

**week 5–6:**

* ghost/substack helpers.
* publisher SDK (1-line script) with editor affordances.
* PII heuristics + opt-out meta handling.

**week 7–8:**

* analytics (CTR to source, views, drift rate).
* pilot onboarding (2 newsrooms, 3 blogs).
* security review + rate-limiting.

---

## 16) risks & mitigations

* **editor churn (IDs change).** mitigation: authoring plugin pins stable ids and warns on renames.
* **legal pushback (fair use).** mitigation: conservative caps, link-through, publisher keys, site-level opt-out.
* **platform hostility to external links.** mitigation: crisp OG previews and strong on-page UX; extension and publisher embeds handle primary creation flows.
* **anchor omission (human error).** mitigation: plugin linting (e.g., “this claim sentence lacks a nearby context anchor”).

---

## 17) open questions (to resolve pre-build)

* preferred archive partner(s) & SLA?
* house policy for pages that disallow archiving (render live w/ “no archive” badge vs. block share)?
* max context length defaults per role (`context` vs `note`)?
* publisher key management UX (rotate, revoke, display verified badge)?

---

## 18) appendix — examples

### 18.1 authoring (article snippet)

```html
<p>
  the median wage increased by <span id="claim-01">3.2%</span> year over year.
  <a href="#cg:context:p-12" data-cg-ref="p-12">[context]</a>
</p>

<p id="p-12" data-cg="id:p-12;role:context;group:methods">
  methodology: CPI-U seasonally adjusted; excludes volatile categories; revised series v2.
</p>
```

### 18.2 minimal share JSON (human-readable)

```json
{
  "url":"https://news.example/wages-2025",
  "quote_text":"3.2%",
  "context_refs":["p-12"],
  "created_at":"2025-09-18T13:22:09Z"
}
```

### 18.3 OG preview (result)

> “3.2%” — example.com
> context: methodology: cpi-u seasonally adjusted; excludes volatile categories…

---

## 19) maintenance & governance (lite)

* **append-only shares**; never mutate, only supersede with new ids.
* **publisher dashboards** for anchor linting, drift stats, and key management.
* **transparency**: public docs on signature scheme, drift criteria, and fair-use policy.

---

### tl;dr for builders

* build the **selector engine**, **renderer with OG**, **/shares** API, **drift + archive**, and **cms plugins** first.
* keep everything deterministic, signed, and respectful of site policy.
* make creation one click and previews gorgeous—adoption follows.
