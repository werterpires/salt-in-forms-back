# 📋 Documentação do Sistema de Auto-Cadastro de Candidatos

## 📌 Visão Geral

Sistema de auto-cadastro onde candidatos se registram com um **código de pedido (orderCode)** fornecido pela loja FAAMA, confirmam seu email e posteriormente recebem acesso ao formulário do processo seletivo.

---

## 🔄 Fluxo Principal

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CANDIDATO ACESSA PÁGINA DE CADASTRO                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. PREENCHE FORMULÁRIO MÍNIMO                                   │
│    - Nome completo                                               │
│    - Email                                                       │
│    - Tipo de documento (CPF/Passaporte)                         │
│    - Número do documento                                         │
│    - Telefone                                                    │
│    - Código do pedido (orderCode)                               │
│    - ID do processo seletivo                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND VALIDA DADOS                                         │
│    ✓ OrderCode é válido na API externa (loja FAAMA)            │
│    ✓ OrderCode não foi usado antes                             │
│    ✓ Candidato não existe no processo                          │
│    ✓ Processo seletivo existe e está configurado               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SISTEMA ENVIA EMAIL DE CONFIRMAÇÃO                           │
│    - Link válido por 60 minutos (configurável)                  │
│    - Token único no link                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. CANDIDATO CLICA NO LINK DO EMAIL                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND CHAMA ENDPOINT DE CONFIRMAÇÃO                       │
│    GET /candidates/confirm-registration/:token                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. BACKEND VALIDA E CONFIRMA CADASTRO                           │
│    ✓ Token é válido                                             │
│    ✓ Token não expirou                                          │
│    ✓ Token não foi invalidado                                   │
│    ✓ OrderCode ainda está disponível                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. CANDIDATO RECEBE EMAIL DE SUCESSO                            │
│    "Cadastro confirmado! Aguarde o link do formulário"          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. CRON PROCESSA CANDIDATOS (a cada 30 min)                    │
│    - Gera código de acesso ao formulário                        │
│    - Envia email com link do formulário                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. CANDIDATO ACESSA E PREENCHE FORMULÁRIO                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Endpoints da API

### 1. **POST /candidates/self-register** 🔓 Público

**Descrição**: Cadastro inicial do candidato

**Request Body**:
```typescript
{
  "candidateName": "João Silva",
  "candidateEmail": "joao@email.com",
  "candidateDocumentType": "cpf", // ou "passport"
  "candidateUniqueDocument": "12345678901",
  "candidatePhone": "+5511999999999",
  "orderCode": "ABC123XYZ",
  "processId": 1
}
```

**Response Sucesso (200)**:
```json
{
  "message": "Cadastro iniciado com sucesso! Verifique seu email para confirmar o cadastro."
}
```

**Possíveis Erros**:
- `400`: OrderCode já utilizado
- `400`: Candidato já cadastrado no processo
- `400`: Processo não encontrado
- `400`: OrderCode inválido na API externa

---

### 2. **GET /candidates/confirm-registration/:token** 🔓 Público

**Descrição**: Confirma o cadastro do candidato via token do email

**URL Exemplo**:
```
GET /candidates/confirm-registration/550e8400-e29b-41d4-a716-446655440000
```

**Response Sucesso (200)**:
```json
{
  "message": "Cadastro confirmado com sucesso! Em breve você receberá o link para acessar o formulário."
}
```

**Possíveis Erros**:
- `400`: Token não encontrado
- `400`: Token expirado (>60 minutos)
- `400`: Token já foi invalidado
- `400`: OrderCode foi usado por outro candidato (race condition)
- `400`: Documento já cadastrado no processo (race condition)

---

### 3. **POST /candidates/resend-confirmation** 🔓 Público

**Descrição**: Reenvia o email de confirmação

**Request Body**:
```typescript
{
  "orderCode": "ABC123XYZ"
}
```

**Response Sucesso (200)**:
```json
{
  "message": "Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada."
}
```

