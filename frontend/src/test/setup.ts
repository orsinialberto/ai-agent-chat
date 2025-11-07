import '@testing-library/jest-dom';

// Mock ResizeObserver for recharts tests
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
} as typeof ResizeObserver;
