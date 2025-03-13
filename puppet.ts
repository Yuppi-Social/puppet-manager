import puppeteer, { Browser } from "puppeteer"

/**
 * An Puppeteer interface for a quick aproach and easy use of it's initial methods.
 */
export default class Puppet {
    puppet: typeof puppeteer
    browsers: (Browser | null)[]
    timerId: ReturnType<typeof setInterval>[]
    timeToLive: number[]
    timeoutCloser: (seconds: number, bid: number) => void

    constructor() {
        this.puppet = puppeteer
        this.browsers = []
        this.timerId = []
        this.timeToLive = []
        this.timeoutCloser = this.createTimeoutCloser()
    }

    /**
     * Creates a timeout closer function that manages the lifecycle of browser instances.
     * @returns A function that sets a timeout for closing a browser instance.
     */
    private createTimeoutCloser() {
        return (seconds: number, bid: number) => {
            if (seconds < 0 || bid < 0 || bid >= this.browsers.length) return;

            clearInterval(this.timerId[bid]);
            this.timeToLive[bid] = seconds;

            this.timerId[bid] = setInterval(async () => {
                if (this.timeToLive[bid] % 10 === 0 || this.timeToLive[bid] % 10 === 5 || this.timeToLive[bid] < 4) {
                    console.warn(`[INFO]: Puppet Browser instance of id ${bid} will close in ${this.timeToLive[bid]} seconds.`);
                }
                this.timeToLive[bid]--;
                if (this.timeToLive[bid] === 0) {
                    clearInterval(this.timerId[bid]);
                    if (this.browsers[bid]) {
                        await this.browsers[bid]?.close();
                        this.browsers[bid] = null;
                        console.error(`[INFO]: Puppet Browser instance of id ${bid} ran out of time.`);
                    }
                }
            }, 1000);
        };
    }

    /**
     * Refreshes the specified Browser's timeToLive, so it doesn't close yet.
     * 
     * This is autumatically triggered in a Puppet.newPage()
     * 
     * Obs: If you create a Browser but dont open any pages, you must trigger this manually.
     * @param bid Browser id
     */
    refreshTTL(bid: number) {
        this.timeoutCloser(84, bid)
    }

    /**
     * Gets a specific Browser by its id
     * @param bid Browser id
     * @returns 
     */
    getBrowser(bid: number): Browser {
        if (!this.browsers[bid]) { throw new Error(`No Browser was found matching the provided id.`) }
        return this.browsers[bid]
    }

    /**
     * Finalizes the Puppet instance by closing all browser instances and clearing timers.
     * 
     * This method performs the following actions:
     * - Iterates over the `browsers` array and closes each browser instance asynchronously.
     * - Sets each closed browser instance to `null` in the `browsers` array.
     * - Clears all intervals stored in the `timerId` array.
     * - Resets the `browsers`, `timerId`, and `timeToLive` arrays to empty arrays.
     * - Logs a warning message indicating that all Puppet browser instances have been closed.
     * 
     * @returns {void}
     */
    finallize(): void {
        this.browsers.forEach(async (browser, i) => {
            if (browser) {
                await browser.close()
                this.browsers[i] = null
            }
        })

        this.timerId.forEach((timer) => {
            clearInterval(timer)
        })

        this.browsers = []
        this.timerId = []
        this.timeToLive = []

        console.warn(`[INFO]: Puppet Browser instances have been closed.`)
    }

    /**
     * Destroy the instance of a specific Browser by its id
     * @param bid Browser id
     * @returns void
     */
    async destroyBrowser(bid: number): Promise<void> {
        if (!this.browsers[bid]) {
            throw new Error(`No Browser was found matching the provided id.`)
        } else {
            await this.browsers[bid].close();
            this.browsers[bid] = null
            clearInterval(this.timerId[bid])
        }
    }

    /**
     * The parameter id must be used to identify the terget (Browser) that you want to direct an action.
     * 
     * Such as Puppet.newPage(id)
     * @returns Browser id
     */
    async newBrowser(): Promise<number> {
        const browser = await this.puppet.launch({
            headless: true,  //* headless mode MUST not be false for production!
            args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            ],
         })
        this.browsers.push(browser)
        const bid = this.browsers.length - 1
        this.refreshTTL(bid)
        return bid
    }

    /**
     * Takes the id of the targeted Browser and returns a new page of it.
     * @param bid Browser id
     * @returns Browser Page
     */
    async newPage(bid: number) {
        this.refreshTTL(bid)
        if (!this.browsers[bid]) { throw new Error(`No Browser was found matching the provided id.`) }
        return await this.browsers[bid]?.newPage()
    }

    /**
     * Subscribes to the timeToLive updates of a specific Browser by its id.
     * @param bid Browser id
     * @param callback Function to be called with the remaining timeToLive.
     * @returns Function to unsubscribe from the updates.
     */
    subscribeTTL(bid: number, callback: (timeToLive: number) => void): () => void {
        if (bid < 0 || !this.browsers[bid] || bid >= this.browsers.length) {
            throw new Error(`No Browser was found matching the provided id.`);
        }

        const intervalId = setInterval(() => {
            if (this.browsers[bid]) {
                callback(this.timeToLive[bid]);
            } else {
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }

    //---------------------
            // @dark1zinn 
            // THIS PUPPETEER INTERFACE WAS COPIED FROM https://github.com/dark1zinn/anime-bundle/blob/dark1zinn/feat-data-fetcher/src/electron/puppet.ts
    //---------------------
}
