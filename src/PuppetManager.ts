import puppeteer, { Browser } from 'puppeteer';
import type {
    BrowserState,
    TimeoutCloserFn,
    TTLSubscriptionFn,
    PuppetManagerOptions,
} from './types';
import { BROWSER_LAUNCH_OPTIONS, DEFAULT_TTL_SECONDS } from './utils';
import { randomUUID, UUID } from 'crypto';

/**
 * PuppetManager provides a high-level interface for managing Puppeteer browser instances
 * with automatic lifecycle management and timeouts.
 */
export class PuppetManager {
    public browser: BrowserState;
    private readonly timeoutCloser: TimeoutCloserFn;
    private readonly options: PuppetManagerOptions;

    constructor(options: PuppetManagerOptions = {}) {
        this.browser = {
            instance: null,
            timerId: null,
            timeToLive: null,
            browserId: null,
        };
        this.options = options;
        this.timeoutCloser = this.createTimeoutCloser();
    }

    /**
     * Creates a new browser instance with automatic lifecycle management
     * @param customOptions - Optional launch options for this specific browser instance
     * @returns Promise<UUID> - The browser instance ID
     */
    async createBrowser(customOptions?: PuppetManagerOptions): Promise<UUID> {
        try {
            if (this.browser.instance) {
                throw new Error(`Browser already created`)
            }

            const launchOptions = {
                ...BROWSER_LAUNCH_OPTIONS,
                ...this.options.browserOptions,
                ...customOptions,
            };

            const browser = await puppeteer
                .launch(launchOptions)
                .catch((error) => {
                    throw new Error(
                        `Failed to create browser: ${error.message}`
                    );
                });

            this.browser.instance = browser;
            this.browser.browserId = randomUUID();
            this.refreshTTL(this.browser.browserId);
            return this.browser.browserId;
        } catch (error) {
            throw new Error(`[ERROR] ${(error as Error).message}`);
        }
    }

    /**
     * Creates a new page in the specified browser instance
     * @param bid - Browser instance ID
     * @returns Promise to the newly created page
     * @throws {Error} If browser instance not found
     * @throws {Error} If page creation fails
     * @throws {Error} If browser has been disconnected
     */
    async createPage(bid: UUID) {
        try {
            this.validateBrowserId(bid);

            if (!this.browser.instance) {
                throw new Error(
                    `Browser instance ${bid} not found or was closed`
                );
            }

            // Verify if browser is still connected
            if (!this.browser.instance.connected) {
                this.browser.instance = null;
                throw new Error(
                    `Browser instance ${bid} has been disconnected`
                );
            }

            this.refreshTTL(bid);
            const page = await this.browser.instance
                .newPage()
                .catch((error) => {
                    throw new Error(
                        `Failed to create new page: ${error.message}`
                    );
                });

            return page;
        } catch (error) {
            throw new Error(
                `[ERROR] Could not create a new page: ${
                    (error as Error).message
                }`
            );
        }
    }

    /**
     * Refreshes the time-to-live for a browser instance
     * @param bid - Browser instance ID
     * @param timeout - Optional custom timeout in seconds
     */
    refreshTTL(bid: UUID, timeout?: number): void {
        const ttl =
            timeout ?? this.options.defaultTimeout ?? DEFAULT_TTL_SECONDS;
        this.timeoutCloser(ttl, bid);
    }

    /**
     * Subscribes to TTL updates for a specific browser instance
     * @param bid - Browser instance ID
     * @param callback - Function to be called with TTL updates
     * @returns Unsubscribe function
     */
    subscribeTTL(bid: UUID, callback: TTLSubscriptionFn): () => void {
        this.validateBrowserId(bid);

        const intervalId = setInterval(() => {
            if (this.browser.instance) {
                callback(this.browser.timeToLive!);
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
    async destroyBrowser(bid: UUID): Promise<void> {
        this.validateBrowserId(bid);
        await this.browser.instance?.close();
        this.browser.instance = null;
        clearInterval(this.browser.timerId!);
    }

    /**
     * Closes the browser instance and cleans up resources
     */
    async cleanup(): Promise<void> {
        try {
            console.warn('Closing browser...')

            if (this.browser.instance) {
                await this.browser.instance.close();
            }
            
            if (this.browser.timeToLive || this.browser.timerId) {
                clearInterval(this.browser.timerId!)
            }

            this.browser.timerId = null;
            this.browser.timeToLive = null;
            this.browser.instance = null;
            this.browser.browserId = null;

            // process.exit
        } catch (error) {
            throw new Error(
                `Unable to close the browser: ${(error as Error).message}`
            );
        }
    }

    private createTimeoutCloser(): TimeoutCloserFn {
        return (seconds: number, bid: UUID) => {
            if (seconds < 0 || !this.validateBrowserId(bid)) return;

            clearInterval(this.browser.timerId!);
            this.browser.timeToLive = seconds;

            this.browser.timerId = setInterval(async () => {
                if (this.browser.timeToLive! <= 0) {
                    // clearInterval(this.browser.timerId!)
                    await this.handleBrowserTimeout(bid);
                    return;
                }

                this.logTimeoutWarning(bid);
                this.browser.timeToLive!--;
            }, 1000);
        };
    }

    private validateBrowserId(bid: UUID): boolean {
        if (bid !== this.browser.browserId) {
            return false;
        } else {
            return true;
        }
    }

    private async handleBrowserTimeout(bid: UUID): Promise<void> {
        if (this.browser.instance) {
            await this.browser.instance?.close();
            this.browser.instance = null;
            console.warn(
                `[INFO] Browser instance ${bid} timed out and was closed.`
            );
        }
        clearInterval(this.browser.timerId!);
    }

    private logTimeoutWarning(bid: UUID): void {
        const ttl = this.browser.timeToLive!;
        if (ttl % 10 === 0 || ttl % 10 === 5 || ttl < 4) {
            console.warn(
                `[INFO] Browser instance ${bid} will close in ${ttl} seconds.`
            );
        }
    }

    getBrowser(bid: UUID): Browser {
        try {
            if (!this.validateBrowserId(bid)) {
                throw new Error(`Invalid browser ID: ${bid}`)
            };
            return this.browser.instance!;
        } catch (error) {
            throw new Error(
                `Could not get browser: ${(error as Error).message}`
            );
        }
    }
}

// TODO: create a method to get a browser by its ID
