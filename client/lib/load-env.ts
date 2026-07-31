// Belt-and-braces env loading. Next.js is supposed to load .env.local itself
// for both `next build` and `next start`, but on at least one host (Hostinger's
// Node.js App runner) the process that actually serves requests never gets
// those variables — only the build step does. Loading it here too costs
// nothing when the framework already did it (dotenv never overwrites a value
// that is already set) and fixes it when the framework didn't.
import { config } from "dotenv";

config({ path: ".env.local" });
