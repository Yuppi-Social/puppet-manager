import puppeteer, { Browser } from 'puppeteer';
import type { BrowserManagerState, TimeoutCloserFn, TTLSubscriptionFn } from './types';
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

  constructor() {
    this.timeoutCloser = this.createTimeoutCloser();
  }

  /**
   * Creates a new browser instance with automatic lifecycle management
   * @returns Promise<number> - The browser instance ID
   */
  async createBrowser(): Promise<number> {
    const browser = await puppeteer.launch(BROWSER_LAUNCH_OPTIONS);
    this.browsers.push(browser);
    const bid = this.browsers.length - 1;
    this.refreshTTL(bid);
    return bid;
  }

  /**
   * Creates a new page in the specified browser instance
   * @param bid - Browser instance ID
   * @returns Promise to the newly created page
   * @throws Error if browser instance not found
   */
  async createPage(bid: number) {
    this.validateBrowserId(bid);
    this.refreshTTL(bid);
    return await this.browsers[bid]?.newPage();
  }

  /**
   * Refreshes the time-to-live for a browser instance
   * @param bid - Browser instance ID
   */
  refreshTTL(bid: number): void {
    this.timeoutCloser(DEFAULT_TTL_SECONDS, bid);
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
