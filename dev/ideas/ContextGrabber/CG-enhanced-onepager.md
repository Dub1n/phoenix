# contextgrabber — one‑pager (slim mvp)

**what it is**
contextgrabber makes quotes travel with their nearby context. you share a short link that renders a clean card: the quote, automatic ±2 sentences of neutral context (alongside any author‑chosen snippet), a source link, a timestamp, and a simple drift badge if the live page no longer matches.

---

## why now

* quotes on social lose context; misunderstandings and pile‑ons follow.
* platforms don’t run your js—only link previews. so we focus on a share url with excellent open‑graph metadata and a fast, verifiable click‑through.

**goal:** make it easy to be fair when quoting, and easy to verify.

---

## how it works (v1)

1. **create** with a chrome extension: select text → choose context policy (*author* or *auto ±2*) → create share (short link copied).
2. **store** a compact record with robust text anchoring (W3C TextQuote selector: exact + prefix/suffix) and an archive url captured at creation.
3. **render** a server‑side card with strong OG tags so previews look good everywhere.
4. **verify**: if the live page changes, the card shows drift: changed and links to the archived capture.

---

## safeguards (pitfalls addressed)

* **selector fragility →** exact‑match first; if it fails, use archive (honest fallback).
* **link rot →** save a capture on create (memento/ia/perma.cc).
* **cherry‑picking →** show *author* and *auto* context as tabs with a disclosure chip.
* **platform limits →** rely on OG previews; hosted render handles the rest.
* **copyright/robots →** short defaults, always link through, and a simple site/page opt‑out (`<meta name="contextgrabber" content="noembed">`).

---

## who it’s for (initial wedge)

* **newsrooms & journalists**
* **newsletter authors / researchers**
* **advocacy & policy comms**

---

## adoption path

* **chrome extension first** (fastest creation flow).
* **phase 2:** cms plugins (wordpress/ghost/substack) + oembed + light branding.

---

## benefits

* **reader trust:** verifiable context; archived fallback when pages change.
* **fewer disputes:** a single, stable reference object for the quote.
* **light analytics:** views + source click‑through (privacy‑respecting).

---

## build & timeline

**mvp (2 weeks):** exact selectors, archive on create, server‑rendered card with OG tags, chrome extension, binary drift badge, minimal counters.
**phase 2 (3–6 weeks):** publisher plugins, oembed, basic branding options.

**90‑day targets:** 5k shares, ≥40% click‑through to source, ≤10% drift‑changed, 2 newsroom pilots, 100+ extension installs.

---

## tech snapshot

* **selectors:** TextQuote (exact + prefix/suffix) + optional css hint.
* **durability:** archive url on create; drift states: `ok` | `changed`.
* **stack:** typescript (node/react), cloudflare workers/pages + cdn, small kv/sql index, prerendered OG image.

---

## call to action

seeking pilot partners (editors, newsletters, policy orgs) to validate the mvp in real workflows. we’ll handle setup and provide case‑study metrics.
contact: [hello@contextgrab.ber](mailto:hello@contextgrab.ber) · demo: [https://contextgrab.ber/demo](https://contextgrab.ber/demo) (stub)
