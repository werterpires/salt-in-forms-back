---
name: base-conhecimento-validacoes
description: "Use quando precisar consultar, criar, revisar ou extender validacoes em src/questions/validations.ts; inclui estrutura padrao, fluxo de execucao e catalogo atualizado de validacoes por tipo."
---

# Base De Conhecimento De Validacoes

## Objetivo
Esta skill centraliza como o sistema de validacoes funciona no backend, como criar uma nova validacao com seguranca e como consultar as validacoes atualmente disponiveis.

## Onde Fica A Fonte Da Verdade
- Especificacoes de validacao: src/questions/validations.ts
- Tipos usados por validacao: src/questions/types.ts

## Estrutura Geral De Uma Validacao
Cada validacao segue o contrato ValidationSpcification:
- validationType: numero unico da validacao
- validationName: nome amigavel
- validationDescription: descricao funcional
- valueOneType: tipo esperado para valueOne
- valueTwoType: tipo esperado para valueTwo
- valueThreeType: tipo esperado para valueThree
- valueFourType: tipo esperado para valueFour
- validationFunction: funcao que recebe value, valueOne, valueTwo, valueThree, valueFour e retorna validationResult

Contrato de retorno:
- isValid: boolean
- errorMessage: string

## Fluxo De Execucao
1. O sistema carrega os objetos de validacao e monta o indice VALIDATION_SPECIFICATIONS_BY_TYPE.
2. Cada validacao e identificada por validationType.
3. Para validar um valor, a validacao correspondente executa validationFunction.
4. A funcao pode:
   - retornar isValid true com errorMessage vazio
   - retornar isValid false com mensagem para usuario
   - lancar erro quando os parametros da regra (valueOne..valueFour) estiverem invalidos

## Onde As Validacoes Sao Usadas No Sistema

### 1) Entrada Da API (criacao/edicao de perguntas)
- DTOs aceitam validacoes em arrays:
  - src/questions/dto/create-question.dto.ts -> validations e subValidations
  - src/questions/dto/update-question.dto.ts -> validations e subValidations
  - src/questions/dto/validationDto.ts -> contrato basico de validationType + valueOne..valueFour
- QuestionsService chama transformacoes no helper:
  - src/questions/questions.service.ts -> create/update passam por QuestionsHelper
- QuestionsHelper valida os tipos e normaliza valores:
  - validateValidations: checa se validationType existe em VALIDATION_SPECIFICATIONS_BY_TYPE
  - validateValidations: valida tipos esperados (string/number/boolean/undefined) conforme spec
  - validateValidations: converte valueOne..valueFour para string antes de persistir

### 2) Persistencia Em Banco
- Tabelas:
  - src/constants/db-schema.enum.ts -> Tables.VALIDATIONS e Tables.SUB_VALIDATIONS
- Migracoes:
  - migrations/20250813231651_validations.ts
  - migrations/20250826125552_subValidations.ts
- Repositorio de perguntas grava e le validacoes:
  - src/questions/questions.repo.ts
  - create/update: insere em VALIDATIONS e SUB_VALIDATIONS
  - findValidationsByQuestionId/findSubValidationsBySubQuestionId: le regras salvas

### 3) Leitura De Perguntas (retorno para painel/admin)
- QuestionsService busca validacoes no repo e transforma tipos de volta:
  - src/questions/questions.service.ts -> findAllBySectionId, findById, findByIds
- QuestionsHelper.transformValidations converte valores string do banco para os tipos da spec
  - ex: valueOne de '10' volta para number 10 quando valueOneType e number

### 4) Execucao Das Validacoes Na Resposta Do Candidato
- Fluxo principal de resposta:
  - src/answers/answers.service.ts -> createAnswer
  - carrega validacoes da pergunta via questionsRepo.findValidationsByQuestionId
  - filtra validacoes permitidas para o tipo da pergunta via AnswersHelper.filterValidValidations
  - executa validacoes com AnswersHelper.validateAnswer (ou validateAnswerWithEmailUniqueness)
- Motor de execucao:
  - src/answers/answers.helper.ts
  - resolve spec por validationType em VALIDATION_SPECIFICATIONS_BY_TYPE
  - executa spec.validationFunction(answerValue, valueOne..valueFour)
  - acumula erros e retorna BadRequestException com a primeira mensagem

