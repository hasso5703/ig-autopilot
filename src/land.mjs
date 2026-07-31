/**
 * The one way to land work on main.
 *
 * On 2026-07-28 a run's `git checkout main` silently produced a local branch
 * five commits behind the remote, with an empty posted.jsonl — one
 * fast-forward push away from erasing the account's memory of what it had
 * published. Only a rejected push exposed it, and only because a human
 * happened to have pushed minutes earlier. The container's local `main` is a
 * photograph of clone time, never an authority.
 *
 * So landing is one command with one rule: **origin/main is the only truth.**
 *
 *   node src/land.mjs "commit message" [paths…]
 *
 * It stages the paths (everything tracked-and-changed if none given), commits,
 * then loops: fetch, rebase onto origin/main, push. The append-only ledgers
 * merge by union (.gitattributes), so two writers appending never conflict. A
 * conflict in any other file is a real disagreement between a run and a human:
 * the rebase is aborted and the command exits 2 with the conflicting files
 * listed — report it, never resolve it by force. There is no force anywhere in
 * this file, and none is ever to be added: a forced push from a container that
 * misunderstands its own state is how the account loses its memory for good.
 *
 * Exit codes: 0 landed-and-proven, 1 nothing to do / setup error,
 * 2 real conflict needing a human.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

async function git(...args) {
  const { stdout } = await run("git", args, { maxBuffer: 8 * 1024 * 1024 });
  return stdout.trim();
}

/**
 * Source and prompts do not land on a red suite. The flight recorder always does.
 *
 * The manual has said since the pivot that a failing test stops the run: "a red
 * suite means something that used to be true is not any more, and publishing on
 * top of that is how a silent regression reaches a live account." Nothing
 * enforced it, and on 2026-07-31 the same person landed a red suite twice in
 * one afternoon — once with a notebook over its own cap, once with a manual
 * edit that had silently failed. If it happens twice to someone watching, it
 * happens to a run that is not.
 *
 * The exception matters as much as the rule. `state/` and `reports/journal/`
 * must land whatever else is broken: the journal is what a usage-limit death
 * leaves behind, and a ledger that cannot record a publication is how the
 * account forgets what it posted. So the check looks at WHAT is being landed.
 */
const ALWAYS_LANDABLE = /^(state\/|reports\/journal\/)/;

