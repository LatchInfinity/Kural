// Keep this file as a compatibility bridge.
// TypeScript resolves "./sources" to this file before the sources/ directory,
// so it must re-export the real source registry from sources/index.ts.
export * from "./sources/index";
