# Piano di Refactoring - Riduzione Duplicazione e Miglioramento Leggibilità

## Obiettivi
- Ridurre ~370 righe di codice duplicato (~15-20% del backend)
- Migliorare leggibilità e manutenibilità
- Standardizzare gestione errori e risposte API
- Eliminare codice ridondante

---

## FASE 1: CRITICI - Rimozione Codice Ridondante (Priorità Alta)

### 1.1 Rimuovere controlli `req.user` ridondanti
**Problema**: I controlli `if (!req.user)` sono ridondanti perché il middleware `authenticate` protegge già le route.

**File affetti**: 
- `backend/src/controllers/chatController.ts` (6 occorrenze: righe 64, 151, 252, 282, 354, 412)
- `backend/src/controllers/authController.ts` (4 occorrenze: righe 143, 173, 208, 277)

**Azioni**:
- Rimuovere tutti i controlli `if (!req.user)` dai controller methods protetti da `authenticate`
- Verificare che il middleware `authenticate` gestisca correttamente tutti i casi
- Mantenere controlli solo in `optionalAuthenticate` dove necessario

**Risultato atteso**: Riduzione ~60 righe, codice più pulito

**Dopo completamento**:
- Aggiornare `docs/architecture/backend.md` sezione "Authentication System" per rimuovere riferimenti a controlli ridondanti
- Fermarsi per commit

---

### 1.2 Creare Response Helper Utility
**Problema**: Pattern di risposta errori duplicato in ogni controller (15+ occorrenze).

**File da creare**: `backend/src/utils/responseHelpers.ts`

**Implementazione**:
```typescript
export class ResponseHelper {
  static success<T>(res: Response, data: T, statusCode: number = 200)
  static error(res: Response, error: string, message: string, statusCode: number = 500, errorType?: string)
  static unauthorized(res: Response, message?: string)
  static notFound(res: Response, message?: string)
  static badRequest(res: Response, message: string, errorType?: string)
  static serviceUnavailable(res: Response, message: string, errorType?: string, retryAfter?: number, chatId?: string)
}
```

**File da refactorizzare**:
- `backend/src/controllers/chatController.ts` - Sostituire tutti i `res.status().json()` con `ResponseHelper.*`
- `backend/src/controllers/authController.ts` - Sostituire tutti i `res.status().json()` con `ResponseHelper.*`
- `backend/src/controllers/healthController.ts` - Sostituire se necessario

**Risultato atteso**: Riduzione ~150 righe, risposte API standardizzate

**Dopo completamento**:
- Aggiornare `docs/architecture/backend.md` sezione "Project Structure" per aggiungere `utils/responseHelpers.ts`
- Aggiornare sezione "Error Handling" per documentare ResponseHelper
- Aggiornare sezione "API Endpoints" per menzionare standardizzazione risposte
- Fermarsi per commit

---

### 1.3 Refactoring metodi lunghi in ChatController
**Problema**: `createChat` e `sendMessage` fanno troppe cose (100+ righe ciascuno).

**File**: `backend/src/controllers/chatController.ts`

**Azioni**:
1. Estrarre `handleModelSwitch(model?: string)` - Gestione switch modello con validazione
2. Estrarre `processInitialMessage(chatId, initialMessage, model?)` - Processamento messaggio iniziale
3. Estrarre `getAIMessageResponse(chatHistory, content, mcpContextService?)` - Logica risposta AI
4. Semplificare `createChat` e `sendMessage` usando i metodi estratti

**Metodi da semplificare**:
- `createChat` (righe 59-140) → ~40 righe
- `sendMessage` (righe 145-244) → ~50 righe

**Risultato atteso**: Migliore leggibilità, riduzione ~50 righe, metodi più testabili

**Dopo completamento**:
- Aggiornare `docs/architecture/backend.md` sezione "Chat System" per documentare i nuovi metodi privati
- Aggiornare diagramma architettura se necessario
- Fermarsi per commit

---

## FASE 2: IMPORTANTI - Eliminazione Duplicazione (Priorità Media)

### 2.1 Creare MessageRole Converter Utility
**Problema**: Conversione Prisma ↔ Shared MessageRole duplicata in `databaseService.ts`.

**File da creare**: `backend/src/utils/messageRoleConverter.ts`

**Implementazione**:
```typescript
export class MessageRoleConverter {
  static toPrisma(role: MessageRole): PrismaMessageRole
  static toShared(role: PrismaMessageRole): MessageRole
}
```

**File da refactorizzare**: 
- `backend/src/services/databaseService.ts`
  - Metodo `addMessage` (righe 118-125) - Usare `MessageRoleConverter.toPrisma()`
  - Metodo `mapMessageToShared` (righe 194-201) - Usare `MessageRoleConverter.toShared()`

**Risultato atteso**: Riduzione ~30 righe, conversione centralizzata

**Dopo completamento**:
- Aggiornare `docs/architecture/backend.md` sezione "Project Structure" per aggiungere `utils/messageRoleConverter.ts`
- Aggiornare sezione "Database" per menzionare MessageRoleConverter
- Fermarsi per commit

---

### 2.2 Refactoring MCPClient - Eliminare duplicazione JSON-RPC
**Problema**: Struttura JSON-RPC duplicata in `callTool`, `getAvailableTools`, `initialize`.

**File**: `backend/src/services/mcpClient.ts`

**Azioni**:
1. Creare metodo privato `makeJsonRpcRequest(method: string, params: any): Promise<any>`
2. Estrarre logica comune: costruzione request body, headers, timeout, OAuth token, error handling
3. Refactorizzare `callTool`, `getAvailableTools`, `initialize` per usare `makeJsonRpcRequest`

