/**
 * Default time in seconds before the browser is automatically closed
 */
export const DEFAULT_TTL_SECONDS = 60;

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