**Possíveis Erros**:
- `400`: Nenhum cadastro pendente encontrado
- `400`: Cadastro já foi confirmado
- `400`: Cadastro foi invalidado
- `400`: Token expirou

---

### 4. **GET /candidates/registration-status/:orderCode** 🔒 Admin/SEC

**Descrição**: Verifica status de um cadastro (debug/admin)

**URL Exemplo**:
```
GET /candidates/registration-status/ABC123XYZ
```

**Response Sucesso (200)**:
```json
{
  "orderCode": "ABC123XYZ",
  "isConfirmed": false,
  "isPending": true,
  "pendingDetails": {
    "pendingCandidateId": 123,
    "candidateName": "João Silva",
    "candidateEmail": "joao@email.com",
    "processId": 1,
    "tokenExpiresAt": "2025-11-12T18:00:00.000Z",
    "attemptCount": 1,
    "createdAt": "2025-11-12T17:00:00.000Z",
    "confirmedAt": null,
    "invalidatedAt": null,
    "isExpired": false,
    "isValid": true
  }
}
```

---

## 🎨 Implementação no Frontend

### 📄 Página 1: Formulário de Auto-Cadastro

**Rota sugerida**: `/register` ou `/self-register`

**Campos do formulário**:
```typescript
interface SelfRegisterForm {
  candidateName: string        // Obrigatório, min: 3, max: 200
  candidateEmail: string        // Obrigatório, validação de email
  candidateDocumentType: 'cpf' | 'passport'  // Radio button ou select
  candidateUniqueDocument: string  // Obrigatório, 11 dígitos (CPF) ou 14 (passaporte)
  candidatePhone: string        // Obrigatório, formato: +5511999999999
  orderCode: string             // Obrigatório, fornecido pela loja
  processId: number             // Hidden ou select (se houver múltiplos processos)
}
```

**Validações Frontend**:
```typescript
const validations = {
  candidateName: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  candidateEmail: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  candidateUniqueDocument: {
    required: true,
    // Se CPF: 11 dígitos numéricos
    // Se passaporte: alfanumérico
  },
  candidatePhone: {
    required: true,
    pattern: /^\+?[\d\s-()]+$/ // Aceitar formato internacional
  },
  orderCode: {
    required: true,
    minLength: 1
  }
}
```

**Fluxo de Submissão**:
```typescript
async function handleSubmit(formData: SelfRegisterForm) {
  try {
    // 1. Validar dados localmente
    if (!validateForm(formData)) {
      showErrors()
      return
    }

    // 2. Mostrar loading
    setLoading(true)

    // 3. Enviar para API
    const response = await fetch('/api/candidates/self-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    // 4. Tratar resposta
    if (response.ok) {
      const data = await response.json()
      
      // Mostrar mensagem de sucesso
      showSuccessMessage(data.message)
      
      // Redirecionar para página de confirmação
      router.push('/check-email')
      
    } else {
      const error = await response.json()
      
      // Mostrar erro específico
      showErrorMessage(error.message)
    }
    
  } catch (error) {
    showErrorMessage('Erro ao processar cadastro. Tente novamente.')
  } finally {
    setLoading(false)
  }
}
```

**Mensagens de Erro Comuns**:
```typescript
const errorMessages = {
  'Este código de pedido já foi utilizado': 
    'Este código de pedido já foi usado. Se você acredita que isso é um erro, entre em contato com o suporte.',
  
  'Você já está cadastrado neste processo seletivo': 
    'Já existe um cadastro com este documento neste processo. Verifique seu email para o link de acesso.',
  
  'Código de pedido inválido': 
    'O código de pedido não foi encontrado ou é inválido. Verifique e tente novamente.',
  
  'Processo seletivo não encontrado': 
    'Processo seletivo não disponível. Entre em contato com o suporte.'
}
```

---

### 📄 Página 2: Verificar Email

**Rota sugerida**: `/check-email`

