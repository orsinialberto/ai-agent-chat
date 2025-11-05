# Authentication System

Sistema di autenticazione completo con JWT per frontend-backend e OAuth token opzionale per MCP.

## 📋 Panoramica

Il sistema di autenticazione è composto da due livelli:

1. **JWT (JSON Web Token)**: Autenticazione obbligatoria tra frontend e backend
2. **OAuth Token**: Autenticazione opzionale tra backend e server MCP (solo se MCP è configurato)

## 🏗️ Architettura

```
┌─────────────┐       JWT        ┌─────────────┐    OAuth Token    ┌─────────────┐
│   FRONTEND  │ ◄────────────► │   BACKEND   │ ◄────────────────► │ MCP SERVER  │
│  (React)    │                 │  (Express)  │                     │   (Mock)    │
└─────────────┘                 └─────────────┘                     └─────────────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │  PostgreSQL │
                                │   (Users)   │
                                └─────────────┘
```

## 🗄️ Schema Database

### Tabella Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,  -- bcrypt hash
  oauth_token VARCHAR,         -- Deprecato: token ora è nel JWT, non nel DB
  token_expiry TIMESTAMP,      -- Deprecato: expiry ora è nel JWT, non nel DB
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Nota:** I campi `oauth_token` e `token_expiry` sono ancora presenti nello schema per compatibilità, ma non vengono più utilizzati. Il token OAuth è ora memorizzato nel JWT payload.

### Relazione User-Chat

```sql
-- Chats ora hanno un campo userId
ALTER TABLE chats ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
```

## 🔐 Backend

### 1. Auth Service (`backend/src/services/authService.ts`)

**Metodi principali:**

```typescript
class AuthService {
  // Registrazione utente
  async register(username, email, password): Promise<AuthResponse>
  
  // Login utente
  async login(usernameOrEmail, password): Promise<AuthResponse>
  
  // Genera JWT token
  generateJWT(payload: JWTPayload): string
  
  // Verifica JWT token
  verifyToken(token: string): JWTPayload
  
  // Ottieni OAuth token (solo se MCP e OAuth abilitati)
  private async getOAuthToken(username, password): Promise<{access_token, expires_in}>
  
  // Logout (OAuth token è nel JWT, quindi logout è gestito da scadenza JWT)
  async logout(userId: string): Promise<void>
}
```

**Flow di Login:**

1. Verifica credenziali (username/email + password)
2. **SE** MCP è abilitato **E** OAuth è configurato:
   - Chiama OAuth server (`POST /oauth/token?username=...&password=...`) con query params
   - Ottiene `access_token` e `expires_in` dal server OAuth
   - Calcola `oauthTokenExpiry` (Unix timestamp): `now + expires_in`
3. Genera JWT contenente:
   - `userId`, `username`, `email`
   - `oauthToken` (solo se MCP e OAuth abilitati)
   - `oauthTokenExpiry` (Unix timestamp, solo se OAuth abilitato)
4. Ritorna JWT al frontend
   - **Nota:** Token OAuth NON viene salvato nel DB, solo nel JWT

### 2. Auth Middleware (`backend/src/middleware/authMiddleware.ts`)

```typescript
export const authenticate = async (req, res, next) => {
  // 1. Estrae token da header Authorization
  // 2. Verifica validità con authService.verifyToken()
  // 3. SE OAuth è configurato E oauthToken presente:
  //    - Verifica scadenza oauthTokenExpiry
  //    - Se scaduto: ritorna 401 OAUTH_TOKEN_EXPIRED
  // 4. Se valido: aggiunge req.user con userId, username, email, oauthToken, oauthTokenExpiry
  // 5. Se non valido: ritorna 401 Unauthorized
}
```

**Applicato a tutti gli endpoint chat:**
- `POST /api/chats`
- `GET /api/chats`
- `GET /api/chats/:id`
- `PUT /api/chats/:id`
- `DELETE /api/chats/:id`
- `POST /api/chats/:id/messages`

### 3. Auth Controller (`backend/src/controllers/authController.ts`)

**Endpoints:**

| Endpoint | Metodo | Descrizione | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/register` | POST | Registra nuovo utente | No |
| `/api/auth/login` | POST | Login utente | No |
| `/api/auth/logout` | POST | Logout (OAuth token è nel JWT) | Sì |
| `/api/auth/me` | GET | Info utente corrente | Sì |

### 4. MCP Client OAuth Integration

```typescript
// MCPClient ora accetta oauthToken opzionale
class MCPClient {
  constructor(config: MCPConfig, oauthToken?: string)
  
