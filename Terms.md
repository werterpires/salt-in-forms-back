# Terms API

Documentação dos endpoints de Termos (Terms). Todos os endpoints exigem usuário com papel ADMIN.

Base path: /terms

## Modelo de dados
- Campos de um termo:
  - roleId: número (enum ERoles)
  - termTypeId: número (enum ETermsTypes)
  - termText: string (mínimo 100 caracteres)
  - beginDate: string (formato YYYY-MM-DD)
  - termId: número (apenas leitura)
  - endDate: Date | null (definido pelo sistema)

- Regras gerais de data:
  - beginDate deve ser estritamente maior que a data/hora atual.
  - Datas são normalizadas internamente a partir da string recebida; o sistema aplica um ajuste de um dia para evitar problemas de fuso/UTC ao persistir.
  - Termos "em aberto" têm endDate = null.

- Permissões:
  - Todos os endpoints abaixo requerem papel ADMIN.

---

## Criar termo
POST /terms

Cria um novo termo para um papel (roleId) e tipo de termo (termTypeId) a partir de uma data futura (beginDate). Se existir um termo em aberto para o mesmo par (roleId, termTypeId), ele é encerrado no dia anterior ao início do novo termo.

Body (JSON):
{
  "roleId": 1,
  "termTypeId": 6,
  "termText": "... mínimo 100 caracteres ...",
  "beginDate": "2026-01-15"
}

Validações:
- roleId: deve ser um valor válido de ERoles (1-4):
  - 1 ADMIN, 2 SEC, 3 INTERV, 4 CANDIDATE
- termTypeId: deve ser um valor válido de ETermsTypes (1-11), p.ex. 6 = Política de Privacidade.
- termText: string com no mínimo 100 caracteres.
- beginDate: string de data válida (YYYY-MM-DD) e > hoje. Caso inválida ou não futura, retorna 400.

Efeitos colaterais na criação:
- Se existir um termo atual (endDate = null) para o mesmo (roleId, termTypeId):
  - Se esse termo ainda não estiver ativo (beginDate > agora), será rejeitado com 400: "#Você já criou um termo substituto...".
  - Se estiver ativo (beginDate <= agora), seu endDate passa a ser (beginDate do novo termo - 1 dia).
- O novo termo é criado com endDate = null (em aberto).

Resposta:
- 201 Created, corpo vazio.

Erros comuns (400):
- #Papel de usuário inválido.
- #Tipo de termos inválido.
- #Data de início inválida.
- #Data de início deve ser maior que a data atual.
- #Você já criou um termo substituto para o papel e tipo de termo selecionado.

Exemplo cURL:
```bash
curl -X POST http://localhost:3000/terms \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": 1,
    "termTypeId": 6,
    "termText": "Texto de termo com pelo menos 100 caracteres ...",
    "beginDate": "2026-01-15"
  }'
```

---

## Listar termos
GET /terms

Lista termos com paginação, ordenação e filtros opcionais.

Query params:
- page: número da página (padrão: 1)
- direction: "asc" | "desc" (padrão: "asc")
- column: coluna de ordenação (padrão: "beginDate"). Válidas: "beginDate", "endDate", "roleId", "termId", "termText", "termTypeId".
- roleId: filtra por papel
- termTypeId: filtra por tipo de termo
- onlyActive: booleano opcional (true = somente termos ativos agora; false = somente não-ativos [passados ou futuros]; ausente = todos)

Paginação:
- Tamanho de página: 20 registros.
- Retorno inclui pagesQuantity (total de páginas).

Resposta (200):
{
  "data": [
    {
      "termId": 10,
      "roleId": 1,
      "termTypeId": 6,
      "termText": "...",
      "beginDate": "2025-12-20T00:00:00.000Z",
      "endDate": null
    }
  ],
  "pagesQuantity": 3
}

Exemplo cURL:
```bash
curl "http://localhost:3000/terms?page=1&direction=desc&column=beginDate&roleId=1&termTypeId=6&onlyActive=true"
```

Observação sobre onlyActive:
- true: beginDate <= agora AND (endDate é null OU endDate >= agora).
- false: beginDate >= agora OR (beginDate <= agora AND endDate <= agora).

---

## Atualizar termo
PUT /terms

Atualiza um termo futuro (não é permitido alterar termos que já estão ou já estiveram ativos).

Body (JSON):
{
  "termId": 10,
  "roleId": 1,
  "termTypeId": 6,
  "termText": "novo texto ...",
  "beginDate": "2026-02-01"
}

Restrições:
- Só é permitido atualizar termos com beginDate > agora; caso contrário: 400 "#Termo não pode ser excluído ou editado, pois ele está ou já esteve ativo.".
- As mesmas validações de criação se aplicam (roleId, termTypeId, termText, beginDate).

Casos de atualização e efeitos:
- Mudança de roleId ou termTypeId (com qualquer outra alteração):
  - Reabre (endDate = null) o termo com maior endDate futuro do par antigo (roleId/termTypeId anterior), se existir.
  - Fecha o termo em aberto do novo par (roleId/termTypeId) ajustando seu endDate para (nova beginDate - 1 dia), se existir e estiver ativo.
  - Atualiza o termo alvo com os novos campos.
- Mudança de termText E beginDate (mesmo roleId/termTypeId):
  - Fecha o termo em aberto do mesmo par para (nova beginDate - 1 dia), se existir e estiver ativo.
  - Atualiza os campos do termo alvo.
- Mudança somente de termText:
  - Apenas atualiza os campos; sem efeitos em datas de outros termos.
- Sem mudanças efetivas:
  - 400 "#Nenhuma informação foi alterada.".

Resposta:
- 200 OK, corpo vazio.

Exemplo cURL:
```bash
curl -X PUT http://localhost:3000/terms \
  -H "Content-Type: application/json" \
  -d '{
    "termId": 10,
    "roleId": 1,
    "termTypeId": 6,
    "termText": "Texto atualizado com 100+ caracteres ...",
    "beginDate": "2026-02-01"
  }'
```

---

## Excluir termo
DELETE /terms/:id

Exclui um termo futuro. Não é permitido excluir termos que já estão ou já estiveram ativos.

Regras e efeitos:
- Se o termo não for futuro, retorna 400: "#Termo não pode ser excluído ou editado...".
- Ao excluir, se existir um termo do mesmo par (roleId/termTypeId) com endDate >= agora, ele é reaberto (endDate = null).

Resposta:
- 200 OK, corpo vazio.

Exemplo cURL:
```bash
curl -X DELETE http://localhost:3000/terms/10
```

---

## Observações adicionais
- Normalização de datas: o backend converte a string de data para `Date` e aplica um ajuste interno de +1 dia ao persistir, para mitigar diferenças de fuso/UTC.
- Ordenação e segurança: a ordenação é restrita a colunas conhecidas e a direção padrão é ascendente.
- Mensagens de erro: diversas mensagens começam com `#` por padrão do backend.
