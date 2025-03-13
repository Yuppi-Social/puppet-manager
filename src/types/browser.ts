import { Browser } from 'puppeteer';

export type BrowserInstance = Browser | null;
export type TimerId = ReturnType<typeof setInterval>;
export type TimeoutCloserFn = (seconds: number, bid: number) => void;
export type TTLSubscriptionFn = (timeToLive: number) => void;

export interface BrowserManagerState {
  browsers: BrowserInstance[];
  timerId: TimerId[];
  timeToLive: number[];
}
