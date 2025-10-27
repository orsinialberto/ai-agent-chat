# Testing Documentation

## 🎯 Overview

This section contains the complete documentation for the AI Agent Chat project tests. Tests are implemented for both backend and frontend to ensure quality and system reliability.

## 📚 Available Documentation

### Backend Testing
- **[Complete Guide](./backend-testing.md)** - How to test the backend with Jest
- Unit tests for services
- E2E tests for the API

### Frontend Testing
- **[Complete Guide](./frontend-testing.md)** - How to test the frontend with Vitest
- React component tests
- Custom hooks tests

## 🚀 Quick Start

### Run All Tests
```bash
# Backend
cd backend && npm test

# Frontend  
cd frontend && npm test
```

### Run Tests in Watch Mode
```bash
# Backend
cd backend && npm run test:watch

# Frontend
cd frontend && npm test -- --watch
```

## 📊 Test Statistics

### Backend (Jest)
- **Framework**: Jest + ts-jest
- **Test files**: 2
  - `gemini.test.ts` - Unit tests
  - `e2e.test.ts` - E2E tests
- **Test cases**: ~12
- **Coverage**: In development

### Frontend (Vitest)
- **Framework**: Vitest + React Testing Library
- **Test files**: 6
  - Component tests: 4 files
  - Hook tests: 1 file
  - MarkdownRenderer: 1 file
- **Test cases**: ~15+
- **Coverage**: In development

## 🎯 Best Practices

### Writing Tests
1. **Use descriptive names**: `it('should handle empty message content')`
2. **Isolated tests**: Each test must be independent
3. **AAA Pattern**: Arrange, Act, Assert
4. **Appropriate mocking**: Mock only what is necessary

### Organization
```
backend/
  src/
    test/          # Test files
      gemini.test.ts
      e2e.test.ts
      setup.ts     # Jest setup

frontend/
  src/
    components/
      __tests__/   # Component tests
    hooks/
      __tests__/   # Hook tests
```

### Coverage
- **Goal**: >80% code coverage
- **Priority**: Business logic and critical services
- **Exclude**: Configuration files, types

## 🔧 Configuration

### Backend - jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
```

### Frontend - vitest.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

## 📈 Testing Roadmap

### Backend
- [ ] Add tests for all controllers
- [ ] Add tests for middleware
- [ ] Add tests for MCP services
- [ ] Improve Gemini tests with proper mocking
- [ ] Add database integration tests

### Frontend
- [ ] Add tests for ChatInterface
- [ ] Add tests for Header
- [ ] Add tests for API services
- [ ] React Query integration tests
- [ ] E2E tests with Playwright

### Infrastructure
- [ ] Setup CI/CD with automated tests
- [ ] Code coverage reporting
- [ ] Test coverage badges
- [ ] Pre-commit hooks with tests

## 🐛 Troubleshooting

### Common Issues

**Error**: "Cannot find module"
- Solution: `npm install`

**Error**: "Connection refused" (E2E tests)
- Solution: Start the server with `npm run dev`

**Error**: "Database connection failed"
- Solution: Start Docker with `docker-compose up -d`

**Slow or hanging tests**
- Solution: Increase timeout in jest.config.js

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/react)
- [Best Practices](./../best-practices.md)

---

*Last updated: October 2024*

