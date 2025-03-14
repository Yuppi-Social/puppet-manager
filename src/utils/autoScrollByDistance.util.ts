import type { Page } from "puppeteer";

/**
 * Automatically scrolls the page by a specified distance until the bottom of the page is reached.
 * This function is still in development for an accurate use.
 *
 * @param {Page} page - The Puppeteer Page object to perform the scrolling on.
 * @param {number} distance - The distance in pixels to scroll by on each interval.
 * @returns {Promise<void>} A promise that resolves when the bottom of the page is reached.
 */
export async function autoScrollByDistance(page: Page, distance: number) {
    await page.evaluate(async (distance) => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            let timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 40);
        });
    }, distance);
}
