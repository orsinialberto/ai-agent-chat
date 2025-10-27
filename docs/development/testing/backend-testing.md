# Backend Testing - AI Agent Chat

## 📋 Overview

The AI Agent Chat backend uses **Jest** as the testing framework to ensure code quality and reliability.

## 🧪 Test Types

### 1. Unit Tests
**File**: `backend/src/test/gemini.test.ts`

Tests for the Gemini service that verify:
- Service initialization with API key
- Error handling when API key is missing
- Message processing
- Integration with Gemini API

### 2. End-to-End (E2E) Tests
**File**: `backend/src/test/e2e.test.ts`

E2E tests that verify the entire application flow:
- **Health Checks**: server status verification
- **Database Connection**: PostgreSQL database connection
- **Gemini Connection**: Gemini API connection
- **Chat Management**:
  - New chat creation
  - Retrieve all chats
  - Retrieve a specific chat
  - Send messages
- **Error Handling**: handling errors with invalid chat IDs

## 🚀 How to Run Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run Tests in Watch Mode
```bash
cd backend
npm run test:watch
```

### Run a Specific Test
```bash
cd backend
npm test gemini.test
# or
npm test e2e.test
```

### Tests with Coverage
Tests automatically include coverage reports. Results are available in:
- **Text**: directly in the terminal
- **HTML**: `backend/coverage/index.html`
- **LCOV**: `backend/coverage/lcov.info`

## ⚙️ Configuration

### Configuration Files
- **`backend/jest.config.js`**: Jest main configuration
- **`backend/src/test/setup.ts`**: test environment setup

### Environment Variables
Tests use specific environment variables:

```env
NODE_ENV=test
GEMINI_API_KEY=test-api-key  # For unit tests only
```

**Note**: E2E tests require the backend server to be running on `http://localhost:3001`

## 📝 Test Structure

### Example: Unit Test
```typescript
import { GeminiService } from '../services/geminiService';
import { Message, MessageRole } from '../../../shared/types';

describe('Gemini Service Integration', () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  describe('Service Initialization', () => {
    it('should initialize with API key', () => {
      const service = new GeminiService();
      expect(service).toBeDefined();
    });
  });
});
```

### Example: E2E Test
```typescript
describe('AI Agent Chat - E2E Tests', () => {
  const API_BASE_URL = 'http://localhost:3001/api';

  it('should check server health', async () => {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('OK');
  });
});
```

## 🔧 Prerequisites for E2E Tests

Before running E2E tests, make sure:

1. **PostgreSQL database is running**:
```bash
docker-compose up -d
```

2. **Backend is running**:
```bash
cd backend
npm run dev
```

3. **Environment variables are configured** (`.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_agent_chat
GEMINI_API_KEY=your-actual-api-key
```

## 📊 Expected Results

### Unit Tests (gemini.test.ts)
- ✅ Service initialization tests
- ✅ Message processing tests
- ✅ API integration tests

### E2E Tests (e2e.test.ts)
- ✅ Health Checks (3 test)
- ✅ Chat Management (4 test)
- ✅ Error Handling (2 test)

**Total**: 9 E2E test cases + 3 unit test cases = 12 total tests

## 🐛 Troubleshooting

### Error: "Cannot find module"
Make sure you have installed the dependencies:
```bash
cd backend
npm install
```

### Error: "Connection refused" in E2E tests
Verify that the backend server is running:
```bash
curl http://localhost:3001/health
```

### Error: "Database connection failed"
Verify that Docker is running:
```bash
docker ps
docker-compose up -d
```

## 📈 Future Improvements

- [ ] Add tests for controllers
- [ ] Add tests for middleware
- [ ] Add tests for MCP services
- [ ] Increase test coverage
- [ ] Integrate CI/CD tests with GitHub Actions

---

*For more information, see [Best Practices](../best-practices.md)*

