/**
 * Prompts for the paid models, built instead of improvised.
 *
 * Two findings drove this file. First, four published covers were the same
 * cold blue picture because every hand-written prompt asked for the same cold
 * blue light — the fix is that the light comes from the post's `mood`, in one
 * place, here. Second, Google's own guidance is specific about what works and
 * hand-written prompts kept ignoring it: images want a narrative photographic
 * description, not keywords (ai.google.dev/gemini-api/docs/image-generation);
 * video wants subject + action + style + camera + composition + lens +
 * ambiance, with audio spelled out explicitly (…/docs/veo). These builders
 * encode that structure once so a run only has to decide what is IN the shot.
 *
 * Hard rule carried from the account's promise: a generated picture may set a
 * mood, never depict the reported event, a named person or an identifiable
 * place. `promptIssues` refuses a prompt that names anyone the post names, and
 * every prompt asks for unreadable screens and no logos, because a legible
 * invented interface is a fabricated document.
 */

/**
 * The mood decides the light, and the light is most of why two posts do or do
 * not look alike. Accent hexes match the palettes the templates use.
 */
/*
 * Rewritten 2026-07-30. The first palettes all described night: "near-black
 * shadow", "deep shadow", "dusk", "nocturnal" — so every generated visual on
 * the account came out dark by construction, and Hasan's verdict on the
 * result was right ("sombre, pas beau, on ne comprend pas ce que ça vient
 * faire ici"). News reads in daylight: the reference frames (HugoDécrypte,
 * every desk that reaches people) are bright, clean, legible on a phone in a
 * lit room. The accent hexes stay (karaoke and music key off them); only the
 * world the pictures live in moves from noir to editorial daylight.
 */
export const MOODS = {
  steady: {
    accent: "00E5FF",
    light: "soft even daylight through large windows, neutral white balance",
    world: "calm, precise, modern",
  },
  tension: {
    accent: "FFB300",
    light: "crisp morning light with sharp clean shadows, high contrast",
    world: "urgent, concrete, contemporary",
  },
  drive: {
    accent: "00E676",
    light: "bright industrial daylight on glass and steel",
    world: "fast, engineered, forward",
  },
  wonder: {
    accent: "B388FF",
    light: "clear golden-hour light under an open sky",
    world: "open, vast, optimistic",
  },
};

const NO_TEXT_RULE =
  "Any screens or interfaces in frame show only generic, unreadable content. No readable text, no logos, no watermarks, no captions.";

/**
 * A Veo prompt, in the documented order: composition, subject and action,
 * setting, style, camera, lens, ambiance, then audio. Dialogue is forbidden on
 * purpose — the narration is our TTS voice, and a clip that talks underneath
 * it is noise the mix has to fight.
 */
export function veoPrompt({
  subject,
  action,
  setting,
  mood = "steady",
  composition = "medium shot",
  camera = "slow dolly-in",
  lens = "35mm lens, shallow depth of field",
  ambient = "quiet room tone",
  sfx = "",
} = {}) {
  if (!subject || !action || !setting) throw new Error("veoPrompt needs subject, action and setting");
  const m = MOODS[mood] || MOODS.steady;
  const audio = [`Ambient sound: ${ambient}`, sfx && `Sound effect: ${sfx}`].filter(Boolean).join(". ");
  // Exclusions are phrased descriptively, per Google's own guidance ("describe
  // what you don't want to see" rather than instructive "no X"), and quotation
  // marks never appear in a built prompt: the Cloud best-practices doc warns
  // they can make the model render the words as on-screen text.
  return (
    `${composition} of ${subject} ${action}, ${setting}. ` +
    `One clear subject, a single continuous moment, simple deliberate motion. ` +
    `Cinematic, photorealistic, ${m.world}. ${m.light}. ` +
    `${camera}, ${lens}. Vertical 9:16 composition. ` +
    `${audio}. The scene is silent apart from that ambient sound; nobody speaks. ` +
    `Every visible surface and screen is clean, unbranded and free of readable lettering.`
  );
}

/**
 * A still for Nano Banana: one narrative paragraph, photographic vocabulary,
 * the mood's light. Same no-text rule, same reason.
 */
