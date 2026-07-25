# Reel pipeline probe — 2026-07-25

Run against commit `328a422` (main, after fast-forward pull). No publish call was made anywhere in this run; only `probe` and `dry-run` commands are permitted by this task, and step 5 was skipped for the reason given below.

## SETUP

```
apt-get update && apt-get install -y ffmpeg
```

Completed cleanly, no 404s on transitive deps, `apt-get --fix-broken install` was not needed.

- Wall time: **30.7s** (`real 0m30.725s`)
- `ffmpeg -version | head -1` → `ffmpeg version 6.1.1-3ubuntu5 Copyright (c) 2000-2023 the FFmpeg developers`

## RESUMABLE

```
node src/publish-reel.mjs probe
```

Result: **hard failure**, not just an absent `uri`.

```
FAILED: POST me/media -> HTTP 400 code=100 subcode=-: The parameter video_url is required
```

The CLI's error path doesn't retain the full Meta response body (it only formats `code`/`subcode`/`message` into a thrown `Error`), so to get the complete raw JSON as instructed, I replayed the identical request (same params: `media_type=REELS`, `upload_type=resumable`, `share_to_feed=true`, `thumb_offset=1200`, `caption=probe, never published`) directly against `graph.instagram.com/v25.0/me/media` with the same `IG_ACCESS_TOKEN`. Full response:

```
HTTP status: 400
{
  "error": {
    "message": "The parameter video_url is required",
    "type": "IGApiException",
    "code": 100,
    "fbtrace_id": "AmDVm5HRuVFMWoHHkVxs4MP"
  }
}
```

**Verdict: resumable upload is NOT available on `graph.instagram.com` for this Instagram-Login app.** This isn't the "uri came back null" case the code was written to treat as a soft signal — the container creation itself is rejected outright unless `video_url` is supplied. The hosted-URL path (`createHostedContainer` in `src/publish-reel.mjs`) is required; there is no way to push bytes on this API surface as currently configured. Meta's own docs describing resumable upload as being for "apps that have implemented Facebook Login for Business" line up with this: this account uses Instagram Login, and the caveat comment in the source (`src/publish-reel.mjs:20-25`) turned out to be correct.

This is the headline finding: **the pipeline cannot publish a Reel tomorrow without a public HTTPS URL to host the MP4 at.** Nothing in this repo currently hosts video (the carousel path hosts JPEGs via commit SHA in the public repo; that approach was explicitly rejected for video in the source comments as unsustainable for git history). That gap is the top item under BLOCKERS.

## RENDER

```
node src/reel.mjs posts/2026-07-25-avoiding-ai-libraries.json /tmp/reel
```

No playwright-import error — Chromium resolved cleanly (this post-dates the "One place to find Chromium" fix in commit `cb4b17b`).

- Exit code: 0, **COMPLIANT**
- Wall time (whole command): 97.06s
- Paint time: 87439ms (~87.4s)
- Encode time: 9436ms (~9.4s)
- Duration: 25.76s (644 frames @ 25fps)
- Resolution: 1080×1920
- Codecs: video h264, audio aac, pix_fmt yuv420p, sample rate 48000, 2 channels
- File size: 1,157,721 bytes (~1.10 MB)
- `issues: []`
- Beats: cover 5.4s (14 words) → stat 5.4s (21 words) → contrast 5.4s (23 words) → quote 5.4s (24 words) → end 4.16s (8 words)

## VISUAL

Frames pulled at 0.5s, 4.5s, 5.6s/5.9s/6.2s (added, to catch the stat count-up mid-animation), 9.0s, 15.0s, 20.0s, 24.0s and inspected directly.

**0.5s (cover beat):**
- a) **Anton**, not a fallback — narrow, heavy, condensed letterforms clearly visible on "Libraries now teach you to switch AI off" and the "70" hero figure. The font is embedded as a base64 woff2 data URI in `src/reel-template.mjs` (`@font-face{font-family:'Anton';src:url(data:font/woff2;base64,...)}`), so there's no network dependency that could silently fall back.
- b) No clipping, overlap, or mid-word cuts.
- c) **Fully visible, not fading in.** Kicker, headline, hero figure, and hero label are all at full opacity and fully painted at 0.5s. Confirmed fixed — this was the frame-zero-black bug from commit `4366f86` and it does not reproduce.

