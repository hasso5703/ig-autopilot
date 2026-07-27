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
export const MOODS = {
  steady: {
    accent: "00E5FF",
    light: "cold cyan light and near-black shadow",
    world: "clean, precise, nocturnal",
  },
  tension: {
    accent: "FFB300",
    light: "warm amber light against deep shadow",
    world: "tense, urgent, human",
  },
  drive: {
    accent: "00E676",
    light: "clean green-white light on steel",
    world: "fast, industrial, forward",
  },
  wonder: {
    accent: "B388FF",
    light: "violet dusk light and soft haze",
    world: "quiet, vast, luminous",
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
  return (
    `${composition} of ${subject} ${action}, ${setting}. ` +
    `Cinematic, photorealistic, ${m.world}. ${m.light}. ` +
    `${camera}, ${lens}. Vertical 9:16 composition. ` +
    `${audio}. No speech, no dialogue. ${NO_TEXT_RULE}`
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
 */
export function promptIssues(prompt, { forbidNames = [] } = {}) {
  const issues = [];
  for (const name of forbidNames) {
    if (!name || name.length < 3) continue;
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(prompt)) issues.push(`prompt names "${name}" — a generated picture may never depict the reported subject`);
  }
  if (/\b(logo|brand mark|trademark)\b/i.test(prompt)) issues.push("prompt asks for a logo");
  if (/"[^"]+"/.test(prompt)) issues.push("prompt contains quoted dialogue — Veo will speak it under the narration");
  return issues;
}

/**
 * Few-shot anchors for the run to imitate, one per surface. These are the
 * shapes Google's guides give, filled with our subjects — kept short because
 * they are pasted into the operating manual, not called.
 */
export const EXAMPLES = {
  veo: veoPrompt({
    subject: "a person seen over the shoulder",
    action: "scrolling a laptop whose screen glows with a generic list of results",
    setting: "in a dark home office at night",
    mood: "tension",
    ambient: "quiet room tone, soft keyboard clicks",
  }),
  image: imagePrompt({
    subject: "hands holding a smartphone showing a generic settings screen",
    setting: "in a dim living room in the evening",
    mood: "tension",
    composition: "close-up",
    detail: "warm lamp bokeh in the background",
  }),
};