export function imagePrompt({
  subject,
  setting,
  mood = "steady",
  composition = "medium shot",
  lens = "35mm lens, shallow depth of field",
  detail = "",
} = {}) {
  if (!subject || !setting) throw new Error("imagePrompt needs subject and setting");
  const m = MOODS[mood] || MOODS.steady;
  return (
    `A photorealistic ${composition} of ${subject}, ${setting}. ` +
    `${m.light}, ${m.world} atmosphere${detail ? `, ${detail}` : ""}. ` +
    `Shot on a ${lens}. Cinematic vertical composition. ${NO_TEXT_RULE}`
  );
}

/**
 * The refusals. A prompt that names a person or company the post reports on is
 * asking the model to depict the event, which is the one picture this account
 * must never fake. The caller passes the names its own claims use; matching is
 * whole-word and case-insensitive so "Redis" is caught and "read" is not.
 *
 * `authored` is the text the writer actually chose — the spec's subject, action,
 * setting and composition — as opposed to the fixed camera and audio boilerplate
 * these builders append to every prompt alike. Only the authored half is tested
 * for forbidden names, because the boilerplate cannot depict anything: on
 * 2026-08-02 a post about Google Earth had "Lens" among its names (Google Lens,
 * named in a slide) and the standing suffix "Shot on a 35mm lens" therefore
 * refused EVERY generated still on that post, whatever it showed. Nothing is
 * loosened by this — a spec that names Google, Earth, SynthID or Lens is refused
 * exactly as before, and a hand-written `visual.prompt` passes no `authored`, so
 * it is still checked whole.
 */
export function promptIssues(prompt, { forbidNames = [], authored = null } = {}) {
  const issues = [];
  const named = authored ?? prompt;
  for (const name of forbidNames) {
    if (!name || name.length < 3) continue;
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(named)) issues.push(`prompt names "${name}" — a generated picture may never depict the reported subject`);
  }
  if (/\b(logo|brand mark|trademark)\b/i.test(prompt)) issues.push("prompt asks for a logo");
  if (/"[^"]+"/.test(prompt)) issues.push("prompt contains quoted dialogue — Veo will speak it under the narration");
  issues.push(...simplicityIssues(prompt));
  return issues;
}

/**
 * The artifact multipliers. The 29 July Reel opened on "dense night highway
 * traffic, rows of red brake lights": dozens of small moving objects, and
 * the published result had malformed cars driving both ways — clocked as AI
 * slop by the account's own owner in half a second. Google's docs publish no
 * artifact list; what they do say all points one way (dedicate each clip to
 * a single focused moment; subtle actions are the reliable ones; camera
 * motion is "the simplest and most reliable way to add dynamism"). The ban
 * below is this account's own measured rule on top of that guidance, and it
 * is refused before a cent is spent.
 */
const COMPLEXITY = /\b(traffic|highway|freeway|motorway|crowds?|crowded|dozens|hundreds|rows? of|line of|swarm|flock|many (people|cars|vehicles|hands)|busy street|time-?lapse)\b/i;

export function simplicityIssues(text) {
  const m = String(text || "").match(COMPLEXITY);
  return m
    ? [`describes a many-moving-objects scene ("${m[0]}") — video models multiply artifacts with every extra moving thing. One subject, close shot, simple motion.`]
    : [];
}

/**
 * Few-shot anchors for the run to imitate, one per surface. These are the
 * shapes Google's guides give, filled with our subjects — kept short because
 * they are pasted into the operating manual, not called.
 */
export const EXAMPLES = {
  veo: veoPrompt({
    subject: "a single vending machine",
    action: "dropping one can into the tray with a soft mechanical thud",
    setting: "in a bright modern office corridor",
    mood: "tension",
    composition: "close-up",
    camera: "slow dolly-in",
    ambient: "quiet corridor tone, one soft mechanical clunk",
  }),
  image: imagePrompt({
    subject: "a hand pressing a button on a vending machine keypad",
    setting: "in a bright office lobby in the morning",
    mood: "tension",
    composition: "close-up",
    detail: "clean depth of field, daylight from a window",
  }),
};
