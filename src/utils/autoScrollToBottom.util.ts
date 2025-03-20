import { Page } from "puppeteer";

/**
 * Scrolls the page to its bottom to ensure all dynamic content is rendered.
 *
 * @param page - The Puppeteer Page object representing the web page to scroll.
 * @param pixelDistance - The distance in pixels to be scrolled each interval till the bottom, defaults to 300
 * @param interval - Interval in miliseconds between each scroll
 * @returns A promise that resolves once the page has been scrolled to the bottom.
 */
export async function autoScrollToBottom(page: Page, pixelsDistance: number = 300, interval: number = 100) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            let distance = pixelsDistance;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, interval);
        });
    });
}