  async callTool(toolName, args) {
    // Aggiunge header Authorization se oauthToken presente
    headers['Authorization'] = `Bearer ${this.oauthToken}`
  }
}
```

**Note:** 
- Se MCP non è configurato, `oauthToken` sarà `undefined` e l'header non viene aggiunto
- Se OAuth non è configurato, `oauthToken` sarà `undefined` anche se MCP è abilitato
- Il sistema funziona perfettamente anche senza MCP o OAuth
- Token OAuth viene passato solo se `isOAuthEnabled()` ritorna `true`

### 5. OAuth Mock Configuration

**File: `backend/config/oauth-config.yml`** (opzionale)

```yaml
oauth:
  mock_server_url: 'http://localhost:9000'
  token_endpoint: '/oauth/token'
  timeout: 5000
```

**MockServer Docker:**

```yaml
# docker-compose.yml (commentato di default)
mockserver:
  image: mockserver/mockserver:latest
  ports:
    - "9000:1080"
  environment:
    MOCKSERVER_INITIALIZATION_JSON_PATH: /config/mockserver-init.json
  volumes:
    - ./mockserver-init.json:/config/mockserver-init.json
```

**MockServer Expectation (`mockserver-init.json`):**

```json
[
  {
    "httpRequest": {
      "method": "POST",
      "path": "/oauth/token",
      "queryStringParameters": {
        "username": [".*"],
        "password": [".*"]
      }
    },
    "httpResponse": {
      "statusCode": 200,
      "body": {
        "access_token": "mock_oauth_token_12345",
        "token_type": "Bearer",
        "expires_in": 3600
      }
    }
  }
]
```

**Nota:** Il server OAuth deve accettare `username` e `password` come **query parameters** (non nel body).

## 🎨 Frontend

### 1. Auth Service (`frontend/src/services/authService.ts`)

**Gestisce localStorage e JWT:**

```typescript
class AuthService {
  setToken(token: string): void
  getToken(): string | null
  removeToken(): void
  
  isAuthenticated(): boolean
  isTokenExpired(): boolean  // Controlla sia JWT che OAuth token
  isOAuthTokenExpired(): boolean  // Controlla solo OAuth token expiry
  
  getUser(): { userId, username, email } | null
  decodeToken(): JWTPayload | null
}

interface JWTPayload {
  userId: string
  username: string
  email: string
  oauthToken?: string
  oauthTokenExpiry?: number  // Unix timestamp in seconds
  exp: number
}
```

**Metodi principali:**
- `isOAuthTokenExpired()`: Verifica se il token OAuth è scaduto (controlla `oauthTokenExpiry` nel JWT payload)
- `isTokenExpired()`: Verifica se JWT o OAuth token è scaduto (ritorna `true` se uno dei due è scaduto)
- `isAuthenticated()`: Verifica se l'utente è autenticato (ha token valido e non scaduto)

### 2. Auth Context (`frontend/src/contexts/AuthContext.tsx`)

**Stato globale autenticazione:**

```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  login(usernameOrEmail, password): Promise<{success, error?}>
  register(username, email, password): Promise<{success, error?}>
  logout(): void
}

