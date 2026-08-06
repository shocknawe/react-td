import tseslint from "typescript-eslint";

/** Globals that would silently destroy determinism or purity inside game/. */
const BANNED_GLOBALS = ["Math.random", "Date", "performance", "window", "document", "localStorage", "sessionStorage"];

export default tseslint.config(
  // .claude and openspec are vendored Claude Code skill/agent tooling, not app source —
  // they ship their own scripts (with their own style/toolchain) that this config was
  // never meant to lint. Without this, invoking a skill that materializes new scripts
  // under .claude/skills/** breaks `pnpm check` on unrelated files.
  { ignores: ["dist", "design", "references", "node_modules", ".claude", "openspec"] },
  ...tseslint.configs.recommended,
  {
    // The game/ purity boundary. Prose does not enforce this; these rules plus the
    // node-environment vitest run and the determinism test do (Phase 3 #5).
    files: ["src/game/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["react", "react-dom", "react/*", "zustand", "zustand/*"], message: "game/ must stay pure: no React or store imports." },
          { group: ["../render/*", "../ui/*", "../state/*", "**/render/**", "**/ui/**", "**/state/**"], message: "game/ must not depend on render/, ui/ or state/." },
        ],
      }],
      "no-restricted-globals": ["error",
        ...["window", "document", "localStorage", "sessionStorage", "performance", "requestAnimationFrame"]
          .map((name) => ({ name, message: `game/ must stay pure and deterministic: ${name} is banned. ${BANNED_GLOBALS.join(", ")}` })),
      ],
      "no-restricted-properties": ["error",
        { object: "Math", property: "random", message: "Use the seeded rng from game/rng.ts — Math.random breaks determinism." },
        { object: "Date", property: "now", message: "Time comes in as the dt argument; Date.now breaks determinism." },
        { object: "performance", property: "now", message: "Time comes in as the dt argument; performance.now breaks determinism." },
      ],
      "no-restricted-syntax": ["error",
        { selector: "NewExpression[callee.name='Date']", message: "game/ must stay deterministic: no Date." },
      ],
    },
  },
);
