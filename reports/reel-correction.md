# Reel correction run — 2026-07-25

**Outcome: the flawed Reel could not be deleted through the API, so nothing was
published. Removing it is now a manual action on the phone, and it is the only
thing standing between the account and a live fabricated figure.**

The run followed branch **3b**. No new Reel was rendered, committed or published.

---

## What was wrong with the published Reel

Reel `18132234304542418` (https://www.instagram.com/reel/DbOaN6xCCXC/) carries a
stat beat whose figure counted up from zero on an easeOut ramp. easeOut
decelerates, so the animation spends its longest moments on 66, 67, 68, 69 before
settling on the sourced 70. A paused or scrubbed frame reads **"66 people at one
class"** at 300px under a TechCrunch credit. 66 appears in no source — not
TechCrunch, not the Bangor Daily News, nowhere.

The template fault itself is already fixed on `main` in commit `409043b`, which
replaced the arithmetic with a clip-path wipe over the sourced text and added a
test that greps the render loop for arithmetic on a figure. That fix protects
every *future* Reel. It does nothing to the file already sitting on Instagram's
CDN, which is what this run existed to remove.

---

## 1. Setup

| Step | Result |
|---|---|
| `npm install --no-audit --no-fund` | added 2 packages, clean |
| `npm test` | **27 passed, 0 failed**, 189 ms |
| `apt-get install -y ffmpeg` | `ffmpeg version 6.1.1-3ubuntu5` |

Green suite. No tests were edited. ffmpeg was installed but never needed, because
the run stopped at step 2.

---

## 2. The delete attempt, verbatim

```
$ curl -s -X DELETE "https://graph.instagram.com/v25.0/18132234304542418?access_token=$IG_ACCESS_TOKEN" -w '\nHTTP %{http_code}\n'

{"error":{"message":"Unsupported delete request. Object with ID '18132234304542418' does not exist, cannot be loaded due to missing permissions, or does not support this operation","type":"IGApiException","code":100,"error_subcode":33,"fbtrace_id":"AEJnbKS5hkWzR-5xSMHLb8G"}}
HTTP 400
```

- **code** 100
- **error_subcode** 33
- **type** IGApiException
- **fbtrace_id** AEJnbKS5hkWzR-5xSMHLb8G

### What the readback proved

A 400 is not self-explanatory here: Meta packs three unrelated causes into one
message ("does not exist", "missing permissions", "does not support this
operation"). The readback separates them.

```
$ curl -s "https://graph.instagram.com/v25.0/18132234304542418?fields=id,permalink,media_product_type&access_token=$IG_ACCESS_TOKEN"

{"id":"18132234304542418","permalink":"https:\/\/www.instagram.com\/reel\/DbOaN6xCCXC\/","media_product_type":"REELS"}
HTTP 200
```

The object **exists**, is **loadable with this exact token**, and is a REELS
object. So the first two clauses of the error message are boilerplate and false.
The refusal is the third clause and only the third: **DELETE is not a supported
operation on this object.**

A third call rules out the remaining confounder — wrong account:

```
$ curl -s "https://graph.instagram.com/v25.0/me?fields=id,username,account_type&access_token=$IG_ACCESS_TOKEN"

{"id":"37219989057646241","username":"order.of.magnitude","account_type":"BUSINESS"}
HTTP 200
```

Right account, right Reel, token good enough to read it, and delete still
refused. Meta's reference was **correct this time**: DELETE on a media object is
a Facebook-Login-path capability, and this account authenticates through
Instagram Login. Testing it rather than believing it was still the right call —
the same reference was wrong about carousel insights earlier today — but the
result here is that the documentation holds.

There is no second API route to try. `publish-reel.mjs` has no delete path, and
inventing one against an undocumented endpoint on a live account is exactly the
kind of improvisation that turns one bad Reel into a bigger problem.

---

## 3b. Published nothing

Deliberately. Two Reels telling the same librarians story, on an account holding
three posts total, is a worse artifact than one flawed Reel: the flawed one can
be deleted in ten seconds, but a visible duplicate reads as an account that does
not know what it has already said, and that impression cannot be deleted.

So: **no re-render, no commit of a new mp4, no `publish-reel.mjs` call, no
`recordPosted`.** The frame checks at 5.5s / 5.9s / 6.3s / 7.5s were conditional
on a successful delete and were not run.

### The manual action, for the account owner

1. Open Instagram as **@order.of.magnitude**.
2. Go to https://www.instagram.com/reel/DbOaN6xCCXC/ (Reels tab; it is not on the
   profile grid, because `share_to_feed=false`).
3. ⋯ menu → **Delete**.

That is the whole fix. It takes ten seconds and needs no session, no token and no
repo. Until it happens, a fabricated attendance figure under a real outlet's
credit is publicly scrubbable on an account whose entire promise is that every
figure traces to a sentence in a source.

**After deleting, the stale line has to come out of `state/posted.jsonl`** — see
below.

---

## 4. What `state/posted.jsonl` looks like afterwards

**Unchanged — still three lines.** This is intentional, not an oversight.

| # | slug | mediaId | permalink |
|---|---|---|---|
| 1 | `2026-07-25-data-centers-unplugged` | 17905277859456798 | /p/DbOLIhxm5KU/ |
| 2 | `2026-07-25-avoiding-ai-libraries` | 17878051914684927 | /p/DbOTmaNmpDI/ |
| 3 | `2026-07-25-avoiding-ai-libraries-reel` | 18132234304542418 | /reel/DbOaN6xCCXC/ |

Line 3 was to be removed only in branch 3a, as part of swapping in a replacement.
The Reel is still live, so the line is still **true**, and `posted.jsonl` is the
account's memory of what exists — not a wishlist. Deleting the line while the
Reel is up would make the next run believe the story was never shipped as a Reel
and re-ship it, which is the duplicate this run just refused to create.

Once the owner deletes the Reel on the phone, line 3 becomes false and should be
dropped — otherwise `src/watch.mjs` will keep polling insights for a dead media
id. That is a one-line edit for the next run to make, and it should confirm the
deletion with the same readback used above (a 400 saying the object does not
exist) before touching the file.

---

## 5. What nearly went wrong

**The session started on a detached HEAD, and the local `main` branch was 21
commits stale.** `git checkout main` landed on `42a8451`, an ancestor that predates
the entire Reel pipeline — no `src/reel-template.mjs`, no `src/publish-reel.mjs`,
and critically **not** the `409043b` template fix. The detached HEAD (`af529cb`)
was the real remote tip; the named branch was the out-of-date thing.

Git said so, but said it as a courtesy note about "leaving 21 commits behind" —
easy to read as informational and scroll past. It was caught by comparing
`git rev-parse main` against `git ls-remote origin -h refs/heads/main` rather
than trusting either name.

Two concrete ways that could have gone badly:

- Committing the report onto stale `main` and pushing would have been rejected as
  non-fast-forward. Recoverable, but a run that "reported and pushed" and did
  neither is precisely the failure the routine warns about.
- Worse, in branch 3a: re-rendering from stale `main` would have used the **old
  reel-template with the count-up arithmetic still in it**. The run would have
  deleted a Reel showing 66 and published a fresh one showing 66, while reporting
  a successful correction. The frame checks at 5.5/5.9/6.3/7.5s mandated by 3a
  would have caught it — that is exactly why they are mandated — but only after
  a full render cycle spent on a doomed artifact.

Resolved with `git fetch origin main && git merge --ff-only origin/main`. HEAD is
now `af529cb`, verified equal to remote.

**Worth adopting:** the routine's step 9 already says to verify a push landed by
comparing against `git ls-remote`. The same comparison is worth making at the
*start* of a run, before any work is built on top of a branch name. A cloud
session's local refs are whatever the clone left behind, and a branch name is not
evidence of a commit.

---

## Summary

| Question | Answer |
|---|---|
| Was the Reel deleted? | **No.** HTTP 400, code 100, subcode 33, "Unsupported delete request". |
| Did the readback confirm? | Yes — HTTP 200, object still live, permalink intact. |
| Was a new Reel published? | **No.** Branch 3b, deliberately. |
| Frames opened | None — conditional on a delete that did not happen. |
| `state/posted.jsonl` | Unchanged, 3 lines, all still accurate. |
| Is the fabricated figure still public? | **Yes**, until deleted from the phone. |
| Is the underlying fault fixed? | Yes, in `409043b` on `main`. Future Reels are safe. |
