# Piano di Sviluppo: Chat Anonime e Supporto OAuth/MCP

## Obiettivo
Permettere agli utenti di utilizzare la chat come anonimi, con persistenza solo in sessionStorage. Al login, migrare le chat anonime al database. Disabilitare MCP quando OAuth è configurato ma l'utente non è autenticato.

## Modifiche Backend

### 1. ChatController - Disabilitare MCP senza token OAuth
**File**: `backend/src/controllers/chatController.ts`

- Modificare `createMCPContextService` per restituire `null` se OAuth è abilitato ma non c'è token:
  ```typescript
  private createMCPContextService(oauthToken?: string): MCPContextService | null {
    if (!this.mcpEnabled) {
      return null;
    }
    // Se OAuth è abilitato, il token è obbligatorio per usare MCP
    if (isOAuthEnabled() && !oauthToken) {
      console.log('MCP disabled: OAuth is enabled but no token provided');
      return null;
    }
    // ... resto del codice
  }
  ```

### 2. ChatController - Endpoint pubblici per chat anonime
**File**: `backend/src/controllers/chatController.ts`

- Aggiungere metodo `createAnonymousChat` che:
  - Non richiede autenticazione
  - Crea chat temporanea in memoria (Map) con ID univoco
  - Chiama Gemini senza MCP (nessun token OAuth)
  - Restituisce chat con messaggi

- Aggiungere metodo `sendAnonymousMessage` che:
  - Non richiede autenticazione
  - Verifica che la chat esista nella Map in memoria
  - Chiama Gemini senza MCP
  - Restituisce messaggio AI

- Aggiungere metodo `migrateAnonymousChats` che:
  - Richiede autenticazione
  - Riceve array di chat anonime dal frontend
  - Crea chat nel database per l'utente autenticato
  - Restituisce array di chat migrate

- Aggiungere Map in memoria per chat anonime:
  ```typescript
  private anonymousChats: Map<string, { chatId: string; messages: Message[]; createdAt: Date }> = new Map();
  ```

### 3. Routes - Endpoint pubblici
**File**: `backend/src/index.ts`

- Aggiungere route pubbliche (prima delle route protette):
  ```typescript
  // Anonymous chat endpoints (public - no authentication)
  app.post('/api/anonymous/chats', (req, res, next) => {
    chatController.createAnonymousChat(req, res).catch(next);
  });
  app.post('/api/anonymous/chats/:chatId/messages', (req, res, next) => {
    chatController.sendAnonymousMessage(req, res).catch(next);
  });
  
  // Migrate anonymous chats (protected - requires authentication)
  app.post('/api/chats/migrate', authenticate, (req, res, next) => {
    chatController.migrateAnonymousChats(req, res).catch(next);
  });
  ```

- Aggiungere rate limiting più restrittivo per endpoint pubblici:
  ```typescript
  const anonymousLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  ```

### 4. Types - Request/Response per chat anonime
**File**: `backend/src/types/shared.ts`

- Aggiungere interfacce:
  ```typescript
  export interface AnonymousChat {
    id: string;
    title?: string;
    messages: Message[];
    createdAt: Date;
  }
  
  export interface MigrateChatsRequest {
    chats: AnonymousChat[];
  }
  
  export interface MigrateChatsResponse {
    migratedChats: Chat[];
  }
  ```

## Modifiche Frontend

### 5. ApiService - Endpoint pubblici e migrazione
**File**: `frontend/src/services/api.ts`

- Aggiungere metodo `requestPublic` per chiamate senza token:
  ```typescript
  private async requestPublic<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>>
  ```

- Aggiungere metodi per chat anonime:
  ```typescript
  async createAnonymousChat(request: CreateChatRequest): Promise<ApiResponse<Chat>>
  async sendAnonymousMessage(chatId: string, request: CreateMessageRequest): Promise<ApiResponse<Message>>
  async migrateAnonymousChats(chats: Chat[]): Promise<ApiResponse<Chat[]>>
  ```

### 6. SessionStorage Service - Gestione chat anonime
**File**: `frontend/src/services/anonymousChatService.ts` (nuovo)

- Creare servizio per gestire chat anonime in sessionStorage:
  ```typescript
  export class AnonymousChatService {
    private static STORAGE_KEY = 'anonymous_chats';
    
    static saveChats(chats: Chat[]): void
    static getChats(): Chat[]
    static clearChats(): void
    static addChat(chat: Chat): void
    static updateChat(chatId: string, updates: Partial<Chat>): void
    static deleteChat(chatId: string): void
  }
  ```

### 7. useChat - Supporto modalità anonima
**File**: `frontend/src/hooks/useChat.ts`

- Aggiungere parametro `isAnonymous: boolean` a `useChat`
- Modificare `createChat` per:
  - Se anonimo: chiamare `apiService.createAnonymousChat` e salvare in sessionStorage
  - Se autenticato: chiamare `apiService.createChat` (comportamento attuale)

- Modificare `sendMessage` per:
  - Se anonimo: chiamare `apiService.sendAnonymousMessage` e aggiornare sessionStorage
  - Se autenticato: chiamare `apiService.sendMessage` (comportamento attuale)

