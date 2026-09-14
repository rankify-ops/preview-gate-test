/*
 * GitHub Pages serves a project repo from /<repo>/, and the real domain serves
 * from /. Rather than remembering which one a given build is for, every asset
 * href goes through asset() and every internal link through href(), both of
 * which read the same env var that next.config.ts reads.
 *
 * Preview build:  NEXT_PUBLIC_BASE_PATH=/crystal-waters-plumbing npm run build
 * Production:     npm run build
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** For files under public/ — images, icons, the OG card. */
export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}