// Hook per usare il context
const { user, isAuthenticated, login, logout } = useAuth()
```

**Controllo periodico token scadenza:**
- Ogni 30 secondi, `AuthContext` verifica automaticamente se il token (JWT o OAuth) è scaduto
- Se scaduto, forza logout automatico e redirect a `/login` con parametro di errore appropriato
- Funziona anche quando l'utente non fa richieste API, garantendo logout automatico

### 3. API Service (`frontend/src/services/api.ts`)

**Gestione automatica token:**

```typescript
private async request(endpoint, options) {
  // 1. Verifica scadenza token PRIMA della richiesta (JWT o OAuth)
  if (authService.hasToken() && authService.isTokenExpired()) {
    // Determina se è scadenza OAuth o JWT
    const payload = authService.decodeToken()
    const isOAuthExpired = payload?.oauthTokenExpiry && 
      Math.floor(Date.now() / 1000) >= payload.oauthTokenExpiry
    
    authService.removeToken()
    const errorParam = isOAuthExpired ? '?error=oauth_expired' : ''
    window.location.href = `/login${errorParam}`
    return { success: false, error: isOAuthExpired ? 'OAUTH_TOKEN_EXPIRED' : 'TOKEN_EXPIRED' }
  }
  
  // 2. Aggiunge Authorization header
  const token = authService.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // 3. Gestisce 401 Unauthorized (incluso OAUTH_TOKEN_EXPIRED dal backend)
  if (response.status === 401) {
    if (data.error === 'OAUTH_TOKEN_EXPIRED') {
      authService.removeToken()
      window.location.href = '/login?error=oauth_expired'
      return { success: false, error: 'OAUTH_TOKEN_EXPIRED' }
    }
    authService.removeToken()
    window.location.href = '/login'
  }
}
```

**Controllo preventivo:**
- Prima di ogni richiesta API, verifica se JWT o OAuth token sono scaduti
- Se OAuth token scaduto: redirect a `/login?error=oauth_expired`
- Se JWT scaduto: redirect a `/login`
- Evita di inviare richieste non necessarie al backend quando il token è già scaduto

### 4. UI Components

#### LoginPage (`frontend/src/components/auth/LoginPage.tsx`)

- Form con "Username or Email" e Password
- Validazione client-side
- Redirect automatico dopo login
- Link a RegisterPage

#### RegisterPage (`frontend/src/components/auth/RegisterPage.tsx`)

- Form con Username, Email, Password, Confirm Password
- Validazione:
  - Username >= 3 caratteri
  - Email formato valido
  - Password >= 6 caratteri
  - Password match
- Redirect automatico dopo registrazione

#### ProtectedRoute (`frontend/src/components/auth/ProtectedRoute.tsx`)

```typescript
<ProtectedRoute>
  <MainApp />
</ProtectedRoute>

// Se non autenticato → redirect a /login
// Se autenticato → mostra children
```

### 5. Routing (`frontend/src/App.tsx`)

```typescript
<Router>
  <AuthProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </AuthProvider>
</Router>
```

## 🔒 Sicurezza

### Password Hashing

```typescript
// Backend - bcrypt con 10 salt rounds
const hashedPassword = await bcrypt.hash(password, 10)
const isValid = await bcrypt.compare(password, hashedPassword)
```

### JWT Configuration

```env
JWT_SECRET="your_jwt_secret_change_this_in_production"
JWT_EXPIRES_IN="1h"
```

**JWT Payload:**

```json
{
  "userId": "cuid123",
  "username": "john_doe",
  "email": "john@example.com",
  "oauthToken": "mock_oauth_token_12345",  // opzionale, solo se MCP e OAuth abilitati
  "oauthTokenExpiry": 1704067200,          // Unix timestamp in secondi, solo se OAuth abilitato
  "exp": 1699999999
}
```

### Token Scadenza

- **JWT Token Scadenza**:
  - **Frontend check preventivo**: Prima di ogni richiesta API, `authService.isTokenExpired()` verifica `exp`
  - **Frontend check periodico**: Ogni 30 secondi, `AuthContext` verifica la scadenza anche senza richieste attive
  - **Backend check**: Middleware `authenticate` verifica `exp`
  - **Logout automatico**: Su token scaduto o invalido

- **OAuth Token Scadenza** (solo se OAuth configurato):
  - **Frontend check preventivo**: Prima di ogni richiesta API, `authService.isOAuthTokenExpired()` verifica `oauthTokenExpiry` se presente
  - **Frontend check periodico**: Ogni 30 secondi, `AuthContext` verifica la scadenza OAuth token anche senza richieste attive
  - **Backend check**: Middleware `authenticate` verifica `oauthTokenExpiry` se presente
  - **Se scaduto**: 
    - Frontend: Rileva preventivamente e forza logout automatico con redirect a `/login?error=oauth_expired`
    - Backend: Ritorna `401 OAUTH_TOKEN_EXPIRED` se la richiesta arriva comunque
  - **Logout automatico**: Su OAuth token scaduto con messaggio di errore specifico

### Rate Limiting

```typescript
// backend/src/index.ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minuti
  max: 1000                   // 1000 richieste per IP
})
```

## 📝 Flow Completo

### 1. Registrazione

```
User → RegisterPage → apiService.register()
  ↓
Backend → AuthController.register()
  ↓
AuthService → hash password → create user in DB
  ↓
Genera JWT (no OAuth) → ritorna token + user
  ↓
