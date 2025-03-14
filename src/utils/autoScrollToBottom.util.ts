import { Page } from "puppeteer";

/**
 * Scrolls the page to its bottom to ensure all dynamic content is rendered.
 *
 * @param page - The Puppeteer Page object representing the web page to scroll.
 * @returns A promise that resolves once the page has been scrolled to the bottom.
 */
export async function autoScrollToBottom(page: Page) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            let distance = 400;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 40);
        });
    });
}
