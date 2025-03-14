import type { Page } from "puppeteer";

/**
 * Retrieves the CSS selector path for a given element on a Puppeteer page.
 * This function is still in development for an accurate use.
 *
 * @param {Page} page - The Puppeteer Page object.
 * @param {any} element - The element for which to get the CSS selector path.
 * @returns {Promise<string>} A promise that resolves to the CSS selector path of the element.
 * @throws {Error} If an error occurs while evaluating the selector path.
 */
export async function getCssSelector(page: Page, element: any) {
    let selector

    try {
        selector = await page.evaluate((el) => {
            return getSelectorPath(el);
        }, element);
    } catch (e) {
        throw new Error(`${e}`)
    }

    return selector!
}
function getSelectorPath(el: any) {
    if (!(el instanceof Element)) return new Error(`Can only get Css selectors from Html elements.`);
    const path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break;
        } else {
            let sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector)
                   nth++;
            }
            if (nth != 1)
                selector += ":nth-of-type("+nth+")";
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(" > ");
}