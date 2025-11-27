# 📊 Sistema de Pontuação Eliminatória - Documentação para Frontend

## 🎯 Visão Geral

Foi implementado um sistema de pontuação eliminatória para vestibulares. Algumas questões chave podem contribuir para um score de eliminação do candidato. Se o candidato atingir ou ultrapassar o `cutoffScore` definido no processo, ele será eliminado automaticamente.

**Importante:** Esta pontuação é invisível para os candidatos - eles não devem ver scores, opções com pontuação ou qualquer indicativo deste sistema.

---

## 🔄 Alterações na API de Processos

### 1. CREATE Process (`POST /processes`)

#### Novo campo opcional no body:

```typescript
{
  "processTitle": "Vestibular 2025",
  "processDataKey": "vest-2025-semestre-1",
  "processBeginDate": "2025-01-01",
  "processEndDate": "2025-12-31",
  "processEndAnswers": "2025-06-30",
  "processEndSubscription": "2025-02-28",
  
  // ✨ NOVO CAMPO
  "cutoffScore": 10.5  // opcional, numérico, >= 0
}
```

**Validações:**
- ✅ Opcional (pode ser `undefined` ou não enviado)
- ✅ Se enviado, deve ser numérico
- ✅ Se enviado, deve ser >= 0
- ✅ Suporta decimais (ex: 10.5, 7.25)

**Mensagens de erro:**
- `#A pontuação de corte deve ser numérica.`
- `#A pontuação de corte deve ser maior ou igual a 0.`

---

### 2. UPDATE Process (`PUT /processes/:id`)

#### Mesmo campo do CREATE:

```typescript
{
  "processId": 123,
  "processTitle": "Vestibular 2025 - Atualizado",
  // ... outros campos
  
  // ✨ PODE SER ATUALIZADO
  "cutoffScore": 15  // opcional
}
```

**Comportamento:**
- Se não enviar `cutoffScore`, o valor atual é mantido
- Se enviar `null` ou `undefined`, remove a pontuação de corte
- Se enviar um número, atualiza o valor

---

### 3. GET Process(es)

#### Resposta agora inclui:

```typescript
{
  "processId": 123,
  "processTitle": "Vestibular 2025",
  // ... campos existentes
  
  // ✨ NOVO CAMPO NA RESPOSTA
  "cutoffScore": 10.5  // ou null se não definido
}
```

---

## 📝 Alterações na API de Questions

### 1. CREATE Question (`POST /questions`)

#### Novo campo opcional no body:

```typescript
{
  "formSectionId": 1,
  "questionAreaId": 2,
  "questionOrder": 5,
  "questionType": 3,  // 3 = SINGLE_CHOICE ou 7 = DATE
  "questionStatement": "Qual sua idade?",
  "questionDescription": "",
  "questionDisplayRule": 1,
  "questionOptions": [
    {
      "questionOptionType": 1,
      "questionOptionValue": "18-25 anos"
    },
    {
      "questionOptionType": 1,
      "questionOptionValue": "26-35 anos"
    }
  ],
  
  // ✨ NOVO CAMPO OPCIONAL
  "questionScore": {
    "scoreType": "OPTION_BASED",  // ou "DATE_BASED"
    
    // Para OPTION_BASED (questões tipo SINGLE_CHOICE):
    "optionScoresJson": {
      "18-25 anos": 0,      // se escolher "18-25 anos": 0 pontos
      "26-35 anos": 3.5     // se escolher "26-35 anos": 3.5 pontos
    }
  }
}
```

---

### 2. Estrutura do `questionScore`

#### 🎯 Para questões do tipo SINGLE_CHOICE (tipo 3):

```typescript
{
  "questionScore": {
    "scoreType": "OPTION_BASED",
    "optionScoresJson": {
      "arroz": 0,         // se escolher a opção "arroz": 0 pontos
      "feijão": 2.5,      // se escolher a opção "feijão": 2.5 pontos
      "Chocolate": 5      // se escolher a opção "Chocolate": 5 pontos
    }
  }
}
```

**Regras:**
- ✅ `scoreType` deve ser `"OPTION_BASED"`
- ✅ `optionScoresJson` é **obrigatório** quando scoreType é OPTION_BASED
- ✅ As chaves do objeto devem ser os **valores** (`questionOptionValue`) das opções que existem em `questionOptions`
- ✅ Opções não mencionadas terão score 0 (implícito)
- ✅ Scores podem ser decimais (ex: 2.5, 3.75)

**Validações:**
- Se uma chave do `optionScoresJson` referenciar um valor de opção que não existe na questão, retorna erro:
  - `#A opção "{optionValue}" não existe nesta questão`

