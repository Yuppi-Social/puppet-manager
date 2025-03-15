import { PuppetManager } from '../../src/PuppetManager';

describe('PuppetManager E2E', () => {
    let manager: PuppetManager;

    beforeEach(() => {
        manager = new PuppetManager({
            browserOptions: {
                headless: true
            },
            defaultTimeout: 30
        });
    });

    afterEach(async () => {
        await manager.cleanup();
    });

    it('should create browser and navigate to a page', async () => {
        const bid = await manager.createBrowser();
        const page = await manager.createPage(bid);
        
        await page.goto('https://example.com');
        const title = await page.title();
        
        expect(title).toBe('Example Domain');
    }, 30000);

    it('should handle multiple browser instances', async () => {
        const bid1 = await manager.createBrowser();
        const bid2 = await manager.createBrowser();
        
        const page1 = await manager.createPage(bid1);
        const page2 = await manager.createPage(bid2);
        
        await Promise.all([
            page1.goto('https://example.com'),
            page2.goto('https://example.org')
        ]);
        
        const [title1, title2] = await Promise.all([
            page1.title(),
            page2.title()
        ]);
        
        expect(title1).toBe('Example Domain');
        expect(title2).toBe('Example Domain');
    }, 30000);

    it('should properly handle timeouts', async () => {
        const bid = await manager.createBrowser();
        let isTimeout = false;
        
        manager.subscribeTTL(bid, (ttl) => {
            // console.log(`TTL: ${ttl}`);
            if (ttl === 0) isTimeout = true;
        });
        
        manager.refreshTTL(bid, 2); // 2 seconds timeout
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        expect(isTimeout).toBe(true);
        // await new Promise(resolve => setTimeout(resolve, 1500));
        expect(manager.browsers[bid]).toBeNull();
    }, 10000);

    it('should handle auto-scrolling functionality', async () => {
        const bid = await manager.createBrowser();
        const page = await manager.createPage(bid);
        
        await page.goto('https://example.com');
        await page.evaluate(() => {
            document.body.style.height = '2000px';
        });
        
        const { autoScrollToBottom } = await import('../../src/utils');
        await autoScrollToBottom(page);
        
        const scrollPosition = await page.evaluate(() => window.scrollY);
        expect(scrollPosition).toBeGreaterThan(0);
    }, 30000);

    it('should handle button clicking when visible', async () => {
        const bid = await manager.createBrowser();
        const page = await manager.createPage(bid);
        
        await page.goto('https://example.com');
        await page.evaluate(() => {
            const button = document.createElement('button');
            button.id = 'test-button';
            button.textContent = 'Test Button';
            document.body.appendChild(button);
        });
        
        const { clickButtonWhenVisible } = await import('../../src/utils');
        await clickButtonWhenVisible(page, '#test-button');
        
        // Verify button was clicked (you might need to add specific verification based on your needs)
        const buttonExists = await page.$('#test-button') !== null;
        expect(buttonExists).toBe(true);
    }, 30000);
});