**Conteúdo**:
```html
<div class="check-email-page">
  <h1>📧 Verifique seu email</h1>
  
  <p>
    Enviamos um link de confirmação para <strong>{{ email }}</strong>
  </p>
  
  <div class="instructions">
    <h2>Próximos passos:</h2>
    <ol>
      <li>Abra seu email</li>
      <li>Clique no link de confirmação</li>
      <li>O link é válido por <strong>60 minutos</strong></li>
    </ol>
  </div>
  
  <div class="tips">
    <p>💡 Não recebeu o email?</p>
    <ul>
      <li>Verifique sua pasta de spam/lixo eletrônico</li>
      <li>Aguarde alguns minutos</li>
      <li>Se necessário, solicite um novo envio abaixo</li>
    </ul>
  </div>
  
  <button @click="resendConfirmation">
    🔄 Reenviar email de confirmação
  </button>
</div>
```

**Funcionalidade de Reenvio**:
```typescript
async function resendConfirmation(orderCode: string) {
  try {
    setLoading(true)
    
    const response = await fetch('/api/candidates/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode })
    })
    
    if (response.ok) {
      showSuccessMessage('Email reenviado com sucesso!')
    } else {
      const error = await response.json()
      showErrorMessage(error.message)
    }
    
  } catch (error) {
    showErrorMessage('Erro ao reenviar email.')
  } finally {
    setLoading(false)
  }
}
```

---

### 📄 Página 3: Confirmação de Cadastro

**Rota sugerida**: `/confirm-registration/:token`

**Lógica**:
```typescript
// No mount/created da página
async function confirmRegistration(token: string) {
  try {
    setLoading(true)
    
    // Chamar endpoint de confirmação
    const response = await fetch(`/api/candidates/confirm-registration/${token}`)
    
    if (response.ok) {
      const data = await response.json()
      
      // Mostrar sucesso
      setConfirmationStatus('success')
      setMessage(data.message)
      
      // Redirecionar para página de sucesso após 3 segundos
      setTimeout(() => {
        router.push('/registration-confirmed')
      }, 3000)
      
    } else {
      const error = await response.json()
      
      // Mostrar erro específico
      setConfirmationStatus('error')
      setMessage(error.message)
      
      // Se token expirado ou invalidado, mostrar botão para novo cadastro
      if (error.message.includes('expirou') || error.message.includes('invalidado')) {
        setShowRetryButton(true)
      }
    }
    
  } catch (error) {
    setConfirmationStatus('error')
    setMessage('Erro ao confirmar cadastro. Tente novamente.')
  } finally {
    setLoading(false)
  }
}
```

**Template**:
```html
<div class="confirmation-page">
  <!-- Loading -->
  <div v-if="loading">
    <spinner />
    <p>Confirmando seu cadastro...</p>
  </div>
  
  <!-- Sucesso -->
  <div v-if="confirmationStatus === 'success'">
    <h1>✅ Cadastro Confirmado!</h1>
    <p>{{ message }}</p>
    <p>Em breve você receberá o link para acessar o formulário do processo seletivo.</p>
    <p class="redirect-info">Redirecionando...</p>
  </div>
  
  <!-- Erro -->
  <div v-if="confirmationStatus === 'error'">
    <h1>❌ Erro na Confirmação</h1>
    <p>{{ message }}</p>
    
    <button v-if="showRetryButton" @click="goToRegister">
      Fazer novo cadastro
    </button>
  </div>
</div>
```

---

### 📄 Página 4: Cadastro Confirmado com Sucesso

**Rota sugerida**: `/registration-confirmed`

