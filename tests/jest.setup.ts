jest.setTimeout(30000); // 30 seconds global timeout

beforeAll(() => {
    // Setup global test environment
    console.log('Setting up test environment...');
});

afterAll(() => {
    // Cleanup after all tests
    console.log('Cleaning up test environment...');
});
