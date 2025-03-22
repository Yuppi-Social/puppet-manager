import { PuppetManager } from '../../src/PuppetManager';
import puppeteer from 'puppeteer';
import { randomUUID } from 'crypto';

jest.mock('puppeteer');
jest.mock('crypto', () => ({
    randomUUID: jest.fn(),
}));

describe('PuppetManager', () => {
    let manager: PuppetManager;
    const mockBrowser = {
        close: jest.fn(),
        newPage: jest.fn(),
        connected: true,
    };
    const mockPage = {
        goto: jest.fn(),
        close: jest.fn(),
    };
    const mockUUID = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(() => {
        jest.clearAllMocks();
        (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
        mockBrowser.newPage.mockResolvedValue(mockPage);
        (randomUUID as jest.Mock).mockReturnValue(mockUUID);
        manager = new PuppetManager();
    });

    afterEach(async () => {
        await manager.cleanup();
    });

    describe('createBrowser', () => {
        it('should create a browser instance', async () => {
            const bid = await manager.createBrowser();
            expect(bid).toBe(mockUUID);
            expect(puppeteer.launch).toHaveBeenCalled();
        });

        it('should throw error when trying to create second instance', async () => {
            await manager.createBrowser();
            await expect(manager.createBrowser()).rejects.toThrow(
                'Browser already created'
            );
        });
    });

    describe('createPage', () => {
        it('should create a new page in existing browser', async () => {
            const bid = await manager.createBrowser();
            const page = await manager.createPage(bid);
            expect(page).toBe(mockPage);
            expect(mockBrowser.newPage).toHaveBeenCalled();
        });

        it('should throw error for invalid browser ID', async () => {
            const invalidUUID = 'invalid-uuid';
            // @ts-ignore
            await expect(manager.createPage(invalidUUID)).rejects.toThrow();
        });
    });

    describe('refreshTTL', () => {
        it('should update TTL for browser instance', async () => {
            const bid = await manager.createBrowser();
            manager.refreshTTL(bid, 120);
            expect(manager.browser.timeToLive).toBe(120);
        });

        it('should use default TTL when no timeout specified', async () => {
            const bid = await manager.createBrowser();
            manager.refreshTTL(bid);
            expect(manager.browser.timeToLive).toBe(60);
        });
    });

    describe('destroyBrowser', () => {
        it('should close and cleanup browser instance', async () => {
            const bid = await manager.createBrowser();
            await manager.destroyBrowser(bid);
            expect(mockBrowser.close).toHaveBeenCalled();
            expect(manager.browser.instance).toBeNull();
        });
    });

    describe('cleanup', () => {
        it('should close browser instance and reset state', async () => {
            await manager.createBrowser();
            await manager.cleanup();
            expect(mockBrowser.close).toHaveBeenCalled();
            expect(manager.browser.instance).toBeNull();
            expect(manager.browser.browserId).toBeNull();
            expect(manager.browser.timerId).toBeNull();
            expect(manager.browser.timeToLive).toBeNull();
        });
    });

    describe('subscribeTTL', () => {
        it('should call callback with TTL updates', async () => {
            const bid = await manager.createBrowser();
            const mockCallback = jest.fn();
            const unsubscribe = manager.subscribeTTL(bid, mockCallback);

            await new Promise((resolve) => setTimeout(resolve, 1100));

            expect(mockCallback).toHaveBeenCalled();
            unsubscribe();
        });
    });

    describe('getBrowser', () => {
        it('should return browser instance for valid ID', async () => {
            const bid = await manager.createBrowser();
            const browser = manager.getBrowser(bid);
            expect(browser).toBe(mockBrowser);
        });

        it('should throw error for invalid ID', async () => {
            const invalidUUID = 'invalid-uuid';
            // @ts-ignore
            expect(() => manager.getBrowser(invalidUUID)).toThrow();
        });
    });
});
