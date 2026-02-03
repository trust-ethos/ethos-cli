/**
 * HTTP fetch entry point for the Ethos CLI.
 *
 * Why globalThis.fetch?
 *
 * In Bun's runtime, fetch is a first-class primitive - not a polyfill or add-on like in Node.js.
 * Using globalThis.fetch directly is the idiomatic pattern for Bun applications:
 *
 * 1. Bun was designed with fetch as THE standard HTTP API, optimized at the native level.
 *    Unlike Node.js where fetch was added in v18, Bun's fetch is foundational.
 *
 * 2. Bun's official testing guidance recommends mocking at the module level (mock.module),
 *    not at the fetch level. Our test suite follows this pattern - EchoClient is mocked
 *    entirely, so fetch is never invoked during tests.
 *
 * 3. For CLI applications, dependency injection of fetch provides no practical benefit:
 *    - Single runtime environment (Bun)
 *    - No need for runtime HTTP client swapping
 *    - Tests mock at the API client layer, not HTTP layer
 *
 * This named export provides a single entry point for fetch usage, making it grep-able
 * and mockable if HTTP-layer testing is ever needed.
 *
 * Sources:
 * - Bun test mocking docs: https://bun.sh/docs/test/mocks
 * - Bun fetch implementation: https://bun.sh/docs/api/fetch
 * - Pattern from Bun docs: mock.module() for API client mocking, not fetch interception
 */
export const httpFetch: typeof globalThis.fetch = globalThis.fetch;
