// Imported FIRST by AskPanel. The AI SDK builds zod schemas on load, and zod probes `new Function()` to
// decide whether it can compile validators; our CSP has no 'unsafe-eval', so the probe is reported as a CSP
// violation (Lighthouse best-practices) even though zod catches it. jitless skips the probe.
import { config } from "zod/v4/core";

config({ jitless: true });
