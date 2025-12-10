# Documentação de Autenticação com 2FA - Frontend

## Visão Geral

A autenticação agora funciona em **três etapas**:
1. **Login com credenciais** → Valida senha e envia código 2FA por email
2. **Verificação 2FA** → Valida código de 6 dígitos
3. **Aceite de termos** (se necessário) → Retorna token JWT

---

## 🔐 Fluxo de Autenticação

### 1️⃣ Login Inicial (Valida Senha + Envia Código)

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "userEmail": "usuario@example.com",
  "password": "SenhaSegura123!"
}
```

**Resposta de Sucesso (sem termos pendentes):**
```json
{
  "requires2FA": true,
  "userEmail": "usuario@example.com",
  "pendingTerms": []
}
```

**Resposta de Sucesso (com termos pendentes):**
```json
{
  "requires2FA": true,
  "userEmail": "usuario@example.com",
  "pendingTerms": [
    {
      "termId": 1,
      "termText": "Texto completo do termo de uso...",
      "termTypeId": 1,
      "roleId": 1,
      "beginDate": "2025-01-01T00:00:00.000Z",
      "endDate": null
    }
  ]
}
```

**Erros Comuns:**
- `401`: Credenciais inválidas (`#Email e/ou senha não encontrado(s) ou não se correspondem`)
- `403`: Usuário inativo (`#Usuário inativado pelo administrador do sistema.`)

**⚠️ Importante:** 
- Após este passo, o usuário **já recebeu o código 2FA por email** (válido por 30 minutos)
- Se houver termos pendentes, o front deve exibi-los ao usuário **antes** de chamar `/auth/verify-2fa`
- Os `termId`s dos termos aceitos devem ser enviados no campo `termsIds` ao verificar o código 2FA

---

### 2️⃣ Verificar Código 2FA

**Endpoint:** `POST /auth/verify-2fa`

**Body:**
```json
{
  "userEmail": "usuario@example.com",
  "code": "A3X9K2",
  "termsIds": [1, 2]  // IDs dos termos aceitos (vazio se não houver)
}
```

**Resposta de Sucesso:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros Comuns:**
- `401`: Código inválido/expirado (`#Código de verificação inválido ou expirado.`)
- `403`: Termos não assinados (`#Todos os termos de uso devem ser aceitos.`)

**⚠️ Validações do Código:**
- Formato: 6 caracteres alfanuméricos (A-Z, 0-9)
- Validade: 30 minutos
- Máximo de tentativas: 5

---

### 3️⃣ Reenviar Código 2FA

**Endpoint:** `POST /auth/resend-2fa`

**Body:**
```json
{
  "userEmail": "usuario@example.com"
}
```

**Resposta de Sucesso:**
```json
{
  "message": "Código reenviado com sucesso."
}
```

**Erros Comuns:**
- `401`: Sem código pendente (`#Nenhum código de verificação pendente para este email.`)

---

## 📋 Fluxo Completo Visual

```mermaid
graph TD
    A[Usuário envia email/senha] --> B[POST /auth/login]
    B --> C{Senha correta?}
    C -->|Não| D[Erro 401]
    C -->|Sim| E[Gera código 2FA]
    E --> F[Envia email com código]
    F --> G[Retorna requires2FA + pendingTerms]
    G --> H{Há termos pendentes?}
    H -->|Sim| I[Exibir termos ao usuário]
    H -->|Não| J[Pedir código 2FA]
    I --> K[Usuário aceita termos]
    K --> J
    J --> L{Usuário digitou código?}
    L -->|Não recebeu| M[POST /auth/resend-2fa]
    M --> F
    L -->|Sim| N[POST /auth/verify-2fa com termsIds]
    N --> O{Código válido?}
    O -->|Não| P[Erro 401 - Máx 5 tentativas]
    O -->|Sim| Q[Gera JWT]
    R --> S[Retorna accessToken]
```

---

## 🔒 Usando o Token JWT

Adicione o token no header de todas as requisições autenticadas:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Validade do Token:** 12 horas

---

## 📝 Exemplo Prático (JavaScript)