**Metodi da refactorizzare**:
- `callTool` (righe 37-108) → ~30 righe
- `getAvailableTools` (righe 113-158) → ~15 righe  
- `initialize` (righe 163-209) → ~15 righe

**Risultato atteso**: Riduzione ~80 righe, codice più manutenibile

**Dopo completamento**:
- Aggiornare `docs/architecture/backend.md` sezione "MCP Integration" per documentare il refactoring
- Aggiornare `docs/integrations/mcp-protocol.md` se necessario
- Fermarsi per commit

---

### 2.3 Semplificare gestione errori LLM
**Problema**: Pattern di gestione errori LLM duplicato in `createChat` e `sendMessage`.

**File**: `backend/src/controllers/chatController.ts`

**Azioni**:
1. Estrarre metodo `handleLLMError(error: any, chatId?: string)` che ritorna risposta standardizzata
2. Usare `ResponseHelper.serviceUnavailable()` per errori LLM
3. Sostituire blocchi catch duplicati in `createChat` e `sendMessage`

**Risultato atteso**: Gestione errori più consistente, ~20 righe ridotte

**Dopo completamento**:
- Aggiornare `docs/architecture/backend.md` sezione "Error Handling" per documentare gestione errori LLM
- Fermarsi per commit

---

## FASE 3: OPZIONALI - Miglioramenti Architetturali (Priorità Bassa)

### 3.1 Creare OAuth Service dedicato (Opzionale)
**Problema**: Logica OAuth sparsa in `authService.ts` e `authMiddleware.ts`.

**File da creare**: `backend/src/services/oauthService.ts`

**Implementazione**:
```typescript
export class OAuthService {
  async getToken(username: string, password: string): Promise<{ access_token: string; expires_in: number }>
  isTokenExpired(expiry: number): boolean
  validateTokenExpiry(expiry: number): void
}
```

**File da refactorizzare**:
- `backend/src/services/authService.ts` - Spostare `getOAuthToken` in OAuthService
- `backend/src/middleware/authMiddleware.ts` - Usare OAuthService per validazione expiry

**Risultato atteso**: Migliore separazione delle responsabilità

**Dopo completamento**:
- Aggiornare `docs/architecture/backend.md` sezione "Authentication System" per documentare OAuthService
- Aggiornare sezione "Project Structure" per aggiungere `services/oauthService.ts`
- Fermarsi per commit

---

### 3.2 Consolidare validazione modello (Opzionale)
**Problema**: Validazione modello duplicata in `createChat` e `sendMessage`.

**Soluzione**: Già coperto in 1.3 con `handleModelSwitch()`, ma può essere esteso per validazione più robusta.

---

## Ordine di Esecuzione

1. **FASE 1.1** - Rimozione controlli req.user (più veloce, impatto immediato)
   - ✅ Completare modifiche
   - ✅ Aggiornare documentazione
   - ⏸️ **FERMARSI PER COMMIT**

2. **FASE 1.2** - Response Helper (fondamentale per standardizzare)
   - ✅ Completare modifiche
   - ✅ Aggiornare documentazione
   - ⏸️ **FERMARSI PER COMMIT**

3. **FASE 1.3** - Refactoring ChatController (usa Response Helper)
   - ✅ Completare modifiche
   - ✅ Aggiornare documentazione
   - ⏸️ **FERMARSI PER COMMIT**

4. **FASE 2.1** - MessageRole Converter (isolato, facile)
   - ✅ Completare modifiche
   - ✅ Aggiornare documentazione
   - ⏸️ **FERMARSI PER COMMIT**

5. **FASE 2.2** - MCPClient refactoring (isolato, migliora manutenibilità)
   - ✅ Completare modifiche
   - ✅ Aggiornare documentazione
   - ⏸️ **FERMARSI PER COMMIT**

6. **FASE 2.3** - Gestione errori LLM (usa Response Helper)
   - ✅ Completare modifiche
   - ✅ Aggiornare documentazione
   - ⏸️ **FERMARSI PER COMMIT**

7. **FASE 3** - Opzionali (se tempo disponibile)
   - ✅ Completare modifiche
   - ✅ Aggiornare documentazione
   - ⏸️ **FERMARSI PER COMMIT**

---

## Testing

Per ogni fase:
- Eseguire test esistenti: `npm test` in backend
- Verificare che tutti i test passino
- Testare manualmente endpoint critici (createChat, sendMessage)
- Verificare che error handling funzioni correttamente

---

## Metriche di Successo

- Riduzione totale: ~370 righe di codice
- Zero regressioni: tutti i test devono passare
- Miglioramento leggibilità: metodi < 50 righe
- Standardizzazione: tutte le risposte API usano ResponseHelper
- Eliminazione duplicazione: zero pattern duplicati identici

---

## File Modificati/Creati

**Nuovi file**:
- `backend/src/utils/responseHelpers.ts`
- `backend/src/utils/messageRoleConverter.ts`
- `backend/src/services/oauthService.ts` (opzionale)

**File modificati**:
- `backend/src/controllers/chatController.ts`
- `backend/src/controllers/authController.ts`
- `backend/src/services/databaseService.ts`
- `backend/src/services/mcpClient.ts`
- `backend/src/services/authService.ts` (se FASE 3)
- `backend/src/middleware/authMiddleware.ts` (se FASE 3)

**File documentazione da aggiornare**:
- `docs/architecture/backend.md` (dopo ogni fase)
- `docs/integrations/mcp-protocol.md` (dopo FASE 2.2)

---

## Note Importanti

- **Dopo ogni fase completata**: Aggiornare la documentazione e fermarsi per permettere il commit
- **Testing**: Eseguire test dopo ogni fase prima di procedere
- **Commit incrementali**: Ogni fase è un commit separato per facilitare review e rollback se necessario