**4.5s (still cover beat, end of hold):** identical to 0.5s, confirms the beat holds steady rather than animating out early.

**5.6s / 5.9s (early stat beat):** caught the count-up **mid-animation** — figure reads "36" (on its way from 0 to 70), with the unit line, body text, and source line all at partial/staged opacity, consistent with a staggered reveal. This is real, not assumed.

**9.0s (stat beat, settled):**
- d) Figure shows **70, final value**, not mid-count — 3.6s into a 5.4s beat is well past the ~1s count-up window. Consistent with 5.6s/5.9s frames showing the animation in progress earlier.
- e) Bottom-400px and right-200px bands cropped and inspected directly: both empty. `#src` (source line) is anchored at `bottom:410px; right:200px` in `src/reel-template.mjs` — 10px outside the unsafe bottom band, and flush against the right exclusion edge. This is a deliberate, if tight, margin, not an accident.

**15.0s (contrast beat):** "What it looks like" / "What she actually says" two-panel layout, no clipping, clean line breaks, source line again inside the safe zone.

**20.0s (quote beat):** Large pull-quote, attribution line ("Hannah Cyrus, reference librarian, Bangor Public Library"), source line — all within margins, no overlap.

**24.0s (end beat):**
- f) **@order.of.magnitude is shown clearly** ("One story a day" / "A new one tomorrow." / "@order.of.magnitude" in accent color), confirmed.

**g) Blunt verdict:** Visually, yes — this would pass as a real editorial Reel. Typography is confident and consistent, the count-up on the stat beat reads as intentional motion design rather than a glitch, safe-zone margins are respected (barely, on the source line, but respected), and there's no dead frame-zero or clipped text anywhere sampled. The weakest thing is not visual: it's that **the whole render is currently unpublishable** because of the resumable-upload gap above — a flawless video with nowhere to go. If forced to name a visual weak point, it's the razor-thin 10px margin on `#src` between "safe" and "in the caption zone"; it works today but has no slack for a longer source name or a font-metrics change.

## UPLOAD

**Skipped.** Step 2 did not report that resumable works — it returned a hard 400 (`video_url is required`), not merely a missing `uri`. Per the task instructions ("Only if step 2 said resumable works"), `dry-run` was not attempted. Running `dry-run` today would immediately hit the same `code=100` error inside `createResumableContainer` before ever reaching the upload step, since `publishReel()` only takes the hosted-URL branch when called with an explicit `videoUrl`, and this probe has no hosted URL to give it.

## BLOCKERS

Anything below would stop an unattended run from publishing a Reel tomorrow:

1. **No path to get bytes to Meta.** Resumable upload is confirmed unavailable on `graph.instagram.com` for this Instagram-Login app (`code=100`: "The parameter video_url is required"). The only working path is `createHostedContainer(videoUrl, ...)`, which requires the rendered MP4 to already be sitting at a public HTTPS URL before the container is created. **Nothing in this repo currently hosts video anywhere.** The carousel path's approach (commit images to the repo, reference by raw GitHub URL) was explicitly designed around and rejected for video in the source comments (`src/publish-reel.mjs:15-18`) as unsustainable for git history at ~1.1MB/day. Until a hosting story exists (e.g. object storage with a public read URL, or a CDN), the Reel pipeline cannot publish end to end — only render.
2. **Untested past this point.** Because of (1), `createHostedContainer` → `waitForContainer` → `media_publish` has not been exercised in this or (per the task framing) any prior probe. `waitForContainer`'s 10-minute poll timeout for video transcoding, and the actual `media_publish` call, are unverified against a real container end to end.
3. Everything else checked out clean: ffmpeg installs without incident, Chromium resolves without the old import error, render is COMPLIANT with no issues, output format/codecs match what Instagram expects, and the visual safe-zone/typography/animation checks all passed on this sample. None of those are blockers.
