# Error Handling v2 - Frontend-Driven Localization

## 🎯 Overview

Improved error handling architecture that separates concerns: backend handles error detection and API logic, while frontend provides localized, user-friendly error messages.

## ✅ What Changed

### **Previous Approach (v1)**
- ❌ Backend returned hardcoded error messages in Italian
- ❌ Language detection was domain-specific (MCP keywords)
- ❌ Not reusable across different contexts
- ❌ Backend had presentation logic

### **New Approach (v2)**
- ✅ Backend returns structured error codes
- ✅ Frontend handles localization based on browser language
- ✅ Generic and reusable across any LLM/MCP context
- ✅ Clean separation of concerns

## 🏗️ Architecture

### **Backend Responsibilities**
1. Detect error types (retryable vs non-retryable)
2. Implement retry logic with exponential backoff
3. Return structured error responses with error codes
4. Propagate errors to controller layer

### **Frontend Responsibilities**
1. Detect user's browser language
2. Display localized error messages
3. Handle different error types appropriately
4. Provide good UX during errors

## 🔧 Implementation Details

### **1. Backend Error Propagation**

```typescript
// backend/src/services/geminiService.ts
async sendMessageWithFallback(messages: Message[]): Promise<GeminiResponse> {
  // Simply call sendMessage - it has retry logic built-in
  // If it fails after all retries, let the error propagate to the controller
  return await this.sendMessage(messages);
}
```

**Controller Error Handling:**
```typescript
// backend/src/controllers/chatController.ts
try {
  const aiResponse = await geminiService.sendMessageWithFallback(chatHistory);
  // ... success handling
} catch (error) {
  // Return specific error code for LLM unavailability
  return res.status(503).json({
    success: false,
    error: 'AI_SERVICE_UNAVAILABLE',
    errorType: 'LLM_UNAVAILABLE',
    message: 'The AI service is temporarily unavailable. Please try again in a few moments.',
    retryAfter: 60 // Suggest retry after 60 seconds
  });
}
```

### **2. Frontend Localization System**

**i18n Support:**
```typescript
// frontend/src/utils/i18n.ts
export type SupportedLanguage = 'en' | 'it' | 'es' | 'fr' | 'de';

const translations: Record<SupportedLanguage, Translations> = {
  en: {
    errors: {
      llm_unavailable: 'The AI service is temporarily unavailable...',
      // ... more translations
    }
  },
  it: {
    errors: {
      llm_unavailable: 'Il servizio AI è temporaneamente non disponibile...',
      // ... more translations
    }
  },
  // ... es, fr, de
};

export function detectBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();
  
  for (const lang of Object.keys(translations) as SupportedLanguage[]) {
    if (browserLang.startsWith(lang)) {
      return lang;
    }
  }
  
  return 'en'; // Default to English
}
```

**Error Message Mapping:**
```typescript
// frontend/src/hooks/useChat.ts
function getErrorMessage(response: ApiResponse<any>, context: 'send' | 'load' | 'create'): string {
  // Handle specific error types
  if (response.errorType === 'LLM_UNAVAILABLE') {
    return context === 'create' 
      ? t('errors.llm_unavailable_on_create')
      : t('errors.llm_unavailable');
  }
  
  if (response.error === 'NETWORK_ERROR') {
    return t('errors.network_error');
  }
  
  // Fallback to context-specific errors
  switch (context) {
    case 'send':
    case 'create':
      return t('errors.failed_to_send');
    case 'load':
      return t('errors.failed_to_load');
    default:
      return t('errors.unknown_error');
  }
}
```

### **3. API Response Structure**

**Shared Types:**
```typescript
// shared/types/index.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;           // Error code (e.g., 'AI_SERVICE_UNAVAILABLE')
  errorType?: string;       // Error type (e.g., 'LLM_UNAVAILABLE')
  message?: string;         // Human-readable message (English)
  retryAfter?: number;      // Suggested retry delay in seconds
  chatId?: string;          // Chat ID if chat was created but LLM failed
}
```

**Enhanced API Service:**
```typescript
// frontend/src/services/api.ts
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    // If response is not OK, preserve error details from backend
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
        errorType: data.errorType,
        message: data.message,
        retryAfter: data.retryAfter,
        chatId: data.chatId
      };
    }

    return data;
  } catch (error) {
    // Network error or JSON parse error
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

## 📊 Error Flow Diagram

```
┌─────────────────┐
│   User Action   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Frontend     │
│  (useChat hook) │
└────────┬────────┘
         │ API Call
         ▼
