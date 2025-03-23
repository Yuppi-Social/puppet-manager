import { UUID } from 'crypto';
import type { Browser, LaunchOptions } from 'puppeteer';

/**
 * The browser instance
 */
export type BrowserInstance = Browser | null;

/**
 * The browser timeout timer ID
 */
export type TimerId = ReturnType<typeof setInterval> | null;

/**
 * A function to be called when the browser runs out of time
 */
export type TimeoutCloserFn = (seconds: number, bid: UUID) => void;

/**
 * Function to subscribe to the browser remaining timeToLive
 */
export type TTLSubscriptionFn = (timeToLive: number) => void;

/**
 * Holds important information to manage the browser
 */
export interface BrowserState {

  /**
   * The browser instance
   */
  instance: BrowserInstance;

  /**
   * The browser timeout timer ID
   */
  timerId: TimerId;

  /**
   * The remaining time until the browser timeout
   */
  timeToLive: number | null;

  /**
   * The browser ID
   */
  browserId: UUID | null
}

export interface PuppetManagerOptions {

  /**
   * The puppeteer launch options
   */
  browserOptions?: LaunchOptions;

  /**
   * Browser timeout
   */
  defaultTimeout?: number;

  /**
   * If when creating a page it should use a UserAgent
   */
  usePageAgent?: boolean;
}