### 5) Regras Permitidas Por Tipo De Pergunta
- Definidas em src/answers/answers.helper.ts por arrays internos:
  - OPEN_ANSWER aceita: 1,2,3,4,5,6,7,8,9,10,11,19,20,21,22,23,24,28,29,30
  - MULTIPLE_CHOICE, SINGLE_CHOICE, LIKERT, MATRIZES, MULTIPLE_RESPONSES, FIELDS: apenas 5
  - DATE aceita: 5,12,13,14,15,16
  - TIME aceita: 5,17,18,25,26
  - EMAIL aceita: 5,8,27
- Importante: mesmo que uma validacao exista no catalogo geral, ela so e executada se for permitida para o questionType.

## Matriz Rapida: QuestionType X Validacoes Permitidas

Fonte de referencia:
- src/constants/questions-types.enum.ts
- src/answers/answers.helper.ts

| QuestionType | Nome | Validacoes Permitidas (tipos) |
| --- | --- | --- |
| 1 | Resposta Aberta | 1,2,3,4,5,6,7,8,9,10,11,19,20,21,22,23,24,28,29,30 |
| 2 | Escolha Multipla | 5 |
| 3 | Escolha Unica | 5 |
| 4 | Escala Likert | 5 |
| 5 | Matriz de Escolha Unica | 5 |
| 6 | Matriz de Escolha Multipla | 5 |
| 7 | Data | 5,12,13,14,15,16 |
| 8 | Hora | 5,17,18,25,26 |
| 9 | Respostas Multiplas | 5 |
| 10 | Email | 5,8,27 |
| 11 | Campos | 5 |

Legenda rapida dos tipos usados na matriz:
- 1 Maior ou igual a
- 2 Maior que
- 3 Menor ou igual a
- 4 Menor que
- 5 Obrigatorio
- 6 Tamanho minimo
- 7 Tamanho maximo
- 8 Email valido
- 9 URL valida
- 10 Valor entre (inclusivo)
- 11 Valor entre (exclusivo)
- 12 Data minima
- 13 Data maxima
- 14 Data valida
- 15 Data entre (inclusivo)
- 16 Data entre (exclusivo)
- 17 Idade minima
- 18 Idade maxima
- 19 Valor numerico
- 20 Apenas letras
- 21 Numero minimo de palavras
- 22 Numero maximo de palavras
- 23 Apenas letras e espacos
- 24 Apenas letras e numeros
- 25 Data futura
- 26 Data passada
- 27 Email unico
- 28 CPF valido
- 29 CEP brasileiro: somente 8 digitos
- 30 Telefone brasileiro: somente 10 ou 11 digitos, sem +55

### 6) Caso Especial: Email Unico (tipo 27)
- Implementado em src/questions/validations.ts como isUnicEmail.
- Na execucao, AnswersHelper.validateAnswerWithEmailUniqueness busca historico de emails do candidato, descriptografa e injeta no valueOne em formato concatenado por ||.
- A validacao compara o email atual com a lista consolidada e bloqueia duplicidade.

### 7) Uso Em Formulario Para Resposta (montagem de payload)
- src/candidates/candidates.service.ts e src/candidates/candidates.repo.ts
- Ao montar o formulario para o candidato responder, o sistema inclui validations e subValidations de cada questao/subquestao para consulta no payload.

### 8) Uso Em Clonagem De Formularios
- src/s-forms/s-forms.repo.ts
- Ao clonar formulario, o sistema copia registros de VALIDATIONS e SUB_VALIDATIONS junto com perguntas e subperguntas.

## Fluxo Ponta A Ponta (resumo)
1. Admin envia validacoes no create/update de pergunta.
2. QuestionsHelper valida tipos contra spec e serializa valores para string.
3. QuestionsRepo persiste em validations/subValidations.
4. No envio de resposta, AnswersService carrega validacoes e filtra por questionType.
5. AnswersHelper executa spec.validationFunction e interrompe com erro amigavel se houver falha.
6. Ao consultar perguntas (admin/candidato), validacoes sao retornadas e tipadas conforme necessario.

## Cuidados Reais Ao Criar Nova Validacao
- Atualize src/questions/validations.ts e registre no array validationSpecs.
- Verifique se a nova validacao deve ser permitida em algum questionType em src/answers/answers.helper.ts.
- Se nao incluir o novo tipo nos arrays permitidos, a validacao pode ser salva no banco, mas nunca executada na resposta.
- Se precisar usar em subquestoes, confirme tambem o fluxo de subValidations nas operacoes de create/update e consulta.