**Conteúdo**:
```html
<div class="success-page">
  <h1>🎉 Cadastro Confirmado com Sucesso!</h1>
  
  <div class="success-content">
    <p>Seu cadastro foi confirmado e você está inscrito no processo seletivo.</p>
    
    <h2>📬 Próximos passos:</h2>
    <ol>
      <li>
        <strong>Aguarde o email com o link do formulário</strong>
        <p>Enviaremos em breve um email com o link para acessar e preencher o formulário do processo seletivo.</p>
      </li>
      <li>
        <strong>Verifique sua caixa de entrada</strong>
        <p>O email virá de: vestibularsalt.faama@faama.edu.br</p>
      </li>
      <li>
        <strong>Preencha o formulário no prazo</strong>
        <p>Você terá 24 horas para preencher o formulário após receber o link.</p>
      </li>
    </ol>
    
    <div class="warning-box">
      <p>⚠️ <strong>Importante:</strong></p>
      <ul>
        <li>Verifique sua pasta de spam caso não receba o email</li>
        <li>Não compartilhe seu código de acesso</li>
        <li>Entre em contato com o suporte se tiver dúvidas</li>
      </ul>
    </div>
  </div>
</div>
```

---

## 🔀 Fluxos Alternativos

### ⚠️ Cenário 1: Email Diferente no Recadastro

**Situação**: Candidato se cadastrou com email errado e tenta novamente com email correto

**Fluxo**:
1. Candidato preenche formulário com **mesmo orderCode** mas **email diferente**
2. Backend invalida token anterior automaticamente
3. Backend gera novo token e envia para o **novo email**
4. Email antigo não funciona mais
5. Candidato confirma com o novo email

**Implementação no Frontend**:
```typescript
// Não precisa de tratamento especial
// O backend gerencia automaticamente
// Apenas informar ao usuário:

showMessage(
  'Um novo email de confirmação foi enviado. ' +
  'Se você já recebeu um email anterior, ele não é mais válido.'
)
```

---

### ⚠️ Cenário 2: Mesmo Email no Recadastro

**Situação**: Candidato perdeu o email e tenta se cadastrar novamente com **mesmo email**

**Fluxo**:
1. Candidato preenche formulário com **mesmo orderCode e mesmo email**
2. Backend **reutiliza** o token existente (não cria novo)
3. Backend reenvia email com o **mesmo link**
4. Candidato pode usar qualquer um dos emails recebidos

**Implementação no Frontend**:
```typescript
// Não precisa de tratamento especial
// Funciona como cadastro normal
// Usuário receberá novo email com mesmo link
```

---

### ⚠️ Cenário 3: Token Expirado

**Situação**: Candidato clica no link após 60 minutos

**Fluxo**:
1. Candidato clica no link expirado
2. Frontend chama endpoint de confirmação
3. Backend retorna erro: "Link expirou"
4. Frontend mostra mensagem com opção de refazer cadastro

**Implementação**:
```typescript
if (error.message.includes('expirou')) {
  showErrorWithAction(
    'O link de confirmação expirou.',
    'Fazer novo cadastro',
    () => router.push('/register')
  )
}
```

---

### ⚠️ Cenário 4: OrderCode Já Usado

**Situação**: Candidato tenta usar orderCode que outro candidato já confirmou

**Fluxo**:
1. Candidato tenta se cadastrar
2. Backend verifica que orderCode já foi confirmado por outro candidato
3. Frontend mostra erro específico

**Implementação**:
```typescript
if (error.message.includes('já foi utilizado')) {
  showError(
    'Este código de pedido já foi utilizado por outro candidato.',
    'Se você acredita que isso é um erro, entre em contato com o suporte.'
  )
}
```

---

## 🎨 Componentes Sugeridos

### 1. FormInput Component
```typescript
<FormInput
  v-model="formData.candidateName"
  label="Nome Completo"
  placeholder="Digite seu nome completo"
  :error="errors.candidateName"
  required
/>
```

### 2. DocumentTypeSelector Component
```typescript
<DocumentTypeSelector
  v-model="formData.candidateDocumentType"
  @change="handleDocumentTypeChange"
/>
```

### 3. PhoneInput Component
```typescript
<PhoneInput
  v-model="formData.candidatePhone"
  :mask="phoneMask"
  placeholder="+55 11 99999-9999"
/>
```

### 4. LoadingSpinner Component
```typescript
<LoadingSpinner
  v-if="loading"
  message="Processando cadastro..."
/>
```

