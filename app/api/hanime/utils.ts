import fetch, { Headers, Request, Response } from 'node-fetch';

// Setup fetch polyfill
if (!global.fetch) {
  (global as any).fetch = fetch;
  (global as any).Headers = Headers;
  (global as any).Request = Request;
  (global as any).Response = Response;
}

export const setupFetch = () => {
  // Already done above, but exported for clarity
};
