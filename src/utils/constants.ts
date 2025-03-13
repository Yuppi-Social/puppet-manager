export const DEFAULT_TTL_SECONDS = 84;
export const BROWSER_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
  ],
};
