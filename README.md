# puppet-manager

## 📚 Documentation

Welcome to Puppanel - A simplified Puppeteer management interface! 🚀

### 🎯 Features
- 🔄 Automatic browser lifecycle management
- ⏲️ Built-in timeout controls with customizable durations
- 🎮 Simple and intuitive API
- 🛡️ TypeScript support out of the box

### 📥 Installation

```bash
npm install puppanel
# or
yarn add puppanel
# or
pnpm add puppanel
```

### 🚀 Quick Start

```typescript
import { PuppetManager } from 'puppanel';

// Create instance with default timeout (60 seconds)
const puppet = new PuppetManager();

// OR: Create instance with custom global timeout
const puppetWith2min = new PuppetManager({ defaultTimeout: 120 }); // 2 minutes

// Example: Create browser and navigate to a page
async function example() {
  // Create new browser instance
  const browserId = await puppet.createBrowser();
  
  // Create new page
  const page = await puppet.createPage(browserId);
  
  // Use the page as you would with regular Puppeteer
  await page.goto('https://example.com');
  
  // Update timeout to a specific value (optional)
  puppet.refreshTTL(browserId, 300); // Set 5 minutes for this instance
}
```

### ⚡ Timeout Management

Puppanel offers three ways to control browser timeouts:

1. **Default Timeout** (60 seconds)
```typescript
const puppet = new PuppetManager();
```

2. **Custom Global Timeout**
```typescript
const puppet = new PuppetManager({ 
  defaultTimeout: 180 // 3 minutes for all instances
});
```

3. **Per-Instance Timeout**
```typescript
const browserId = await puppet.createBrowser();
puppet.refreshTTL(browserId, 600); // 10 minutes for this instance
```

### 🛠️ Complete API

#### PuppetManager

```typescript
interface PuppetManagerOptions {
  browserOptions?: LaunchOptions;  // Puppeteer launch options
  defaultTimeout?: number;         // Time in seconds
}

class PuppetManager {
  constructor(options?: PuppetManagerOptions);
  
  createBrowser(): Promise<number>;
  createPage(bid: number): Promise<Page>;
  refreshTTL(bid: number, timeout?: number): void;
  subscribeTTL(bid: number, callback: (timeToLive: number) => void): () => void;
  destroyBrowser(bid: number): Promise<void>;
  cleanup(): Promise<void>;
}
```

### ⚠️ Important Notes

1. Default timeout is 60 seconds if not specified
2. Each page interaction automatically refreshes the TTL
3. Use `cleanup()` when finished to prevent memory leaks
4. Timeout can be updated at any time using `refreshTTL()`

### 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

### 📝 License

MIT License - see the LICENSE file for details

---
Made with ❤️ by [dark1zinn](https://github.com/dark1zinn)