```javascript
// 1. Login e envio de código 2FA
const loginAndSend2FA = async (email, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      userEmail: email, 
      password: password 
    })
  })
  
  if (!response.ok) {
    throw new Error('Falha no login')
  }
  
  const data = await response.json()
  // Retorna: { requires2FA: true, userEmail: "...", pendingTerms: [...] }
  return data
}

// 2. Verificar código 2FA
const verify2FA = async (email, code, termsIds = []) => {
  const response = await fetch('/auth/verify-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      userEmail: email, 
      code: code,
      termsIds: termsIds 
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message)
  }
  
  const { accessToken } = await response.json()
  localStorage.setItem('token', accessToken)
  return accessToken
}

// 3. Reenviar código 2FA
const resend2FA = async (email) => {
  const response = await fetch('/auth/resend-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail: email })
  })
  
  if (!response.ok) {
    throw new Error('Falha ao reenviar código')
  }
  
  return await response.json() // { message: "Código reenviado com sucesso." }
}

// 4. Fluxo completo de autenticação
const authenticate = async (email, password) => {
  try {
    // Passo 1: Login (valida senha e envia código, retorna termos pendentes)
    const loginResult = await loginAndSend2FA(email, password)
    
    if (loginResult.requires2FA) {
      const { userEmail, pendingTerms } = loginResult
      
      // Passo 2: Se há termos, exibir e coletar aceites
      let termsIds = []
      if (pendingTerms.length > 0) {
        termsIds = await showTermsModal(pendingTerms) // Implementação do UI
      }
      
      // Passo 3: Exibir modal para usuário digitar código 2FA
      const code = await showCodeInputModal() // Implementação do UI
      
      // Passo 4: Verificar código e gerar JWT
      const token = await verify2FA(userEmail, code, termsIds)
      return token
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    throw error
  }
}
```

---

## ⚠️ Tratamento de Erros

```javascript
try {
  const token = await authenticate(email, password)
} catch (error) {
  const errorMsg = error.message
  
  if (errorMsg.includes('#Email e/ou senha')) {
    alert('Email ou senha incorretos')
  } else if (errorMsg.includes('#Código de verificação inválido')) {
    alert('Código 2FA inválido ou expirado. Tente novamente.')
  } else if (errorMsg.includes('#Todos os termos')) {
    alert('Você deve aceitar todos os termos de uso')
  } else if (errorMsg.includes('#Usuário inativado')) {
    alert('Sua conta foi desativada. Contate o administrador.')
  } else if (errorMsg.includes('#Nenhum código de verificação pendente')) {
    alert('Faça login novamente para receber um novo código')
  } else {
    alert('Erro ao fazer login. Tente novamente.')
  }
}
```

---

## 🎯 Componente UI Recomendado (React/Vue)

### Tela 1: Login
```
┌─────────────────────────────┐
│  Email: [_____________]      │
│  Senha: [_____________]      │
│  [      Entrar     ]         │
└─────────────────────────────┘
```

### Tela 2: Código 2FA (após login bem-sucedido)
```
┌─────────────────────────────┐
│ ✉️ Código enviado para:      │
│   usuario@example.com        │
│                              │
│  Digite o código:            │
│  [_] [_] [_] [_] [_] [_]     │
│                              │
│  Válido por 30 minutos       │
│  Tentativas restantes: 5     │
│                              │
│  [    Verificar    ]         │
│  [Não recebeu? Reenviar]     │
└─────────────────────────────┘
```

### Tela 3: Termos (se houver)
```
┌─────────────────────────────┐
│ 📋 Termos de Uso             │
│                              │
│ [ ] Termo de Uso X           │
│ [ ] Política de Privacidade  │
│                              │
│  [    Aceitar e Continuar  ] │
└─────────────────────────────┘
```

---

## 📌 Resumo Rápido dos Endpoints

| Ordem | Endpoint | Payload | Resposta |
|-------|----------|---------|----------|
| 1️⃣ | `POST /auth/login` | `{ userEmail, password }` | `{ requires2FA: true, userEmail, pendingTerms: Term[] }` |
| 2️⃣ | `POST /auth/verify-2fa` | `{ userEmail, code, termsIds? }` | `{ accessToken }` |
| 🔄 | `POST /auth/resend-2fa` | `{ userEmail }` | `{ message }` |

---

## 🔐 Segurança

✅ **Senha validada ANTES** de enviar código 2FA  
✅ **Código expira** em 30 minutos automaticamente  
✅ **Máximo 5 tentativas** de validação  
✅ **Limpeza automática** de códigos expirados a cada 5 minutos  
✅ **Rate limiting** ativo em todos os endpoints  
✅ **Códigos únicos** alfanuméricos (A-Z0-9, 6 dígitos)  

---

**Última atualização:** 25/11/2025
