# Refatoração do Módulo Candidates

## Resumo das Mudanças

Esta refatoração foi realizada para melhorar a organização, manutenibilidade e performance do módulo de candidatos, mantendo todas as funcionalidades existentes.

---

## 1. Templates de Email (Novo)

### Pasta criada: `src/candidates/email-templates/`

#### `candidate-form-access.template.ts`
- Template HTML para email de acesso ao formulário do tipo "candidate"
- Função: `getCandidateFormAccessEmailTemplate(candidateName, accessLink, accessCode)`
- **Benefício**: HTML separado da lógica de negócio, fácil manutenção

#### `import-summary.template.ts`
- Template HTML para email de resumo de importação
- Função: `getImportSummaryEmailTemplate(totalFound, totalDuplicated, totalInserted)`
- **Benefício**: Centralização de templates, reutilização

---

## 2. Helpers Expandidos

### `src/candidates/candidates.helper.ts`

Funções adicionadas seguindo o padrão do projeto:

#### Funções de Formatação:
- `formatDateString(dateString)` - Formata datas para YYYY-MM-DD
- `generateFormAccessLink(frontendUrl, accessCode)` - Gera link de acesso

#### Funções de Validação:
- `isForeignerCandidate(estrangeiroValue)` - Verifica se é estrangeiro
- `getHoursDifference(date1, date2)` - Calcula diferença em horas

#### Funções de Transformação:
- `extractFieldsFromApiResponse(attributes)` - Extrai campos da API
- `transformApiItemToCandidate(apiItem, processId, encryptionService)` - Transforma item da API em candidato

**Benefício**: Lógica de negócio centralizada, testável e reutilizável

---

## 3. Repository Otimizado

### `src/candidates/candidates.repo.ts`

#### Novo método adicionado:
```typescript
async findCandidatesWithFormsCandidatesByIds(formsCandidatesIds: number[]): Promise<any[]>
```

**O que faz**:
- Busca dados completos com JOIN entre `FormsCandidates`, `Candidates` e `SForms`
- Retorna todos os dados necessários em uma única query

**Benefício**: 
- ❌ **ANTES**: N+1 queries (1 query para listar + N queries individuais)
- ✅ **AGORA**: 1 query única com JOIN
- **Performance**: Redução significativa de queries ao banco

---

## 4. Service Refatorado

### `src/candidates/candidates.service.ts`

#### Mudanças Principais:

##### ❌ **REMOVIDO**:
- `accessCodeMap: Map<string, AccessCodeMapEntry>` - Não estava sendo usado
- HTMLs gigantes dentro dos métodos (movidos para templates)
- Método `formatDate()` (movido para helper)
- Lógica de transformação inline (movida para helper)

##### ✅ **ADICIONADO**:
- `handleNormalAndMinisterialForms()` - Novo cron para formulários "normal" e "ministerial" (placeholder)
- `processCandidatesInsertion()` - Método privado para processar inserção
- `sendEmailsForCandidateForms()` - Método otimizado com query única

##### ♻️ **REFATORADO**:
- `parseApiResponseToCandidates()` - Agora usa helper `transformApiItemToCandidate()`
- `sendImportSummaryEmail()` - Usa template de email
- Métodos mais focados e com responsabilidades claras

---

## 5. Novo Cron para Formulários "Normal" e "Ministerial"

### `@Cron('0 */2 * * *')` - A cada 2 horas
```typescript
async handleNormalAndMinisterialForms()
```

**Status**: Implementação pendente (placeholder com console.log)

**Motivo**: Tabela de respostas das questions ainda não existe

**Quando implementar**, este cron deve:
1. Buscar candidatos que completaram formulário "candidate"
2. Para formulários "normal": buscar resposta da pergunta vinculada (emailQuestionId)
3. Enviar email para o endereço encontrado na resposta
4. Para formulários "ministerial": implementar lógica específica

---

## 6. Funcionalidades Mantidas

Todas as funcionalidades existentes foram mantidas:

✅ Busca de candidatos da API externa  
✅ Verificação de duplicatas  
✅ Inserção em batch  
✅ Geração de códigos de acesso  
✅ Envio de emails para formulários "candidate"  
✅ Validação de códigos com expiração de 24h  
✅ Email de resumo de importação  

---

## 7. Melhorias de Código

### Antes:
```typescript
// HTML gigante dentro do service (100+ linhas)
const html = `<!DOCTYPE html>...`

// N+1 queries
for (const formCandidate of formsCandidatesData) {
  const candidate = await this.candidatesRepo.findCandidateById(...)
  const sForm = sForms.find(...)
  // ...
}

// Lógica inline
const timestamp = Date.now().toString(36)
const randomPart = randomBytes(32).toString('base64url')
```

### Depois:
```typescript
// Template limpo e reutilizável
const html = getCandidateFormAccessEmailTemplate(name, link, code)

// Query única otimizada
const formsCandidatesData = await this.candidatesRepo
  .findCandidatesWithFormsCandidatesByIds(ids)

// Helper semântico
const candidate = transformApiItemToCandidate(item, processId, encryptionService)
```

---

## 8. Estrutura de Arquivos

```
src/candidates/
├── email-templates/           # NOVO
│   ├── candidate-form-access.template.ts
│   └── import-summary.template.ts
├── candidates.helper.ts       # EXPANDIDO
├── candidates.repo.ts         # OTIMIZADO
├── candidates.service.ts      # REFATORADO
└── ...
```

---

## Próximos Passos (Futuro)

1. ⏳ Criar tabela de respostas das questions
2. ⏳ Implementar `handleNormalAndMinisterialForms()` completamente
3. ⏳ Adicionar testes unitários para helpers
4. ⏳ Adicionar testes de integração para queries otimizadas

---

## Notas Técnicas

- **Padrão seguido**: Baseado em `s-forms.helper.ts` e `processes.helper.ts`
- **Compatibilidade**: 100% retrocompatível
- **Performance**: Queries otimizadas (N+1 → 1)
- **Manutenibilidade**: Código mais limpo e organizado
- **Documentação**: Todos os métodos documentados com JSDoc
