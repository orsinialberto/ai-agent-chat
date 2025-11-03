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
  oauth_token VARCHAR,         -- NULL se MCP non configurato
  token_expiry TIMESTAMP,      -- NULL se MCP non configurato
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

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
  
  // Ottieni OAuth token (solo se MCP abilitato)
  private async getOAuthToken(user): Promise<{access_token, expires_in}>
  
  // Logout (invalida OAuth token nel DB)
  async logout(userId: string): Promise<void>
}
```

**Flow di Login:**

1. Verifica credenziali (username/email + password)
2. **SE** MCP è abilitato:
   - Chiama MockServer OAuth (`POST /oauth/token`)
   - Salva `oauthToken` e `tokenExpiry` nel database
3. Genera JWT contenente:
   - `userId`, `username`, `email`
   - `oauthToken` (solo se MCP abilitato)
4. Ritorna JWT al frontend

### 2. Auth Middleware (`backend/src/middleware/authMiddleware.ts`)

```typescript
export const authenticate = async (req, res, next) => {
  // 1. Estrae token da header Authorization
  // 2. Verifica validità con authService.verifyToken()
  // 3. Se valido: aggiunge req.user con userId, username, email, oauthToken
  // 4. Se non valido: ritorna 401 Unauthorized
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
| `/api/auth/logout` | POST | Logout (invalida OAuth token) | Sì |
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
- Il sistema funziona perfettamente anche senza MCP

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
      "path": "/oauth/token"
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

## 🎨 Frontend

### 1. Auth Service (`frontend/src/services/authService.ts`)

**Gestisce localStorage e JWT:**

```typescript
class AuthService {
  setToken(token: string): void
  getToken(): string | null
  removeToken(): void
  
  isAuthenticated(): boolean
  isTokenExpired(): boolean
  
  getUser(): { userId, username, email } | null
  decodeToken(): JWTPayload | null
}
```

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

### 3. API Service (`frontend/src/services/api.ts`)

**Gestione automatica token:**

```typescript
private async request(endpoint, options) {
  // 1. Verifica scadenza token PRIMA della richiesta
  if (authService.isTokenExpired()) {
    authService.removeToken()
    window.location.href = '/login'
    return
  }
  
  // 2. Aggiunge Authorization header
  const token = authService.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // 3. Gestisce 401 Unauthorized
  if (response.status === 401) {
    authService.removeToken()
    window.location.href = '/login'
  }
}
```

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
  "oauthToken": "mock_oauth_token_12345",  // opzionale
  "exp": 1699999999
}
```

### Token Scadenza

- **Frontend check**: Prima di ogni richiesta API
- **Backend check**: Middleware `authenticate` verifica `exp`
- **Logout automatico**: Su token scaduto o invalido

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

### 3. Login (con MCP)

```
User → LoginPage → apiService.login()
  ↓
Backend → AuthController.login()
  ↓
AuthService → verifica credenziali
  ↓
MCP abilitato → chiama MockServer OAuth
  ↓
MockServer → ritorna access_token
  ↓
Salva oauthToken in DB → genera JWT con oauthToken
  ↓
Frontend → salva token → redirect a "/"
```

### 4. Chiamata API Protetta (con MCP)

```
Frontend → apiService.createChat()
  ↓
Aggiunge header: Authorization: Bearer <JWT>
  ↓
Backend → authenticate middleware
  ↓
Verifica JWT → estrae user.oauthToken
  ↓
ChatController → crea MCPClient(config, oauthToken)
  ↓
MCPClient.callTool() → aggiunge header: Authorization: Bearer <oauthToken>
  ↓
MCP Server riceve richiesta autenticata
```

### 5. Token Scaduto

```
Frontend → apiService.request()
  ↓
authService.isTokenExpired() → true
  ↓
Rimuove token → redirect a /login
  ↓
User effettua nuovo login
```

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
4. Verifica nei log backend: "OAuth token obtained for user..."
5. Usa tool MCP e verifica header OAuth nei log

## 📊 Monitoraggio

### Log Backend

```bash
# Login con OAuth
✅ OAuth token obtained for user john_doe

# MCP tool call con OAuth
🔐 Adding OAuth token to MCP request
🔧 Calling MCP tool: createSegment

# Token scaduto
❌ Invalid or expired token
```

### Log Frontend

```bash
# Token scaduto
Token expired, logging out

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
- Verifica `oauth-config.yml` esista
- Check logs MockServer: `docker logs ai-agent-chat-mockserver`
- Verifica URL in config: `http://localhost:9000`

### 401 su tutte le richieste

- Verifica token in localStorage: DevTools → Application → Local Storage
- Verifica JWT_SECRET sia lo stesso in backend e quando è stato generato il token
- Try logout e re-login

## 🎯 Best Practices

1. **JWT_SECRET**: Mai committare in git, usare variabili d'ambiente
2. **Password**: Minimo 6 caratteri (configurabile in validazione)
3. **Token Expiry**: 1h per produzione, più corto per development/test
4. **HTTPS**: Usare sempre HTTPS in produzione per proteggere i token
5. **Logout**: Implementare logout anche su backend per invalidare OAuth token
6. **Refresh Token**: Per il futuro, implementare refresh token mechanism

## 📚 Riferimenti

- [JWT.io](https://jwt.io/) - JSON Web Tokens
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Password hashing
- [React Router](https://reactrouter.com/) - Client-side routing
- [MockServer](https://www.mock-server.com/) - HTTP mock server

