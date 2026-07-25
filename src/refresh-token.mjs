/**
 * Long-lived token maintenance for the Instagram Login path.
 *
 * Verified against Meta's reference:
 *   GET https://graph.instagram.com/refresh_access_token
 *       ?grant_type=ig_refresh_token&access_token=<LONG_LIVED_TOKEN>
 *   -> { access_token, token_type, expires_in }
 *
 * Constraints that matter operationally:
 *   - a long-lived token is valid 60 days
 *   - it can only be refreshed once it is at least 24h old
 *   - a token not refreshed within 60 days is DEAD and cannot be recovered;
 *     the only fix is regenerating it by hand in the App Dashboard
 *
 * That last point is why this runs on a schedule and why it screams loudly
 * when it is close to the edge.
 */

const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";
const WARN_DAYS = 14; // shout below this much remaining life

export async function refreshToken(token = process.env.IG_ACCESS_TOKEN) {
  if (!token) throw new Error("IG_ACCESS_TOKEN is not set");

  const url = new URL(REFRESH_URL);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);

  const res = await fetch(url);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`refresh -> HTTP ${res.status}, non-JSON: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`refresh -> HTTP ${res.status} code=${e.code ?? "?"}: ${e.message || text.slice(0, 300)}`);
  }

  const days = Math.round((json.expires_in ?? 0) / 86400);
  return { access_token: json.access_token, expires_in: json.expires_in, days };
}

/** Days of life left, derived from a recorded refresh timestamp. */
export function daysRemaining(issuedAtIso, expiresInSeconds) {
  const expiry = new Date(issuedAtIso).getTime() + (expiresInSeconds ?? 60 * 86400) * 1000;
  return Math.floor((expiry - Date.now()) / 86400000);
}

export function needsAttention(issuedAtIso, expiresInSeconds) {
  return daysRemaining(issuedAtIso, expiresInSeconds) <= WARN_DAYS;
}

if (process.argv[1] && process.argv[1].endsWith("refresh-token.mjs")) {
  const { writeFileSync } = await import("node:fs");
  refreshToken().then(
    (r) => {
      // The token itself is a secret: print only what is safe to log.
      console.log(JSON.stringify({ ok: true, expires_in: r.expires_in, days: r.days, token_length: r.access_token.length }));
      if (process.env.IG_TOKEN_OUT) {
        writeFileSync(process.env.IG_TOKEN_OUT, r.access_token, { mode: 0o600 });
      }
    },
    (e) => {
      console.error("FAILED:", e.message);
      process.exit(1);
    }
  );
}