async function suiteIsGreen() {
  try {
    await run("npm", ["test"], { maxBuffer: 32 * 1024 * 1024, timeout: 180_000 });
    return { green: true };
  } catch (err) {
    const out = `${err.stdout || ""}\n${err.stderr || ""}`;
    const failing = [...out.matchAll(/^✖ (.+?) \(/gm)].map((m) => m[1]);
    return { green: false, failing };
  }
}

export async function land(message, paths = []) {
  if (!message) throw new Error("land needs a commit message");

  const touchesCode = !paths.length || paths.some((p) => !ALWAYS_LANDABLE.test(p));
  if (touchesCode) {
    const { green, failing } = await suiteIsGreen();
    if (!green) {
      const names = failing?.length ? `\n  ${failing.join("\n  ")}` : "";
      throw new Error(
        `npm test is red, so this is not landing.${names}\n\n` +
          "Every assertion in that suite is a bug that shipped or nearly shipped. Fix the failure, " +
          "or land only state/ and reports/journal/ — those always land, because a journal that cannot " +
          "record a death is worse than a red suite."
      );
    }
  }

  /*
   * Stage and commit. An empty commit is not an error: landing may only need to
   * push commits made earlier in the run.
   *
   * `git add` cannot be trusted to succeed here, and its failure is not always a
   * failure. Hand it the path of a file that has already been removed — by
   * `git rm`, or by a run cleaning up after itself — and git answers "pathspec
   * did not match any files" and exits non-zero, because the path is gone from
   * both the worktree and the index. The deletion is nevertheless staged and
   * ready to commit. On 2026-07-31 that stopped a landing dead, with a git error
   * that says nothing about what to do next.
   *
   * So: try to stage, and if git refuses, ask the index whether there is work
   * anyway. Something staged means the caller had already staged it and we
   * carry on; nothing staged means the paths were wrong, and git's own words
   * are what the run needs to read.
   */
  const staged = () => run("git", ["diff", "--cached", "--quiet"]).then(() => false).catch(() => true);
  try {
    await git("add", "-A", "--", ...(paths.length ? paths : ["."]));
  } catch (err) {
    if (!(await staged())) {
      throw new Error(
        `git add refused and nothing is staged, so there is nothing to land:\n\n` +
          `${String(err.stdout || "")}${String(err.stderr || err.message || "")}\n\n` +
          `Check the paths you passed. Nothing was pushed and nothing was lost.`
      );
    }
  }
  /*
   * Ask git whether anything is staged instead of reading what it says about
   * it. `diff --cached --quiet` exits 0 for "nothing staged" and 1 otherwise,
   * and an exit code is the same in every language.
   *
   * The version this replaces matched the English strings "nothing to commit"
   * and "nothing added" against stderr. Two things were wrong with it and both
   * shipped: git writes that sentence to STDOUT, and on a French machine it
   * writes "rien à valider, la copie de travail est propre" instead. So the net
   * never caught the case it existed for, and on 2026-07-31 a landing whose
   * push had already succeeded once could not be retried — every attempt died
   * here. A run in that state is stranded: its work is committed locally,
   * invisible to everyone, and no command it is allowed to run can publish it.
   */
  const nothingStaged = !(await staged());
  if (nothingStaged) console.log("nothing new to commit; pushing what is already committed here");
  else await git("commit", "-m", message);

  for (let attempt = 1; attempt <= 4; attempt++) {
    await git("fetch", "origin");
    try {
      /* Replay everything this container has done on top of the real main.
       * state/*.jsonl merges by union; anything else that conflicts stops us.
       *
       * `--autostash` is not a convenience, it is what makes the manual's own
       * instruction work. Runs are told to land the journal before every
       * purchase, and at that moment other tracked files are always dirty —
       * state/feeds-last.json for one, rewritten by the gather. Git refuses to
       * rebase with unstaged changes, and this function used to read ANY rebase
       * failure as a content conflict: a run doing exactly what the manual says
       * was told "a run and a human changed the same lines, stop and escalate",
       * which is neither true nor recoverable by anything it is allowed to do.
       */
      await git("rebase", "--autostash", "origin/main");
    } catch (err) {
      const conflicts = await git("diff", "--name-only", "--diff-filter=U").catch(() => "");
      await git("rebase", "--abort").catch(() => {});
      // A rebase can also refuse for reasons that are not a disagreement with
      // anybody. Saying "REAL CONFLICT" about those sends a run down a road
      // that has no end.
      if (!conflicts) {
        throw new Error(
          `git rebase refused, and no file is in conflict, so this is not a disagreement with a human:\n\n` +
            `${String(err.stdout || "")}${String(err.stderr || err.message || "")}\n\n` +
            `Read what git said above and fix that. Nothing was pushed and nothing was lost.`
        );
      }
      console.error(
        "REAL CONFLICT with origin/main in:\n  " + (conflicts || "(unknown)") +
          "\nA run and a human changed the same lines. Do not resolve this by force:" +
          "\nreport it, keep your work on a branch, and let the human decide."
      );
      return 2;
    }
    try {
      await git("push", "origin", "HEAD:main");
      break;
    } catch (err) {
      if (attempt === 4) {
        console.error(`push still rejected after ${attempt} rebases: ${String(err.stderr || err.message).slice(0, 300)}`);
        return 2;
      }
      // Someone pushed between our fetch and our push. Loop: fetch, rebase, retry.
    }
  }

  const local = await git("rev-parse", "HEAD");
  const remote = (await git("ls-remote", "origin", "-h", "refs/heads/main")).split(/\s/)[0];
  if (local !== remote) {
    console.error(`landed but NOT PROVEN: local ${local.slice(0, 12)} vs remote ${remote.slice(0, 12)}`);
    return 2;
  }
  console.log(`landed and proven on main: ${local.slice(0, 12)}`);
  return 0;
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith("land.mjs") && process.argv[1].endsWith("land.mjs");
if (invokedDirectly) {
  const [message, ...paths] = process.argv.slice(2);
  land(message, paths)
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
