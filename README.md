<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Sistema de gerenciamento de formulários e candidatos para processos seletivos da SALT/FAAMA. Desenvolvido com [Nest](https://github.com/nestjs/nest) framework.

## Features

- **Auto-cadastro de Candidatos**: Sistema de registro com confirmação por email
- **Gestão de Processos Seletivos**: Controle de períodos de inscrição e resposta
- **Formulários Dinâmicos**: Sistema flexível de questionários com validações
- **Autenticação JWT**: Sistema seguro com controle de acesso por roles
- **Criptografia de Dados**: Proteção de informações sensíveis dos candidatos
- **Envio de Emails**: Notificações via SendPulse
- **Validação Externa**: Integração com API da loja FAAMA

## Project setup

```bash
$ npm install
```

## Environment Variables

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

### Database
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### JWT Authentication
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

### Encryption
```env
ENCRYPTION_KEY=your-32-char-encryption-key
ENCRYPTION_IV=your-16-char-iv
```

### Email (SendPulse)
```env
SENDPULSE_API_USER_ID=your-sendpulse-user-id
SENDPULSE_SECRET=your-sendpulse-secret
SENDPULSE_SENDER_EMAIL=noreply@yourdomain.com
SENDPULSE_SENDER_NAME=Your Name
```

### External API (Loja FAAMA)
```env
EXTERNAL_ORDER_VALIDATION_API_URL=https://api-loja-faama.educadventista.org
EXTERNAL_ORDER_VALIDATION_API_USERNAME=your-username
EXTERNAL_ORDER_VALIDATION_API_PASSWORD=your-password
```

### Frontend
```env
FRONTEND_URL=https://your-frontend-url.com
```

### Cron Jobs
```env
# Limpeza de candidatos pendentes expirados (padrão: a cada 6 horas)
CLEAN_EXPIRED_PENDING_CRON=0 */6 * * *

# Processamento de formulários em período de resposta (padrão: às 10h diariamente)
ANSWER_PERIOD_CRON=0 10 * * *
```

### Logging
```env
# Período de retenção de logs em anos (padrão: 3)
LOG_RETENTION_YEARS=3
```

### Candidate Registration
```env
# Tempo de expiração do token de confirmação em minutos (padrão: 60)
PENDING_CANDIDATE_TOKEN_EXPIRATION_MINUTES=60
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Database Migrations

```bash
# Run migrations
$ npm run migrate

# Rollback last migration
$ npm run migrate:rollback

# Create new migration
$ npm run migrate:make migration_name
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

### Candidate Self-Registration Flow

O sistema implementa um fluxo completo de auto-cadastro com confirmação por email:

#### 1. Registro Inicial
**Endpoint**: `POST /candidates/self-register` (público)

**Request Body**:
```json
{
  "orderCode": "ABC123456",
  "email": "candidato@email.com"
}
```

**Processo**:
1. Valida o `orderCode` na API externa da loja FAAMA
2. Verifica se o `orderCode` já foi consumido
3. Verifica duplicação de email em candidatos pendentes
4. Cria registro em `PendingCandidates` com token único
5. Envia email de confirmação com link contendo o token
6. Token expira em `PENDING_CANDIDATE_TOKEN_EXPIRATION_MINUTES` (padrão: 60 min)

**Response**:
```json
{
  "message": "Email de confirmação enviado. Verifique sua caixa de entrada.",
  "email": "can*****@email.com"
}
```

#### 2. Confirmação de Email
**Endpoint**: `GET /candidates/confirm-registration/:token` (público)

**Processo**:
1. Valida o token e verifica expiração
2. Verifica se `orderCode` ainda não foi consumido (proteção contra race condition)
3. Move dados de `PendingCandidates` para `Candidates`
4. Marca `orderCode` como consumido com timestamp
5. Invalida token usado
6. Envia email de confirmação de cadastro com instruções

**Response**: Redirect para frontend com status de sucesso/erro

#### 3. Reenvio de Confirmação
**Endpoint**: `POST /candidates/resend-confirmation` (público)

**Request Body**:
```json
{
  "email": "candidato@email.com"
}
```

**Processo**:
1. Busca candidato pendente pelo email
2. Verifica se ainda não está confirmado
3. Gera novo token (invalida o anterior)
4. Reenvia email de confirmação
5. Reseta o prazo de expiração

**Response**:
```json
{
  "message": "Email de confirmação reenviado."
}
```

#### 4. Status de Registro (Admin)
**Endpoint**: `GET /candidates/registration-status/:orderCode` (requer role ADMIN ou SEC)

**Response**:
```json
{
  "status": "confirmed",
  "candidate": {
    "candidateId": 123,
    "candidateName": "Nome Criptografado",
    "candidateEmail": "Email Criptografado",
    "orderCode": "ABC123456",
    "orderCodeConsumedAt": "2025-01-15T10:30:00Z"
  }
}
```

Possíveis status:
- `pending`: Aguardando confirmação de email
- `confirmed`: Email confirmado, cadastro completo
- `expired`: Token expirado
- `not_found`: OrderCode não encontrado no sistema

### Data Encryption

Os seguintes campos são criptografados usando AES-256-CBC:
- `candidateName`
- `candidateEmail` 
- `candidatePhone`

**Não criptografado**:
- `candidateUniqueDocument`: Mantido literal para permitir buscas

### Cron Jobs

#### 1. Limpeza de Candidatos Pendentes Expirados
- **Frequência**: Configurável via `CLEAN_EXPIRED_PENDING_CRON` (padrão: a cada 6 horas)
- **Função**: Remove registros de `PendingCandidates` com tokens expirados
- **Método**: `cleanExpiredPendingCandidates()`

#### 2. Processamento de Formulários em Período de Resposta
- **Frequência**: Configurável via `ANSWER_PERIOD_CRON` (padrão: 10h diariamente)
- **Função**: Envia emails para candidatos com formulários disponíveis
- **Método**: `handleProcessesInAnswerPeriod()`
- **Filtros**: 
  - Processos em período de resposta
  - Candidatos com termos assinados
  - Formulários não iniciados ou em progresso

### Authentication & Authorization

O sistema usa JWT com as seguintes roles:
- `ADMIN`: Acesso total
- `SEC`: Acesso administrativo (secretaria)
- `CANDIDATE`: Acesso de candidato (limitado)

Endpoints públicos:
- `POST /candidates/self-register`
- `GET /candidates/confirm-registration/:token`
- `POST /candidates/resend-confirmation`

### External API Integration

O sistema integra com a API da loja FAAMA para validação de `orderCode`:
- **Endpoint**: `https://api-loja-faama.educadventista.org`
- **Autenticação**: JWT (username/password via env)
- **Validação**: Verifica existência e disponibilidade do código de pedido

### Security Features

1. **Token de Confirmação**:
   - Gerado com `crypto.randomBytes(32)`
   - Armazenado como hash SHA256
   - Expira em tempo configurável
   - Invalidado após uso

2. **Proteção contra Race Conditions**:
   - Verificação de `orderCode` já consumido antes de confirmar
   - Transações atômicas no banco de dados

3. **Rate Limiting**: (recomendado implementar)
   - Limitar tentativas de registro por IP
   - Limitar reenvios de confirmação

4. **Email Masking**:
   - Emails parcialmente ocultados nas respostas (can*****@email.com)

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