Frontend → salva token in localStorage → redirect a "/"
```

### 2. Login (senza MCP)

```
User → LoginPage → apiService.login()
  ↓
Backend → AuthController.login()
  ↓
AuthService → verifica credenziali
  ↓
MCP non abilitato → oauthToken = null
  ↓
Genera JWT → ritorna token + user
  ↓
Frontend → salva token → redirect a "/"
```

### 3. Login (con MCP e OAuth)

```
User → LoginPage → apiService.login()
  ↓
Backend → AuthController.login()
  ↓
AuthService → verifica credenziali
  ↓
MCP abilitato E OAuth configurato → chiama OAuth server
  POST /oauth/token?username=...&password=...
  ↓
OAuth Server → ritorna {access_token, expires_in}
  ↓
Calcola oauthTokenExpiry = now + expires_in
  ↓
Genera JWT con oauthToken e oauthTokenExpiry (NON salva in DB)
  ↓
Frontend → salva token → redirect a "/"
```

### 4. Chiamata API Protetta (con MCP e OAuth)

```
Frontend → apiService.createChat()
  ↓
Aggiunge header: Authorization: Bearer <JWT>
  ↓
Backend → authenticate middleware
  ↓
Verifica JWT → estrae payload
  ↓
SE OAuth configurato E oauthToken presente:
  - Verifica oauthTokenExpiry
  - SE scaduto → 401 OAUTH_TOKEN_EXPIRED → logout automatico
  - SE valido → continua
  ↓
Estrae user.oauthToken dal payload
  ↓
ChatController → verifica isOAuthEnabled()
  ↓
SE OAuth abilitato:
  → crea MCPClient(config, oauthToken)
  ↓
MCPClient.callTool() → aggiunge header: Authorization: Bearer <oauthToken>
  ↓
MCP Server riceve richiesta autenticata
```

### 5. JWT Token Scaduto

```
Frontend → apiService.request()
  ↓
authService.isTokenExpired() → true
  ↓
Rimuove token → redirect a /login
  ↓
User effettua nuovo login
```

### 6. OAuth Token Scaduto (Controllo Preventivo Frontend)

```
Frontend → apiService.request()
  ↓
authService.isTokenExpired() → controlla anche oauthTokenExpiry
  ↓
OAuth token scaduto rilevato
  ↓
Rimuove token → redirect a /login?error=oauth_expired
  ↓
User effettua nuovo login (ottiene nuovo OAuth token)
```

**Nota**: Il controllo preventivo evita che la richiesta venga inviata al backend quando il token OAuth è già scaduto.

### 7. OAuth Token Scaduto (Controllo Periodico Frontend)

```
AuthContext → periodic check (ogni 30 secondi)
  ↓
authService.hasToken() → true
  ↓
authService.isTokenExpired() → controlla anche oauthTokenExpiry
  ↓
OAuth token scaduto rilevato
  ↓
Rimuove token → setUser(null) → redirect a /login?error=oauth_expired
  ↓
User effettua nuovo login (ottiene nuovo OAuth token)
```

**Nota**: Il controllo periodico rileva la scadenza anche quando l'utente non fa richieste API, garantendo che l'utente venga disconnesso automaticamente.

### 8. OAuth Token Scaduto (Backend Fallback)

```
Frontend → apiService.request() (se controllo preventivo fallisce)
  ↓
Backend → authenticate middleware
  ↓
Verifica oauthTokenExpiry → scaduto
  ↓
Ritorna 401 OAUTH_TOKEN_EXPIRED
  ↓
Frontend → gestisce errore OAUTH_TOKEN_EXPIRED
  ↓
Rimuove token → redirect a /login?error=oauth_expired
  ↓
User effettua nuovo login (ottiene nuovo OAuth token)
```

**Nota**: Il backend funge da fallback nel caso raro in cui il controllo preventivo frontend non rilevi la scadenza.

## 🚀 Setup e Configurazione

### 1. Installazione Dipendenze

```bash
# Backend
cd backend
npm install bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken

# Frontend
cd frontend
npm install react-router-dom jwt-decode
npm install -D @types/react-router-dom
```

### 2. Database Migration

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add-users-and-auth
```

### 3. Environment Variables

```env
# backend/.env
JWT_SECRET="change_this_in_production"
JWT_EXPIRES_IN="1h"

# OAuth Mock Server (opzionale - solo se usi MCP)
OAUTH_SERVER_URL="http://localhost:9000"
```

