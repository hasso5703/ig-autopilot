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
 *   node src/engage.mjs recent                          comments on recent posts
 *   node src/engage.mjs comment <mediaId|last> "text" [--live]
 *   node src/engage.mjs reply <commentId> "text" [--live]
 *
 * Uses the same Instagram Login surface as the publishers. If the token lacks
 * instagram_business_manage_comments, the API answers with an OAuth error:
 * report that as a finding, do not fight it.
 */

import { readFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
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

/** The most recent posted entries that actually carry a mediaId — the ledger
 * also remembers deleted posts, whose ids the API answers with "does not
 * exist"; those are memory, not conversation surfaces. */
export function recentPublished(posted, limit = 5) {
  return posted.filter((p) => p.mediaId).slice(-limit).reverse();
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

async function listRecent() {
  const file = path.join(ROOT, "state", "posted.jsonl");
  if (!existsSync(file)) { console.log("nothing has ever been published"); return; }
  const posted = (await readFile(file, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  for (const p of recentPublished(posted)) {
    console.log(`\n${p.slug}  (media ${p.mediaId})  ${p.permalink ?? ""}`);
    try {
      const r = await call("GET", `${p.mediaId}/comments`, {
        fields: "id,text,username,timestamp,like_count,replies{id,text,username}",
      });
      const rows = r.data ?? [];
      if (!rows.length) { console.log("  no comments"); continue; }
      for (const c of rows) {
        console.log(`  [${c.id}] @${c.username ?? "?"}: ${String(c.text ?? "").slice(0, 200)}`);
        for (const rep of c.replies?.data ?? []) {
          console.log(`      ↳ @${rep.username ?? "?"}: ${String(rep.text ?? "").slice(0, 160)}`);
        }
      }
    } catch (e) {
      console.log(`  unavailable: ${e.message}`);
    }
  }
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
    console.log('usage: node src/engage.mjs recent | comment <mediaId|last> "text" [--live] | reply <commentId> "text" [--live]');
    process.exit(1);
  };
  (async () => {
    if (cmd === "recent") return listRecent();
    if (cmd === "comment" || cmd === "reply") {
      if (!a || !b) usage();
      const issues = commentTextIssues(b);
      if (issues.length) throw new Error(`refused: ${issues.join("; ")}`);
      const target = cmd === "comment" ? `${await resolveMediaId(a)}/comments` : `${a}/replies`;
      if (!live) {
        console.log(`DRY RUN — would POST ${target}:\n  ${b}\nRe-run with --live to post it.`);
        return;
      }
      const r = await call("POST", target, { message: b });
      console.log(`posted: ${r.id}`);
      await journal(`engage: ${cmd} on ${a} -> ${r.id}`);
      return;
    }
    usage();
  })().catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  });
}