### 5. AlertMessage Component
```typescript
<AlertMessage
  :type="alertType"  // success | error | warning | info
  :message="alertMessage"
  :closable="true"
  @close="closeAlert"
/>
```

---

## 📊 Estados da Aplicação

```typescript
// Estado do formulário de cadastro
interface RegisterState {
  formData: SelfRegisterForm
  errors: Record<string, string>
  loading: boolean
  submitted: boolean
}

// Estado da confirmação
interface ConfirmationState {
  status: 'loading' | 'success' | 'error' | null
  message: string
  showRetryButton: boolean
}

// Estado de reenvio
interface ResendState {
  loading: boolean
  canResend: boolean
  cooldownSeconds: number  // Prevenir spam (opcional)
}
```

---

## 🔐 Segurança no Frontend

### Headers Necessários
```typescript
const headers = {
  'Content-Type': 'application/json',
  // Não precisa de autenticação (endpoints públicos)
}
```

### Validação de Token
```typescript
// Token deve ser UUID v4
const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidToken(token: string): boolean {
  return tokenRegex.test(token)
}
```

### Sanitização de Inputs
```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .substring(0, 500)     // Limita tamanho
}
```

---

## 📱 Responsividade

### Breakpoints Sugeridos
```css
/* Mobile First */
.register-form {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .register-form {
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .register-form {
    max-width: 800px;
  }
}
```

---

## ✅ Checklist de Implementação

### Páginas
- [ ] Página de cadastro (`/register`)
- [ ] Página de verificação de email (`/check-email`)
- [ ] Página de confirmação (`/confirm-registration/:token`)
- [ ] Página de sucesso (`/registration-confirmed`)

### Componentes
- [ ] Formulário de auto-cadastro
- [ ] Validação de campos em tempo real
- [ ] Seletor de tipo de documento
- [ ] Input de telefone com máscara
- [ ] Loading spinner
- [ ] Mensagens de alerta/sucesso/erro

### Funcionalidades
- [ ] Submissão de cadastro
- [ ] Reenvio de email
- [ ] Confirmação via token
- [ ] Tratamento de erros específicos
- [ ] Redirecionamentos automáticos
- [ ] Feedback visual claro

### Validações Frontend
- [ ] Nome (min 3, max 200)
- [ ] Email válido
- [ ] Documento (CPF 11 dígitos ou passaporte alfanumérico)
- [ ] Telefone (formato internacional)
- [ ] OrderCode obrigatório

### UX/UI
- [ ] Estados de loading
- [ ] Mensagens de erro específicas
- [ ] Instruções claras em cada etapa
- [ ] Design responsivo
- [ ] Acessibilidade (ARIA labels, foco, etc)

---

## 🐛 Debugging

### Endpoint de Status (Admin)
Para debugging, há um endpoint admin que mostra o status de qualquer orderCode:

```typescript
// Requer autenticação de admin
const response = await fetch(
  `/api/candidates/registration-status/${orderCode}`,
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
)

const status = await response.json()
console.log('Status do cadastro:', status)
```

---

## 📞 Suporte e Contato

**Email de envio dos emails**:
- `vestibularsalt.faama@faama.edu.br`

**Tempo de validade do link**:
- 60 minutos (configurável no backend)

**Frequência de processamento**:
- Emails de acesso ao formulário: a cada 30 minutos

**Limpeza automática**:
- Pendings não confirmados: 7 dias
- Pendings confirmados: 24 horas

---

## 🎯 Próximos Passos (Após Cadastro Confirmado)

1. **Aguardar email com link do formulário** (processado por cron a cada 30 min)
2. **Acessar formulário** com código de acesso único
3. **Assinar termos** (se houver termos ativos)
4. **Preencher formulário** completo do processo seletivo
5. **Acompanhar status** da inscrição

---

**Documentação criada em**: Novembro 2025  
**Versão**: 1.0  
**Mantida por**: Equipe SALT Informs