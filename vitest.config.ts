import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    // game/ is pure: run it under node so any DOM access THROWS instead of
    // silently working. This is the enforcement the lint rule cannot provide.
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
