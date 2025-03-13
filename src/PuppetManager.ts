import puppeteer, { Browser } from 'puppeteer';
import type { BrowserManagerState, TimeoutCloserFn, TTLSubscriptionFn, PuppetManagerOptions } from './types';
import { BROWSER_LAUNCH_OPTIONS, DEFAULT_TTL_SECONDS } from './utils/constants';

/**
 * PuppetManager provides a high-level interface for managing Puppeteer browser instances
 * with automatic lifecycle management and timeouts.
 */
export class PuppetManager implements BrowserManagerState {
  public browsers: (Browser | null)[] = [];
  public timerId: ReturnType<typeof setInterval>[] = [];
  public timeToLive: number[] = [];
  private readonly timeoutCloser: TimeoutCloserFn;
  private readonly options: PuppetManagerOptions;

  constructor(options: PuppetManagerOptions = {}) {
    this.options = options;
    this.timeoutCloser = this.createTimeoutCloser();
  }

  /**
   * Creates a new browser instance with automatic lifecycle management
   * @param customOptions - Optional launch options for this specific browser instance
   * @returns Promise<number> - The browser instance ID
   */
  async createBrowser(customOptions?: PuppetManagerOptions): Promise<number> {
    const launchOptions = {
      ...BROWSER_LAUNCH_OPTIONS,
      ...this.options.browserOptions,
      ...customOptions
    };

    const browser = await puppeteer.launch(launchOptions);
    this.browsers.push(browser);
    const bid = this.browsers.length - 1;
    this.refreshTTL(bid);
    return bid;
  }

  /**
   * Creates a new page in the specified browser instance
   * @param bid - Browser instance ID
   * @returns Promise to the newly created page
   * @throws {Error} If browser instance not found
   * @throws {Error} If page creation fails
   * @throws {Error} If browser has been disconnected
   */
  async createPage(bid: number) {
    try {
      this.validateBrowserId(bid);
      
      const browser = this.browsers[bid];
      if (!browser) {
        throw new Error(`Browser instance ${bid} not found or was closed`);
      }

      // Verify if browser is still connected
      if (!browser.connected) {
        this.browsers[bid] = null;
        throw new Error(`Browser instance ${bid} has been disconnected`);
      }

      this.refreshTTL(bid);
      const page = await browser.newPage().catch(err => {
        throw new Error(`Failed to create new page: ${err.message}`);
      });

      return page;

    } catch (error) {
      // Log the error for debugging
      console.error(`[ERROR] PuppetManager.createPage: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Refreshes the time-to-live for a browser instance
   * @param bid - Browser instance ID
   * @param timeout - Optional custom timeout in seconds
   */
  refreshTTL(bid: number, timeout?: number): void {
    const ttl = timeout ?? this.options.defaultTimeout ?? DEFAULT_TTL_SECONDS;
    this.timeoutCloser(ttl, bid);
  }

  /**
   * Subscribes to TTL updates for a specific browser instance
   * @param bid - Browser instance ID
   * @param callback - Function to be called with TTL updates
   * @returns Unsubscribe function
   */
  subscribeTTL(bid: number, callback: TTLSubscriptionFn): () => void {
    this.validateBrowserId(bid);

    const intervalId = setInterval(() => {
      if (this.browsers[bid]) {
        callback(this.timeToLive[bid]);
      } else {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }

  /**
   * Closes a specific browser instance and cleans up resources
   * @param bid - Browser instance ID
   */
  async destroyBrowser(bid: number): Promise<void> {
    this.validateBrowserId(bid);
    await this.browsers[bid]?.close();
    this.browsers[bid] = null;
    clearInterval(this.timerId[bid]);
  }

  /**
   * Closes all browser instances and cleans up resources
   */
  async cleanup(): Promise<void> {
    await Promise.all(
      this.browsers.map(async (browser, i) => {
        if (browser) {
          await browser.close();
          this.browsers[i] = null;
        }
      })
    );

    this.timerId.forEach(clearInterval);
    this.browsers = [];
    this.timerId = [];
    this.timeToLive = [];
  }

  private createTimeoutCloser(): TimeoutCloserFn {
    return (seconds: number, bid: number) => {
      if (seconds < 0 || !this.isValidBrowserId(bid)) return;

      clearInterval(this.timerId[bid]);
      this.timeToLive[bid] = seconds;

      this.timerId[bid] = setInterval(async () => {
        if (this.timeToLive[bid] <= 0) {
          await this.handleBrowserTimeout(bid);
          return;
        }

        this.logTimeoutWarning(bid);
        this.timeToLive[bid]--;
      }, 1000);
    };
  }

  private validateBrowserId(bid: number): void {
    if (!this.isValidBrowserId(bid)) {
      throw new Error(`Invalid browser ID: ${bid}`);
    }
  }

  private isValidBrowserId(bid: number): boolean {
    return bid >= 0 && bid < this.browsers.length && this.browsers[bid] !== null;
  }

  private async handleBrowserTimeout(bid: number): Promise<void> {
    clearInterval(this.timerId[bid]);
    if (this.browsers[bid]) {
      await this.browsers[bid]?.close();
      this.browsers[bid] = null;
      console.warn(`[INFO]: Browser instance ${bid} timed out and was closed.`);
    }
  }

  private logTimeoutWarning(bid: number): void {
    const ttl = this.timeToLive[bid];
    if (ttl % 10 === 0 || ttl % 10 === 5 || ttl < 4) {
      console.warn(`[INFO]: Browser instance ${bid} will close in ${ttl} seconds.`);
    }
  }
}