---

#### 📅 Para questões do tipo DATE (tipo 7):

```typescript
{
  "questionScore": {
    "scoreType": "DATE_BASED",
    "dateComparisonType": "BEFORE",  // ou "ON_OR_AFTER"
    "cutoffDate": "1990-01-01",
    "dateScore": 5
  }
}
```

**Exemplos de uso:**

1. **Penalizar quem nasceu ANTES de 1990:**
```typescript
{
  "scoreType": "DATE_BASED",
  "dateComparisonType": "BEFORE",
  "cutoffDate": "1990-01-01",
  "dateScore": 10  // candidatos nascidos antes de 1990 ganham 10 pontos
}
```

2. **Penalizar quem nasceu EM OU APÓS 2005:**
```typescript
{
  "scoreType": "DATE_BASED",
  "dateComparisonType": "ON_OR_AFTER",
  "cutoffDate": "2005-01-01",
  "dateScore": 8  // candidatos nascidos em/após 2005 ganham 8 pontos
}
```

**Regras:**
- ✅ `scoreType` deve ser `"DATE_BASED"`
- ✅ `dateComparisonType` **obrigatório**: `"BEFORE"` ou `"ON_OR_AFTER"`
- ✅ `cutoffDate` **obrigatório**: string no formato `"YYYY-MM-DD"`
- ✅ `dateScore` **obrigatório**: número >= 0

---

### 3. UPDATE Question (`PUT /questions/:id`)

#### Comportamento do `questionScore`:

```typescript
{
  "questionId": 123,
  "questionType": 3,
  // ... outros campos
  
  // ✨ COMPORTAMENTO:
  "questionScore": { ... }  // atualiza o score (deleta antigo, cria novo)
  // OU
  "questionScore": undefined  // remove o score existente
  // OU
  // não enviar a propriedade  // mantém o score existente
}
```

**⚠️ IMPORTANTE:**
- Se `questionScore` for `undefined`, o score da questão é **removido**
- Se `questionScore` contiver dados, o score antigo é **deletado** e um novo é **criado** (replace completo)
- Se a propriedade `questionScore` não vier no payload, o score existente é **mantido**

**Validação de valores no update:**
- No update, as `questionOptions` são enviadas completas
- Se o `optionScoresJson` referenciar um valor que não está no array de `questionOptions` enviado, retorna erro
- Isso garante consistência: se uma opção foi removida, ela não pode mais ter score

---

### 4. GET Question(s)

#### Resposta agora inclui:

```typescript
{
  "questionId": 123,
  "questionType": 3,
  "questionStatement": "Qual sua idade?",
  "questionOptions": [
    {
      "questionOptionId": 10,
      "questionOptionType": 1,
      "questionOptionValue": "18-25 anos"
    },
    {
      "questionOptionId": 11,
      "questionOptionType": 1,
      "questionOptionValue": "26-35 anos"
    }
  ],
  
  // ✨ NOVO CAMPO NA RESPOSTA (se existir)
  "questionScore": {
    "questionScoreId": 5,
    "questionId": 123,
    "scoreType": "OPTION_BASED",
    "optionScoresJson": {
      "18-25 anos": 0,
      "26-35 anos": 3.5
    },
    "dateComparisonType": null,
    "cutoffDate": null,
    "dateScore": null,
    "created_at": "2025-11-27T10:00:00Z",
    "updated_at": "2025-11-27T10:00:00Z"
  }
}
```

**Se a questão não tiver score, a propriedade `questionScore` não virá na resposta ou virá como `undefined`.**

---

## 🚨 Validações e Regras de Negócio

### Restrições de Tipo de Questão:

❌ `questionScore` **SÓ PODE** ser definido para:
- **SINGLE_CHOICE** (tipo 3)
- **DATE** (tipo 7)

Se tentar criar/atualizar com `questionScore` em outros tipos de questão, retorna erro:
```
#A pontuação de questão só pode ser definida para perguntas do tipo Escolha Única (SINGLE_CHOICE) ou Data (DATE)
```

---

### Validações para OPTION_BASED:

✅ `optionScoresJson` deve ser um objeto
✅ As chaves devem ser **valores** (`questionOptionValue`) de opções existentes na questão
❌ Erro se referenciar valor inexistente:
```
#A opção "{optionValue}" não existe nesta questão
```

---

### Validações para DATE_BASED:

✅ `dateComparisonType` obrigatório: `"BEFORE"` ou `"ON_OR_AFTER"`
✅ `cutoffDate` obrigatório: formato `"YYYY-MM-DD"`
✅ `dateScore` obrigatório: número >= 0

