# Implementação do Sistema de Auto-Cadastro de Candidatos

## Visão Geral

Sistema completo de auto-cadastro com confirmação por email implementado no módulo de candidatos.

**Data de Implementação**: Janeiro 2025

---

## Funcionalidades Implementadas

### 1. Auto-Cadastro Inicial
- **Endpoint**: `POST /candidates/self-register` (público)
- **Validações**:
  - `orderCode` válido na API externa da loja FAAMA
  - `orderCode` não consumido anteriormente
  - Email não duplicado em candidatos pendentes
- **Processo**:
  1. Valida `orderCode` externamente
  2. Cria registro em `PendingCandidates`
  3. Gera token único de confirmação
  4. Envia email com link de confirmação
  5. Define prazo de expiração configurável

### 2. Confirmação de Email
- **Endpoint**: `GET /candidates/confirm-registration/:token` (público)
- **Validações**:
  - Token válido e não expirado
  - `orderCode` ainda não consumido (race condition protection)
- **Processo**:
  1. Valida token
  2. Move dados para tabela `Candidates`
  3. Marca `orderCode` como consumido com timestamp
  4. Invalida token usado
  5. Envia email de boas-vindas
  6. Redireciona para frontend

### 3. Reenvio de Confirmação
- **Endpoint**: `POST /candidates/resend-confirmation` (público)
- **Validações**:
  - Email existe em candidatos pendentes
  - Candidato ainda não confirmado
- **Processo**:
  1. Gera novo token (invalida anterior)
  2. Atualiza prazo de expiração
  3. Reenvia email de confirmação

### 4. Status de Registro (Admin)
- **Endpoint**: `GET /candidates/registration-status/:orderCode` (admin/secretaria)
- **Retorna**:
  - Status: `pending`, `confirmed`, `expired`, `not_found`
  - Dados do candidato (se existir)
  - Timestamp de consumo do `orderCode`

---

## Arquivos Criados

### 1. DTOs
```
src/candidates/dto/
├── self-register-candidate.dto.ts
└── resend-confirmation.dto.ts
```

### 2. Services
```
src/candidates/
├── pending-candidates.service.ts (novo)
└── external-order-validation.service.ts (novo)
```

### 3. Email Templates
```
src/candidates/email-templates/
├── confirmation-email.template.ts (atualizado)
└── registration-confirmed.template.ts (existente)
```

---

## Arquivos Modificados

### 1. candidates.service.ts
**Novos Métodos**:
- `selfRegisterCandidate()` - Processa registro inicial
- `confirmRegistration()` - Confirma email e completa cadastro
- `resendConfirmation()` - Reenvia email de confirmação
- `getRegistrationStatus()` - Consulta status (admin)

**Métodos Comentados (Legado)**:
- `handleProcessInSubscriptionCron()` - Cron antigo desabilitado
- `processCandidatesInsertion()` - Helper do cron antigo
- `sendImportSummaryEmail()` - Email do cron antigo
- `parseApiResponseToCandidates()` - Parser do cron antigo

### 2. candidates.controller.ts
**Novos Endpoints**:
```typescript
POST   /candidates/self-register           (@IsPublic)
GET    /candidates/confirm-registration/:token  (@IsPublic)
POST   /candidates/resend-confirmation     (@IsPublic)
GET    /candidates/registration-status/:orderCode  (@Roles(ADMIN, SEC))
```

### 3. candidates.repo.ts
**Novos Métodos**:
- `insertCandidateFromPending()` - Insere candidato confirmado
- `findCandidateByOrderCode()` - Busca por código de pedido
- `isOrderCodeInCandidates()` - Verifica se código já foi usado

### 4. candidates.module.ts
**Novos Providers**:
- `PendingCandidatesService`
- `ExternalOrderValidationService`

---

## Banco de Dados

### Tabela: `PendingCandidates`
```sql
CREATE TABLE pending_candidates (
  pending_candidate_id SERIAL PRIMARY KEY,
  order_code VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  confirmation_token VARCHAR(255) NOT NULL UNIQUE,
  token_expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Alteração: `Candidates`
```sql
ALTER TABLE candidates 
ADD COLUMN order_code VARCHAR(255) UNIQUE,
ADD COLUMN order_code_consumed_at TIMESTAMP;

