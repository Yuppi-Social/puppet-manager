import { PuppetManager } from '../../src/PuppetManager';
import puppeteer from 'puppeteer';

jest.mock('puppeteer');

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

    beforeEach(() => {
        jest.clearAllMocks();
        (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
        mockBrowser.newPage.mockResolvedValue(mockPage);
        manager = new PuppetManager();
    });

    afterEach(async () => {
        await manager.cleanup();
    });

    describe('createBrowser', () => {
        it('should create a new browser instance', async () => {
            const bid = await manager.createBrowser();
            expect(bid).toBe(0);
            expect(puppeteer.launch).toHaveBeenCalled();
        });

        it('should create multiple browser instances with different IDs', async () => {
            const bid1 = await manager.createBrowser();
            const bid2 = await manager.createBrowser();
            expect(bid1).toBe(0);
            expect(bid2).toBe(1);
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
            await expect(manager.createPage(999)).rejects.toThrow();
        });
    });

    describe('refreshTTL', () => {
        it('should update TTL for browser instance', async () => {
            const bid = await manager.createBrowser();
            manager.refreshTTL(bid, 120);
            expect(manager.timeToLive[bid]).toBe(120);
        });

        it('should use default TTL when no timeout specified', async () => {
            const bid = await manager.createBrowser();
            manager.refreshTTL(bid);
            expect(manager.timeToLive[bid]).toBe(60);
        });
    });

    describe('destroyBrowser', () => {
        it('should close and cleanup browser instance', async () => {
            const bid = await manager.createBrowser();
            await manager.destroyBrowser(bid);
            expect(mockBrowser.close).toHaveBeenCalled();
            expect(manager.browsers[bid]).toBeNull();
        });
    });

    describe('cleanup', () => {
        it('should close all browser instances', async () => {
            await manager.createBrowser();
            await manager.createBrowser();
            await manager.cleanup();
            expect(mockBrowser.close).toHaveBeenCalledTimes(2);
            expect(manager.browsers).toHaveLength(0);
        });
    });

    describe('subscribeTTL', () => {
        it('should call callback with TTL updates', async () => {
            const bid = await manager.createBrowser();
            const mockCallback = jest.fn();
            const unsubscribe = manager.subscribeTTL(bid, mockCallback);
            
            // Wait for one tick
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            expect(mockCallback).toHaveBeenCalled();
            unsubscribe();
        });
    });
});
