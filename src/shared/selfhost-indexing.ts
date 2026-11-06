// `pnpm deploy:selfhost` runs `vite build --mode selfhost`. That build is the
// internal panel. Hosted, preview, Docker, and local dev use other modes.
export function isCloudflareSelfHostBuild() {
  return import.meta.env.MODE === "selfhost";
}

export const SELF_HOST_ROBOTS = "noindex, nofollow";