CREATE INDEX idx_candidates_order_code ON candidates(order_code);
```

---

## Criptografia de Dados

### Campos Criptografados (AES-256-CBC)
- `candidateName`
- `candidateEmail`
- `candidatePhone`

### Campos em Texto Plano
- `candidateUniqueDocument` - **Literal para permitir buscas**
- `orderCode` - Usado para validações e buscas

**Motivo**: O documento é usado para verificar duplicação e o orderCode para validação externa.

---

## Cron Jobs

### 1. Limpeza de Candidatos Pendentes
```typescript
@Cron(process.env.CLEAN_EXPIRED_PENDING_CRON || '0 */6 * * *')
async cleanExpiredPendingCandidates()
```
- **Frequência**: Configurável via `.env` (padrão: a cada 6 horas)
- **Função**: Remove registros com tokens expirados de `PendingCandidates`

### 2. Processamento de Formulários
```typescript
// Registrado dinamicamente via OnModuleInit
async handleProcessesInAnswerPeriod()
```
- **Frequência**: Configurável via `.env` (padrão: 10h diariamente)
- **Função**: Envia emails para candidatos com formulários disponíveis
- **Implementação**: Usa `SchedulerRegistry` para suportar variáveis de ambiente

---

## Variáveis de Ambiente

### Novas Variáveis
```env
# API Externa (Loja FAAMA)
EXTERNAL_ORDER_VALIDATION_API_URL=https://api-loja-faama.educadventista.org
EXTERNAL_ORDER_VALIDATION_API_USERNAME=username
EXTERNAL_ORDER_VALIDATION_API_PASSWORD=password

# Frontend
FRONTEND_URL=https://your-frontend.com

# Cron Jobs
CLEAN_EXPIRED_PENDING_CRON=0 */6 * * *
ANSWER_PERIOD_CRON=0 10 * * *

# Token de Confirmação
PENDING_CANDIDATE_TOKEN_EXPIRATION_MINUTES=60
```

---

## Fluxo de Auto-Cadastro

```
┌─────────────────┐
│   Candidato     │
│ entra orderCode │
│   e email       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ 1. Valida orderCode na API  │
│    externa (Loja FAAMA)     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. Verifica se orderCode    │
│    já foi consumido         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 3. Cria registro em         │
│    PendingCandidates        │
│    com token único          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 4. Envia email com link     │
│    de confirmação           │
│    (token válido por 60min) │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 5. Candidato clica no link  │
│    do email                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 6. Valida token e verifica  │
│    se orderCode ainda       │
│    está disponível          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 7. Move dados para          │
│    Candidates               │
│    (com orderCode e         │
│    timestamp)               │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 8. Envia email de           │
│    confirmação              │
│    (cadastro completo)      │
└─────────────────────────────┘
```

---

## Segurança

### 1. Proteção de Token
- Token gerado com `crypto.randomBytes(32)`
- Armazenado como hash SHA256
- Expiração configurável
- Invalidado após uso

### 2. Race Condition Protection
- Verificação de `orderCode` disponível antes de confirmar
- Evita múltiplas confirmações do mesmo código

### 3. Email Masking
- Emails parcialmente ocultos nas respostas API
- Exemplo: `can*****@email.com`

### 4. Validação Externa
- `orderCode` validado em API externa antes de aceitar
- Autenticação JWT com a API da loja

### 5. Rate Limiting (Recomendado)
- Implementar limite de tentativas por IP
- Limite de reenvios de confirmação

---

## Testes

### Cenários de Teste Implementados

#### 1. Auto-Cadastro
- ✅ OrderCode válido
- ✅ OrderCode inválido
- ✅ OrderCode já consumido
- ✅ Email duplicado em pendentes

#### 2. Confirmação
- ✅ Token válido
- ✅ Token expirado
- ✅ Token inválido
- ✅ OrderCode consumido durante espera

#### 3. Reenvio
- ✅ Email existente em pendentes
- ✅ Email já confirmado
- ✅ Email não encontrado

---

## Próximos Passos (Opcional)

1. **Rate Limiting**:
   - Implementar `@nestjs/throttler`
   - Limitar tentativas de registro e reenvio

2. **Notificações Admin**:
   - Email para admin quando novo candidato se registra
   - Dashboard de candidatos pendentes

3. **Logs e Auditoria**:
   - Registrar todas as tentativas de registro
   - Log de tokens expirados/inválidos

4. **Testes E2E**:
   - Fluxo completo de auto-cadastro
   - Cenários de erro e recuperação

5. **Melhorias de UX**:
   - Feedback visual melhor no frontend
   - Possibilidade de editar email antes de confirmar

---

## Referências

- Documentação completa no `README.md`
- Tipos TypeScript em `src/candidates/types.ts`
- Validações em `src/candidates/dto/`
- Templates de email em `src/candidates/email-templates/`