- Modificare `loadChat` per:
  - Se anonimo: caricare da sessionStorage
  - Se autenticato: caricare da API (comportamento attuale)

### 8. useSidebar - Supporto modalità anonima
**File**: `frontend/src/hooks/useSidebar.ts`

- Modificare per accettare parametro `isAnonymous: boolean`
- Se anonimo: caricare chat da sessionStorage invece che da API
- Se autenticato: comportarsi come attualmente

### 9. AuthContext - Migrazione chat al login
**File**: `frontend/src/contexts/AuthContext.tsx`

- Modificare `login` per:
  - Dopo login riuscito, controllare se ci sono chat anonime in sessionStorage
  - Se sì, chiamare `apiService.migrateAnonymousChats`
  - Aggiornare sidebar con chat migrate
  - Pulire sessionStorage

### 10. Sidebar - Bottone Login/Logout condizionale
**File**: `frontend/src/components/sidebar/Sidebar.tsx`

- Modificare sezione utente in fondo:
  - Se anonimo: mostrare "Anonymous" e bottone "Login" (navigate to /login)
  - Se autenticato: mostrare username e bottone "Logout" (comportamento attuale)
  - Nascondere lista chat se anonimo (o mostrare chat da sessionStorage)

### 11. App - Routing per accesso anonimo
**File**: `frontend/src/App.tsx`

- Rimuovere `ProtectedRoute` da route `/`:
  ```typescript
  <Route
    path="/"
    element={<MainApp />}
  />
  ```

- Mantenere `ProtectedRoute` per `/settings`:
  ```typescript
  <Route
    path="/settings"
    element={
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    }
  />
  ```

- Modificare `MainApp` per passare `isAuthenticated` ai componenti figli

### 12. ChatInterface - Gestione stato anonimo
**File**: `frontend/src/components/ChatInterface.tsx`

- Modificare per ricevere `isAnonymous: boolean` come prop
- Passare `isAnonymous` a `useChat`

## Considerazioni Implementative

### Rate Limiting
- Endpoint pubblici devono avere rate limiting più restrittivo (50 richieste/15min vs 1000/15min)
- Considerare rate limiting per IP invece che per utente

### Sicurezza
- Chat anonime in memoria backend hanno timeout (es. 1 ora di inattività)
- Validazione input per endpoint pubblici
- Limitare dimensione messaggi per chat anonime

### Performance
- SessionStorage ha limite ~5-10MB, monitorare dimensione chat anonime
- Considerare cleanup automatico chat anonime vecchie

### Testing
- Test endpoint pubblici senza autenticazione
- Test migrazione chat anonime
- Test disabilitazione MCP senza token OAuth
- Test rate limiting endpoint pubblici

## Ordine di Implementazione

1. Backend: Disabilitare MCP senza token OAuth
2. Backend: Endpoint pubblici per chat anonime
3. Backend: Endpoint migrazione chat
4. Frontend: SessionStorage service
5. Frontend: ApiService endpoint pubblici
6. Frontend: useChat modalità anonima
7. Frontend: useSidebar modalità anonima
8. Frontend: Routing accesso anonimo
9. Frontend: Sidebar Login/Logout condizionale
10. Frontend: Migrazione chat al login
11. Testing e cleanup

## Task List

### Backend
- [ ] Modificare `createMCPContextService` per disabilitare MCP se OAuth è abilitato ma non c'è token
- [ ] Aggiungere Map in memoria per chat anonime in ChatController con cleanup automatico
- [ ] Implementare `createAnonymousChat` e `sendAnonymousMessage` in ChatController (senza MCP, senza DB)
- [ ] Implementare `migrateAnonymousChats` in ChatController per migrare chat al database
- [ ] Aggiungere route pubbliche `/api/anonymous/chats` e `/api/anonymous/chats/:chatId/messages` con rate limiting
- [ ] Aggiungere route protetta `/api/chats/migrate` per migrazione chat anonime
- [ ] Aggiungere interfacce `AnonymousChat`, `MigrateChatsRequest`, `MigrateChatsResponse` in types/shared.ts

### Frontend
- [ ] Creare `anonymousChatService.ts` per gestire chat anonime in sessionStorage
- [ ] Aggiungere `requestPublic` e metodi `createAnonymousChat`, `sendAnonymousMessage`, `migrateAnonymousChats` in api.ts
- [ ] Modificare `useChat` per supportare modalità anonima (parametro `isAnonymous`, chiamate a endpoint pubblici)
- [ ] Modificare `useSidebar` per supportare modalità anonima (caricare da sessionStorage invece che API)
- [ ] Rimuovere `ProtectedRoute` da route `/` e modificare `MainApp` per passare `isAuthenticated` ai componenti
- [ ] Modificare `Sidebar` per mostrare Login quando anonimo e Logout quando autenticato
- [ ] Modificare `AuthContext.login` per migrare chat anonime dopo login riuscito
- [ ] Modificare `ChatInterface` per ricevere e passare `isAnonymous` a `useChat`

