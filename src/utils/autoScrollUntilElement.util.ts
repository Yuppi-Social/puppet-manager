import type { Page } from "puppeteer";

/**
 * Automatically scrolls the page until the specified element is in view.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {string} selector - The CSS selector of the element to scroll to.
 * @returns {Promise<void>} A promise that resolves when the element is in view or the bottom of the page is reached.
 */
export default async function autoScrollUntilElement(page: Page, selector: string) {
    await page.evaluate(async (selector) => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            let distance = 400;
            let timer = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    ) {
                        clearInterval(timer);
                        resolve();
                        return;
                    }
                }

                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 40);
        });
    }, selector);
}