┌─────────────────┐
│  API Service    │
│   (fetch)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  chatController │
│    (Express)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  geminiService  │
│ (with retry)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Success │ Failure
    ▼         ▼
┌───────┐ ┌────────────────┐
│Return │ │ Throw Error    │
│ 200   │ │ with details   │
└───────┘ └────────┬───────┘
            ▼
      ┌──────────────────┐
      │ Controller catches│
      │ Returns 503 with │
      │ errorType        │
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │ Frontend receives│
      │ Detects language │
      │ Shows localized  │
      │ error message    │
      └──────────────────┘
```

## 🌍 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English  | `en` | ✅ Complete |
| Italian  | `it` | ✅ Complete |
| Spanish  | `es` | ✅ Complete |
| French   | `fr` | ✅ Complete |
| German   | `de` | ✅ Complete |

### Adding New Languages

1. Add language to `SupportedLanguage` type:
```typescript
export type SupportedLanguage = 'en' | 'it' | 'es' | 'fr' | 'de' | 'pt';
```

2. Add translations:
```typescript
const translations: Record<SupportedLanguage, Translations> = {
  // ... existing languages
  pt: {
    errors: {
      llm_unavailable: 'O serviço de IA está temporariamente indisponível...',
      // ... more translations
    },
    chat: {
      thinking: 'A IA está pensando...',
      // ... more translations
    }
  }
};
```

## 🧪 Testing

### Backend Tests

```typescript
// backend/src/test/controllers/chatController.errorHandling.test.ts
it('should return 503 with LLM_UNAVAILABLE error type when sending message fails', async () => {
  (geminiService.sendMessageWithFallback as jest.Mock).mockRejectedValue(
    new Error('Failed to get response from Gemini: The model is overloaded')
  );

  await controller.sendMessage(mockReq as any, mockRes as Response);

  expect(mockRes.status).toHaveBeenCalledWith(503);
  expect(mockRes.json).toHaveBeenCalledWith({
    success: false,
    error: 'AI_SERVICE_UNAVAILABLE',
    errorType: 'LLM_UNAVAILABLE',
    message: expect.any(String),
    retryAfter: 60
  });
});
```

### Frontend Tests

```typescript
// frontend/src/utils/__tests__/i18n.test.ts
describe('LLM Error Messages', () => {
  const languages: SupportedLanguage[] = ['en', 'it', 'es', 'fr', 'de'];

  languages.forEach(lang => {
    it(`should have LLM unavailable message in ${lang}`, () => {
      const message = t('errors.llm_unavailable', lang);
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0);
    });
  });
});
```

## 📈 Benefits

1. **🌍 Multilingual Support**: Automatic language detection and localization
2. **🔧 Maintainability**: Easy to add new languages or update messages
3. **♻️ Reusability**: Backend code is generic and works with any MCP/LLM
4. **📱 Better UX**: Error messages in user's native language
5. **🎯 Separation of Concerns**: Backend handles logic, frontend handles presentation
6. **🧪 Testability**: Easy to test both backend error codes and frontend translations
7. **🔍 Debugging**: Structured error codes help identify issues quickly

## 🚀 Migration Path

If you're upgrading from v1:

1. ✅ Remove `getFallbackResponse()` from `geminiService.ts`
2. ✅ Update `sendMessageWithFallback()` to propagate errors
3. ✅ Update controllers to return structured error responses
4. ✅ Add `i18n.ts` to frontend
5. ✅ Update `useChat` hook to use localized errors
6. ✅ Add `useTranslation` hook for UI strings
7. ✅ Update API service to preserve error details
8. ✅ Write tests for both backend and frontend

## 🔗 Related Documentation

- [Gemini Integration](../integrations/gemini-integration.md)
- [MCP Protocol](../integrations/mcp-protocol.md)
- [Error Handling v1](./error-handling.md) (deprecated)

## 📝 Notes

- The backend still returns an English `message` field for logging/debugging purposes
- Frontend ignores the backend `message` and uses its own translations
- Error codes (`error` and `errorType`) are the source of truth for error handling
- Browser language is detected once on app load and can be changed by user preference

