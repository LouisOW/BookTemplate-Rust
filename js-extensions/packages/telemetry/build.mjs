import { cli } from "@nota-lang/esbuild-utils";
import * as cp from "child_process";

let git = cmd => {
  try {
    return cp.execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString("utf-8").trim();
  } catch {
    return "unknown";
  }
};

let build = cli();
build({
  format: "iife",
  define: {
    COMMIT_HASH: JSON.stringify(git("git rev-parse HEAD")),
    BRANCH: JSON.stringify(git("git rev-parse --abbrev-ref HEAD")),
    // Set TELEMETRY_URL in the environment to enable logging. Empty = disabled.
    TELEMETRY_URL: JSON.stringify(process.env.TELEMETRY_URL ?? ""),
  },
});
