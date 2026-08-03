/**
 * The engagement half of publishing, which the account has never had.
 *
 * Publishing has always been fire-and-forget here: the Reel goes up and
 * nothing from this pipeline ever touches it again. Meanwhile the ranking
 * model reads conversation — comment depth and reply quality entered it in
 * 2025, and replying to comments measurably lifts engagement while the post
 * is still being actively distributed. A new account that never answers
 * anybody is leaving its cheapest signal on the table.
 *
 * Two jobs, both deliberately small:
 *
 *   1. The first comment. Right after a Reel is recorded, the run posts one
 *      comment under its own post: the day's question, or the one-line take
 *      that did not belong in the caption. It seeds the conversation surface
 *      and carries the serial promise ("l'actu IA de demain…") that the
 *      caption is gated against carrying.
 *   2. Replies. The 19:00 run lists what strangers wrote and answers the ones
 *      worth answering, in French, with substance. The writing is the run's;
 *      this file only moves text.
 *
 * Everything that writes is a dry run unless --live is passed, for the same
 * reason publish.mjs has one: a comment cannot be quietly unposted, and a
 * malformed loop must cost nothing.
 *
 *   node src/engage.mjs recent [limit]                  comments on recent posts
 *   node src/engage.mjs comment <mediaId|last> "text" [--live]
 *   node src/engage.mjs reply <commentId> "text" [--live]
 *
 * Uses the same Instagram Login surface as the publishers. If the token lacks
 * instagram_business_manage_comments, the API answers with an OAuth error:
 * report that as a finding, do not fight it.
 *
 * ---------------------------------------------------------------------------
 * `recent` counts before it reads, and this is the whole reason it is trusted.
 *
 * The /comments edge does not error when it will not show you a comment. It
 * answers HTTP 200 with `data: []` — indistinguishable, to a reader that only
 * looks at `data`, from a Reel nobody has written under. This file printed
 * "no comments" on that empty array and two runs believed it: 29/07, which
 * nearly re-seeded a Reel it had already seeded, and 03/08, which reported a
 * silent account while a stranger's comment sat unanswered under the MacBook
 * Air Reel.
 *
 * Measured 03/08 (19h), and it is not an API version artefact — v21 through
 * v25 answer identically:
 *
 *   GET <media>?fields=comments_count        ->  2
 *   GET <media>/comments                     ->  {"data":[], "paging":{"cursors":{…}}}
 *   GET <media>?fields=comments{id,text}     ->  the key is absent entirely
 *   GET <comment_id>?fields=id,text          ->  {}
 *
 * The cursors are the proof, and they are why "empty" is a lie rather than an
 * answer: their count tracks comments_count exactly — two *different* opaque
 * strings on the 2-comment Reel, the *same* string twice on every 1-comment
 * Reel. The rows exist and are being filtered out of `data` on the way to us.
 *
 * So the count is the only honest signal available, and it is a subtraction:
 * comments_count is the truth, the ledger knows what the account itself wrote,
 * and the difference is what a stranger wrote and this pipeline cannot read.
 * `recent` reports that difference loudly and never says "no comments" unless
 * comments_count is genuinely 0. Reading them needs Advanced Access on
 * instagram_business_manage_comments (App Review); until then an unread
 * comment is answered from the app, by a human, and this tool's job is to make
 * sure nobody has to notice it by hand.
 */

import { readFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LEDGER = path.join(ROOT, "state", "engagement.jsonl");
const API = "https://graph.instagram.com";
const VERSION = process.env.IG_API_VERSION || "v25.0";

function requireToken() {
  const t = process.env.IG_ACCESS_TOKEN;
  if (!t) throw new Error("IG_ACCESS_TOKEN is not set");
  return t;
}

async function journal(line) {
  const f = process.env.RUN_JOURNAL;
  if (!f) return;
  const at = new Date().toISOString().slice(11, 19);
  await appendFile(f, `- ${at} ${line}\n`).catch(() => {});
}

async function call(method, pathname, params = {}) {
  const url = new URL(`${API}/${VERSION}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: requireToken() });
  const res =
    method === "GET"
      ? await fetch(`${url}?${body}`)
      : await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`${method} ${pathname} -> HTTP ${res.status}, non-JSON: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(
      `${method} ${pathname} -> HTTP ${res.status} code=${e.code ?? "?"} subcode=${e.error_subcode ?? "-"}: ${e.message || text.slice(0, 300)}`
    );
  }
  return json;
}

/** The Graph /comments edge does not return comments the account itself
 * wrote (measured 2026-07-30): a run checking "did I already seed?" through
 * the API sees nothing and seeds twice. This ledger is the only reliable
 * memory of what the account said, so every live write lands here. */
export function alreadySeeded(rows, mediaId) {
  return rows.some((r) => r.kind === "comment" && r.target === mediaId);
}

export async function readLedger() {
  try {
    return (await readFile(LEDGER, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

/** The most recent posted entries that actually carry a mediaId — the ledger
 * also remembers deleted posts, whose ids the API answers with "does not
 * exist"; those are memory, not conversation surfaces. */
/**
 * The most recent published posts, newest first — by timestamp, not by where
 * their line happens to sit in the file.
 *
 * `.gitattributes` spells the rule out: the ledgers merge by union, and a union
 * keeps every line while promising nothing about their order. This function
 * used to take the last N lines, and it is the one that decides which post gets
 * the run's first comment and whose comments get answered. One push race
 * between a run and a human and the account would have opened a conversation
 * under a week-old Reel, in public, with nobody able to explain why.
 *
 * Rows with no timestamp keep their old relative order, so a caller passing
 * bare records still gets file order reversed.
 */
export function recentPublished(posted, limit = 5) {
  return posted
    .filter((p) => p.mediaId)
    .map((p, i) => ({ p, i, t: Date.parse(p.at ?? "") || 0 }))
    .sort((a, b) => b.t - a.t || b.i - a.i)
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * How many comments under a media the account itself is responsible for.
 *
 * A seed carries the media id in `target`. A reply carries the *parent comment*
 * id, which is not a media id and cannot be resolved back to one through an API
 * that will not return comment nodes — so a reply only counts here when the row
 * remembers which media it happened under, which is why every live reply now
 * records `media`. A reply whose media is unknown is deliberately not counted:
 * it inflates the unread number by one, and an unread count that is too high
 * costs a glance at the app, while one that is too low costs a stranger an
 * answer. Round toward looking.
 */
export function ownComments(rows, mediaId) {
  return rows.filter(
    (r) => (r.kind === "comment" && r.target === mediaId) || (r.kind === "reply" && r.media === mediaId)
  ).length;
}

/**
 * Comments under a media that somebody else wrote — the ones worth answering,
 * whether or not the API is willing to show them.
 *
 * Clamped at zero because comments_count is live and the ledger is forever: a
 * comment the account wrote and later deleted stays in the ledger and would
 * otherwise drive this negative.
 */
export function unreadCount(commentsCount, rows, mediaId) {
  const total = Number(commentsCount);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, total - ownComments(rows, mediaId));
}

/** Under 3 characters a "reply" is an emoji nod, and emoji nods are what the
 * ranking model explicitly stopped counting. Refuse them here so a lazy loop
 * cannot spend API calls on them. */
export function commentTextIssues(text) {
  const t = String(text || "").trim();
  if (!t) return ["empty"];
  const issues = [];
  if (t.length < 3) issues.push("too short to be a real comment");
  if (t.length > 950) issues.push(`${t.length} chars — Instagram comments cap near 1000, and nobody reads a wall`);
  return issues;
}

/** The whole live grid by default: the 5-Reel window is what let the MacBook
 * Air comment sit unnoticed while the account looked silent. */
async function listRecent(limit = 10) {
  const file = path.join(ROOT, "state", "posted.jsonl");
  if (!existsSync(file)) { console.log("nothing has ever been published"); return; }
  const posted = (await readFile(file, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const ledger = await readLedger();
  const unanswered = [];

  for (const p of recentPublished(posted, limit)) {
    console.log(`\n${p.slug}  (media ${p.mediaId})  ${p.permalink ?? ""}`);

    // The count first, and on its own: it is the one number the API answers
    // honestly, and every other line below is read against it.
    let total = null;
    try {
      total = (await call("GET", p.mediaId, { fields: "comments_count" })).comments_count ?? 0;
    } catch (e) {
      console.log(`  no longer on the account — memory, not a conversation surface (${e.message.slice(0, 90)})`);
      continue;
    }

    const ours = ownComments(ledger, p.mediaId);
    const unread = unreadCount(total, ledger, p.mediaId);
    console.log(`  comments_count=${total} · written by the account=${ours} · not ours=${unread}`);

    let shown = 0;
    try {
      const r = await call("GET", `${p.mediaId}/comments`, {
        fields: "id,text,username,timestamp,like_count,replies{id,text,username}",
      });
      for (const c of r.data ?? []) {
        shown++;
        console.log(`  [${c.id}] @${c.username ?? "?"}: ${String(c.text ?? "").slice(0, 200)}`);
        for (const rep of c.replies?.data ?? []) {
          console.log(`      ↳ @${rep.username ?? "?"}: ${String(rep.text ?? "").slice(0, 160)}`);
        }
      }
    } catch (e) {
      console.log(`  the comments edge refused: ${e.message}`);
    }

    if (unread > 0 && shown === 0) {
      // The case this whole file was rewritten for. Say the number, name the
      // place, and never let it read as silence.
      console.log(`  ⚠ ${unread} comment${unread > 1 ? "s" : ""} nobody here can read: the API returns an empty list for a Reel that demonstrably has ${total}.`);
      console.log(`    Answer ${unread > 1 ? "them" : "it"} in the app: ${p.permalink ?? "(no permalink recorded)"}`);
      unanswered.push({ slug: p.slug, unread, permalink: p.permalink });
    } else if (total === 0) {
      console.log("  no comments — and comments_count agrees, so this one really is silence");
    }
  }

  console.log("\n" + "—".repeat(60));
  if (!unanswered.length) {
    console.log("nothing unread that the API is hiding.");
    return;
  }
  const n = unanswered.reduce((s, u) => s + u.unread, 0);
  console.log(`${n} unread comment${n > 1 ? "s" : ""} on ${unanswered.length} Reel${unanswered.length > 1 ? "s" : ""}, none of them readable through this token:`);
  for (const u of unanswered) console.log(`  ${u.unread}× ${u.slug}  ${u.permalink ?? ""}`);
  console.log("This is a finding for the report, and an answer owed from the app.");
  await journal(`engage: ${n} unread comment(s) the API will not return — ${unanswered.map((u) => u.slug).join(", ")}`);
}

async function resolveMediaId(idOrLast) {
  if (idOrLast !== "last") return idOrLast;
  const file = path.join(ROOT, "state", "posted.jsonl");
  const posted = (await readFile(file, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const p = recentPublished(posted, 1)[0];
  if (!p) throw new Error("posted.jsonl has no entry with a mediaId");
  return p.mediaId;
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (invokedDirectly) {
  const live = process.argv.includes("--live");
  const [cmd, a, b] = process.argv.slice(2).filter((x) => x !== "--live");
  const usage = () => {
    console.log('usage: node src/engage.mjs recent [limit] | comment <mediaId|last> "text" [--live] | reply <commentId> "text" [--live]');
    process.exit(1);
  };
  (async () => {
    if (cmd === "recent") return listRecent(a ? Number(a) : undefined);
    if (cmd === "comment" || cmd === "reply") {
      if (!a || !b) usage();
      const issues = commentTextIssues(b);
      if (issues.length) throw new Error(`refused: ${issues.join("; ")}`);
      const resolved = cmd === "comment" ? await resolveMediaId(a) : a;
      const target = cmd === "comment" ? `${resolved}/comments` : `${resolved}/replies`;
      if (cmd === "comment" && alreadySeeded(await readLedger(), resolved)) {
        console.log(`refused: the ledger says media ${resolved} already carries a seeded comment — the /comments edge would not show it, but we remember.`);
        return;
      }
      if (!live) {
        console.log(`DRY RUN — would POST ${target}:\n  ${b}\nRe-run with --live to post it.`);
        return;
      }
      const r = await call("POST", target, { message: b });
      console.log(`posted: ${r.id}`);
      // A reply's target is a comment id, so the ledger cannot tell later which
      // Reel it happened under — and `unreadCount` needs exactly that to avoid
      // counting our own answer as a stranger's question. Ask; the node comes
      // back empty under Standard Access today, and this starts working by
      // itself the day the app is granted Advanced Access.
      const media =
        cmd === "reply"
          ? await call("GET", resolved, { fields: "media" }).then((n) => n?.media?.id).catch(() => undefined)
          : resolved;
      await appendFile(LEDGER, JSON.stringify({ at: new Date().toISOString(), kind: cmd, target: resolved, media, id: r.id, text: b.slice(0, 300) }) + "\n").catch(() => {});
      await journal(`engage: ${cmd} on ${resolved} -> ${r.id}`);
      return;
    }
    usage();
  })().catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  });
}
