"""
Kokoro-82M speech synthesis, one WAV per line.

Called by src/voice.mjs, never by hand. Reads a JSON array of strings on stdin,
writes <outdir>/seg_000.wav … and prints a JSON manifest with the exact duration
of each one. Durations are the whole point: the Reel's beats are cut to the
narration rather than to a guess about reading speed, so a line that takes 3.4
seconds to say is on screen for 3.4 seconds.

The int8 model is used deliberately. It is 92 MB against 310, downloads in
seconds on the cloud runner, and the difference is not audible under a music bed
at broadcast volume.
"""

import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro


def main() -> int:
    model, voices, voice, speed, outdir = sys.argv[1:6]
    lines = json.load(sys.stdin)

    kokoro = Kokoro(model, voices)
    manifest = []
    for i, line in enumerate(lines):
        text = " ".join(str(line).split())
        if not text:
            continue
        samples, rate = kokoro.create(text, voice=voice, speed=float(speed), lang="en-us")
        path = f"{outdir}/seg_{i:03d}.wav"
        sf.write(path, samples, rate)
        manifest.append(
            {"i": i, "text": text, "file": path, "seconds": len(samples) / rate}
        )

    json.dump({"segments": manifest}, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