❌ Erros se campos faltando:
```
#Para pontuação baseada em data, dateComparisonType deve ser fornecido
#Para pontuação baseada em data, cutoffDate deve ser fornecida
#Para pontuação baseada em data, dateScore deve ser fornecido
```

---

## 📊 Enums Disponíveis

### Score Type:
```typescript
enum EScoreType {
  OPTION_BASED = "OPTION_BASED",  // Para questões SINGLE_CHOICE
  DATE_BASED = "DATE_BASED"        // Para questões DATE
}
```

### Date Comparison Type:
```typescript
enum EDateComparisonType {
  BEFORE = "BEFORE",              // Antes da data
  ON_OR_AFTER = "ON_OR_AFTER"    // Na data ou após
}
```

### Question Types (relevantes):
```typescript
enum EQuestionsTypes {
  SINGLE_CHOICE = 3,  // Pode ter questionScore do tipo OPTION_BASED
  DATE = 7            // Pode ter questionScore do tipo DATE_BASED
}
```

---

## 🎨 Exemplos Práticos Completos

### Exemplo 1: Questão SINGLE_CHOICE com Score

```typescript
// POST /questions
{
  "formSectionId": 1,
  "questionAreaId": 2,
  "questionOrder": 1,
  "questionType": 3,  // SINGLE_CHOICE
  "questionStatement": "Você é fumante?",
  "questionDescription": "",
  "questionDisplayRule": 1,
  "questionOptions": [
    {
      "questionOptionType": 1,
      "questionOptionValue": "Sim"
    },
    {
      "questionOptionType": 1,
      "questionOptionValue": "Não"
    }
  ],
  "questionScore": {
    "scoreType": "OPTION_BASED",
    "optionScoresJson": {
      "Sim": 5,   // Sim = 5 pontos de penalidade
      "Não": 0    // Não = 0 pontos
    }
  }
}
```

---

### Exemplo 2: Questão DATE com Score

```typescript
// POST /questions
{
  "formSectionId": 1,
  "questionAreaId": 3,
  "questionOrder": 2,
  "questionType": 7,  // DATE
  "questionStatement": "Data de nascimento",
  "questionDescription": "Informe sua data de nascimento",
  "questionDisplayRule": 1,
  "questionScore": {
    "scoreType": "DATE_BASED",
    "dateComparisonType": "BEFORE",
    "cutoffDate": "1980-01-01",
    "dateScore": 10  // Nasceu antes de 1980 = 10 pontos
  }
}
```

---

### Exemplo 3: UPDATE removendo score

```typescript
// PUT /questions/123
{
  "questionId": 123,
  "questionType": 3,
  "questionStatement": "Pergunta sem score agora",
  // ... outros campos
  
  "questionScore": undefined  // Remove o score
}
```

---

### Exemplo 4: Processo com score de corte

```typescript
// POST /processes
{
  "processTitle": "Vestibular Medicina 2025",
  "processDataKey": "vest-med-2025",
  "processBeginDate": "2025-01-01",
  "processEndDate": "2025-12-31",
  "processEndAnswers": "2025-06-30",
  "processEndSubscription": "2025-02-28",
  "cutoffScore": 5  // Candidatos com score >= 5 são eliminados
}
```

---

## 🔐 Segurança e Visibilidade

### ⚠️ CRÍTICO para o Frontend:

1. **Candidatos NÃO devem ver:**
   - O campo `questionScore` nas questões
   - O campo `cutoffScore` nos processos
   - Qualquer indicação de que questões têm pontuação
   - Valores de score nas opções

2. **Apenas administradores devem ver:**
   - Campos de score ao criar/editar questões
   - Campo `cutoffScore` ao criar/editar processos
   - Relatórios de score dos candidatos (futura implementação)

3. **Implementar filtros nas respostas da API:**
   - Ao buscar questões para candidatos, remover `questionScore` do JSON
   - Ao buscar processos para candidatos, remover `cutoffScore` do JSON
   - Isso pode ser feito via middleware ou endpoint separado

---

## 📞 Suporte

Para dúvidas sobre a implementação, consultar:
- Arquivo de migração: `migrations/20251127000001_questionScores.ts`
- DTOs: `src/questions/dto/question-score.dto.ts`, `src/processes/dto/create-process.dto.ts`
- Validações: `src/questions/questions.helper.ts` (método `validateQuestionScore`)
- Enums: `src/constants/score-types.enum.ts`

---

**Última atualização:** 27 de Novembro de 2025
