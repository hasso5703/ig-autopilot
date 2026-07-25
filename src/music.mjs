/**
 * The music bed.
 *
 * Instagram's own library is the only sound that carries a discovery bonus, and
 * it is unreachable: the content-publishing API has no audio parameter for any
 * media type, and music cannot be added to an already-published post. So sound
 * means baking a track into the MP4, which means a track we are certain we may
 * bake in.
 *
 * The beds are therefore CURATED AND COMMITTED, not searched per run. Four CC0
 * tracks live in `brand/audio/`, each trimmed, loudness-matched and listened to
 * once by a human. Searching fresh every day would put a sound nobody has ever
 * heard under a video nobody can un-publish, which is the audio version of the
 * mistake this project has already made twice with pictures.
 *
 * Licence policy is the images' policy: CC0 or public domain only. Not CC BY
 * for audio — an attribution obligation discharged in an Instagram caption that
 * gets truncated is not discharged.
 *
 *   node src/music.mjs list
 *   node src/music.mjs curate "dark ambient drone" 4     # dev-time, then listen
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ffmpeg } from "./ffmpeg.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const AUDIO_DIR = path.join(ROOT, "brand", "audio");
const SHEET = path.join(AUDIO_DIR, "beds.json");
const UA = "order-of-magnitude/1.0 (+https://github.com/hasso5703/ig-autopilot)";

export async function beds() {
  try {
    return JSON.parse(await readFile(SHEET, "utf8"));
  } catch {
    return [];
  }
}

/**
 * Picks the bed for a story.
 *
 * `mood` comes from the post spec and is advisory: an unmatched mood falls back
 * to the first bed rather than to silence, because a Reel with no audio stream
 * is treated differently by Instagram than one that is merely quiet.
 */
export async function pickBed(mood = "tension") {
  const all = await beds();
  if (!all.length) return null;
  const hit = all.find((b) => b.mood === mood) || all[0];
  return { ...hit, path: path.join(AUDIO_DIR, hit.file) };
}

export const MOODS = ["tension", "wonder", "drive", "calm"];

/* ------------------------------------------------------------------ *
 * Curation (run by a human, not by the routine)
 * ------------------------------------------------------------------ */

async function curate(query, want = 4, mood = "tension") {
  const u = new URL("https://api.openverse.org/v1/audio/");
  u.searchParams.set("q", query);
  u.searchParams.set("license", "cc0");
  u.searchParams.set("page_size", "12");
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`openverse audio -> HTTP ${res.status}`);
  const { results = [] } = await res.json();

  await mkdir(AUDIO_DIR, { recursive: true });
  const sheet = await beds();

  let added = 0;
  for (const r of results) {
    if (added >= want) break;
    const seconds = (r.duration || 0) / 1000;
    if (seconds < 35 || seconds > 420) continue;
    if (String(r.license).toLowerCase() !== "cc0") continue;
    if (!r.url) continue;

    const id = `${mood}-${r.id.slice(0, 8)}`;
    if (sheet.some((b) => b.id === id)) continue;

    const raw = path.join(AUDIO_DIR, `.${id}.dl`);
    const out = `${id}.mp3`;
    const audio = await fetch(r.url, { headers: { "User-Agent": UA } });
    if (!audio.ok) continue;
    await writeFile(raw, Buffer.from(await audio.arrayBuffer()));

    /*
     * 75 seconds is longer than the longest Reel we may publish, so a bed never
     * has to loop. Loudness-normalised to -23 LUFS because it plays UNDER a
     * voice: the mix in reel.mjs ducks it further, and starting from a known
     * loudness is what stops one track sitting twice as loud as another.
     */
    await ffmpeg([
      "-y", "-i", raw, "-t", "75",
      "-af", "loudnorm=I=-23:TP=-2:LRA=11,afade=t=in:st=0:d=1.5,afade=t=out:st=73:d=2",
      "-ac", "2", "-ar", "48000", "-b:a", "96k",
      path.join(AUDIO_DIR, out),
    ]);
    await ffmpeg(["-y", "-i", raw, "-t", "0.1", "-f", "null", "-"]).catch(() => {});

    sheet.push({
      id,
      file: out,
      mood,
      title: r.title || "",
      creator: r.creator || "",
      license: "cc0",
      sourceUrl: r.foreign_landing_url || r.url,
      provider: r.provider || "",
      seconds: 75,
    });
    added++;
    console.log(`added ${out}  ${r.title} — ${r.creator} (CC0)`);
  }

  await writeFile(SHEET, JSON.stringify(sheet, null, 2) + "\n");
  console.log(`${sheet.length} bed(s) in ${path.relative(ROOT, SHEET)}`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "curate") {
    const moodIdx = rest.indexOf("--mood");
    const mood = moodIdx >= 0 ? rest[moodIdx + 1] : "tension";
    const args = rest.filter((a, i) => i !== moodIdx && i !== moodIdx + 1);
    await curate(args[0] || "ambient", Number(args[1] || 2), mood);
  } else {
    for (const b of await beds()) console.log(`${b.mood.padEnd(8)} ${b.file.padEnd(24)} ${b.title.slice(0, 44)} — ${b.creator} (${b.license})`);
  }
}