### 4. MockServer (opzionale)

**Se usi MCP con OAuth:**

1. Decommentare il servizio `mockserver` in `docker-compose.yml`
2. Creare `backend/config/oauth-config.yml` basato su `.example`
3. Avviare MockServer:

```bash
docker-compose up mockserver
```

## 🧪 Testing

### Test Manuali

1. **Registrazione:**
   - Vai a `http://localhost:5173/register`
   - Crea account con username, email, password
   - Verifica redirect automatico a chat

2. **Login:**
   - Vai a `http://localhost:5173/login`
   - Login con username o email
   - Verifica redirect a chat

3. **Protected Routes:**
   - Fai logout
   - Prova ad accedere a `http://localhost:5173/`
   - Verifica redirect automatico a `/login`

4. **Token Expiry:**
   - Modifica `JWT_EXPIRES_IN` a `10s`
   - Fai login e aspetta 10 secondi
   - Prova a creare una chat
   - Verifica logout automatico

### Test con MCP + OAuth

1. Avvia MockServer: `docker-compose up mockserver`
2. Crea `backend/config/oauth-config.yml`
3. Fai login
4. Verifica nei log backend: "OAuth token obtained for user..., expires at: ..."
5. Usa tool MCP e verifica header OAuth nei log
6. **Test scadenza OAuth**: Modifica `expires_in` a 10 secondi, fai login, aspetta 11 secondi, prova chiamata API → verifica logout automatico

## 📊 Monitoraggio

### Log Backend

```bash
# Login con OAuth
✅ OAuth token obtained for user john_doe, expires at: 2024-01-01T12:00:00.000Z

# MCP tool call con OAuth
🔐 Adding OAuth token to MCP request
🔧 Calling MCP tool: createSegment

# OAuth token scaduto
⚠️ OAuth token expired for user john_doe

# JWT token scaduto
❌ Invalid or expired token
```

### Log Frontend

```bash
# JWT token scaduto
Token expired, logging out

# OAuth token scaduto
OAuth token expired, logging out

# 401 Unauthorized
Unauthorized, logging out
```

## 🔧 Troubleshooting

### "Invalid credentials" su login

- Verifica che l'utente esista nel DB
- Verifica che la password sia corretta
- Check bcrypt hash nel DB

### "Token expired" immediatamente

- Verifica `JWT_SECRET` in `.env`
- Verifica `JWT_EXPIRES_IN` (default: 1h)
- Controlla orologio di sistema

### OAuth non funziona

- Verifica MockServer sia running: `docker ps`
- Verifica `oauth-config.yml` esista (se non esiste, OAuth è disabilitato)
- Verifica che il server OAuth accetti query params: `POST /oauth/token?username=...&password=...`
- Check logs MockServer: `docker logs ai-agent-chat-mockserver`
- Verifica URL in config: `http://localhost:9000`
- Verifica che `isOAuthEnabled()` ritorni `true` nei log backend
- **Se OAuth non configurato**: Non viene fatta alcuna chiamata OAuth, sistema funziona normalmente

### 401 su tutte le richieste

- Verifica token in localStorage: DevTools → Application → Local Storage
- Verifica JWT_SECRET sia lo stesso in backend e quando è stato generato il token
- Try logout e re-login

## 🎯 Best Practices

1. **JWT_SECRET**: Mai committare in git, usare variabili d'ambiente
2. **Password**: Minimo 6 caratteri (configurabile in validazione)
3. **Token Expiry**: 1h per produzione, più corto per development/test
4. **HTTPS**: Usare sempre HTTPS in produzione per proteggere i token
5. **OAuth Token Management**: Token OAuth è nel JWT, non nel DB. Scadenza gestita automaticamente.
6. **OAuth Configuration**: Se `oauth-config.yml` non esiste, nessuna chiamata OAuth viene fatta. Sistema funziona normalmente.
7. **Query Params**: Server OAuth deve accettare `username` e `password` come query parameters (non nel body).
8. **Refresh Token**: Per il futuro, implementare refresh token mechanism

## 📚 Riferimenti

- [JWT.io](https://jwt.io/) - JSON Web Tokens
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Password hashing
- [React Router](https://reactrouter.com/) - Client-side routing
- [MockServer](https://www.mock-server.com/) - HTTP mock server

