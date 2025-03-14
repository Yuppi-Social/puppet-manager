import type { Page } from "puppeteer";

/**
 * Clicks a button when it becomes visible on the page.
 *
 * This function waits for the button specified by the selector to be visible on the page,
 * then waits for the button to be within the viewport, and finally clicks the button.
 *
 * @param page - The Puppeteer `Page` object representing the browser page.
 * @param buttonSelector - The CSS selector of the button to be clicked.
 * @returns A promise that resolves when the button has been clicked.
 * @throws Will throw an error if the button cannot be clicked.
 */
export async function clickButtonWhenVisible(page: Page, buttonSelector: string): Promise<void> {
    try {
        await page.waitForSelector(buttonSelector, { visible: true });

        await page.waitForFunction(
            (selector: string) => {
                const button = document.querySelector(selector) as HTMLButtonElement;
                if (!button) return false;
                const rect = button.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            },
            {},
            buttonSelector
        );

        await page.click(buttonSelector);
    } catch (error) {
        throw new Error(`Unable to click button: ${(error as Error).message}`);
    }
}