## Regras De Implementacao
- Sempre validar assinatura dos parametros (valueOne..valueFour) no inicio da validationFunction.
- Sempre tratar valor vazio de forma consistente via isNilOrEmpty(value) quando a regra permitir vazio.
- Normalizar entrada antes de validar quando necessario (trim, parse numerico, parse data).
- Usar mensagens de erro claras e acionaveis.
- Garantir que validationType nao conflite com tipos existentes.
- Registrar a nova validacao no array validationSpecs para entrar no mapa VALIDATION_SPECIFICATIONS_BY_TYPE.

## Checklist Para Criar Nova Validacao
1. Defina um validationType novo (nao repetido).
2. Escolha validationName e validationDescription claros.
3. Configure valueOneType..valueFourType corretamente.
4. Implemente validationFunction com:
   - validacao dos parametros da regra
   - comportamento para vazio
   - normalizacao de entrada
   - validacao principal
   - retorno de validationResult
5. Adicione a validacao em validationSpecs.
6. Confirme que ela aparece no mapa VALIDATION_SPECIFICATIONS_BY_TYPE.
7. Adicione ou atualize testes cobrindo casos validos, invalidos e entradas mal formatadas.

## Template Base
~~~ts
export const novaValidacao: ValidationSpcification = {
  validationType: 999,
  validationName: 'Nome da validacao',
  validationDescription: 'Descricao do que valida',
  valueOneType: 'number',
  valueTwoType: 'undefined',
  valueThreeType: 'undefined',
  valueFourType: 'undefined',
  validationFunction: (value: any, val1: any, val2: any, val3: any, val4: any): validationResult => {
    // 1) validar parametros da regra
    if (typeof val1 === 'undefined' || val2 || val3 || val4) {
      throw new Error('Parametros invalidos para a validacao "Nome da validacao"')
    }

    // 2) permitir vazio quando aplicavel
    if (isNilOrEmpty(value)) return { isValid: true, errorMessage: '' }

    // 3) normalizar e validar
    const parsed = Number(value)
    if (isNaN(parsed)) {
      return { isValid: false, errorMessage: 'O valor deve ser numerico' }
    }

    // 4) regra de negocio
    const ok = parsed >= Number(val1)
    return ok
      ? { isValid: true, errorMessage: '' }
      : { isValid: false, errorMessage: 'Mensagem de erro amigavel' }
  }
}
~~~

## Catalogo Atual De Validacoes
Tipos atualmente registrados em src/questions/validations.ts:

1. Tipo 1: Maior ou igual a
2. Tipo 2: Maior que
3. Tipo 3: Menor ou igual a
4. Tipo 4: Menor que
5. Tipo 5: Obrigatorio
6. Tipo 6: Tamanho minimo
7. Tipo 7: Tamanho maximo
8. Tipo 8: Email valido
9. Tipo 9: URL valida
10. Tipo 10: Valor entre (inclusivo)
11. Tipo 11: Valor entre (exclusivo)
12. Tipo 12: Data minima
13. Tipo 13: Data maxima
14. Tipo 14: Data valida
15. Tipo 15: Data entre (inclusivo)
16. Tipo 16: Data entre (exclusivo)
17. Tipo 17: Idade minima
18. Tipo 18: Idade maxima
19. Tipo 19: Valor numerico
20. Tipo 20: Apenas letras
21. Tipo 21: Numero minimo de palavras
22. Tipo 22: Numero maximo de palavras
23. Tipo 23: Apenas letras e espacos
24. Tipo 24: Apenas letras e numeros
25. Tipo 25: Data futura
26. Tipo 26: Data passada
27. Tipo 27: Email unico
28. Tipo 28: CPF valido
29. Tipo 29: CEP brasileiro
30. Tipo 30: Telefone brasileiro

## Observacoes Importantes
- O nome da interface esta como ValidationSpcification (sem o segundo e em Specification). Mantenha como esta para evitar quebra de contrato.
- Algumas validacoes aceitam valor vazio como valido; use essa convencao de forma consistente com o comportamento esperado da pergunta.
- Para validacoes de data no formato YYYY-MM-DD, reutilize a logica de isValidISODateString para evitar datas inexistentes.
- CEP brasileiro e telefone brasileiro sao validados apenas com digitos puros: CEP com 8 numeros e telefone com 10 ou 11 numeros, sem mascara e sem prefixo +55.
