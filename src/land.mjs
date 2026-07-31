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

export async function land(message, paths = []) {
  if (!message) throw new Error("land needs a commit message");

  // Stage and commit. An empty commit is not an error: landing may only need
  // to push commits made earlier in the run.
  await git("add", ...(paths.length ? paths : ["-A"]));
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
  const nothingStaged = await run("git", ["diff", "--cached", "--quiet"]).then(() => true).catch(() => false);
  if (nothingStaged) console.log("nothing new to commit; pushing what is already committed here");
  else await git("commit", "-m", message);

  for (let attempt = 1; attempt <= 4; attempt++) {
    await git("fetch", "origin");
    try {
      // Replay everything this container has done on top of the real main.
      // state/*.jsonl merges by union; anything else that conflicts stops us.
      await git("rebase", "origin/main");
    } catch (err) {
      const conflicts = await git("diff", "--name-only", "--diff-filter=U").catch(() => "");
      await git("rebase", "--abort").catch(() => {});
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
