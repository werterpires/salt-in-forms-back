# Sistema Centralizado de Templates de Email

## 📋 Visão Geral

Todos os emails do sistema agora seguem um template base padronizado, evitando repetição de código HTML/CSS e facilitando manutenção.

## 🎨 Estrutura do Template Base

Cada email contém:
- ✋ Ícone de mão acenando
- 👤 Saudação personalizada com nome do destinatário
- 📝 Conteúdo em parágrafos (antes do botão)
- 🔘 Botão de ação (opcional)
- 📝 Conteúdo adicional (depois do botão)
- ℹ️ Informações de contato
- 🦶 Footer com logo e menu

## 💻 Como Usar

### Exemplo Básico

```typescript
import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

const htmlEmail = EmailTemplateBuilder.build({
  recipientName: 'João Silva',
  contentBeforeButton: [
    'Você foi convidado para fazer parte do sistema.',
    'Clique no botão abaixo para aceitar o convite.'
  ],
  button: {
    text: 'Aceitar Convite',
    url: 'https://sistema.com/convite/abc123'
  },
  contentAfterButton: [
    'Este link é válido por 24 horas.'
  ]
})

// Enviar o email
await emailService.sendEmail('joao@example.com', 'João Silva', htmlEmail)
```

### Exemplo Sem Botão

```typescript
const htmlEmail = EmailTemplateBuilder.build({
  recipientName: 'Maria Santos',
  contentBeforeButton: [
    'Sua solicitação foi processada com sucesso!',
    'Em breve você receberá mais informações.'
  ]
})
```

### Exemplo com Imagens Personalizadas

```typescript
const htmlEmail = EmailTemplateBuilder.build(
  {
    recipientName: 'Pedro Oliveira',
    contentBeforeButton: ['Bem-vindo ao FAAMA!'],
    button: { text: 'Começar', url: 'https://...' }
  },
  {
    wavingHandIcon: 'https://seu-cdn.com/icone-mao.svg',
    logoUrl: 'https://seu-cdn.com/logo-faama.png'
  }
)
```

### Exemplo com Footer Personalizado

```typescript
const htmlEmail = EmailTemplateBuilder.build(
  {
    recipientName: 'Ana Costa',
    contentBeforeButton: ['Relatório pronto!']
  },
  undefined, // usa imagens padrão
  {
    menuItems: ['Portal', 'Ajuda', 'Contato']
  }
)
```

### Exemplo com HTML no Conteúdo

```typescript
const htmlEmail = EmailTemplateBuilder.build({
  recipientName: 'Carlos Lima',
  contentBeforeButton: [
    'Seu código de acesso é:',
    '<strong style="font-size: 20px; color: #246996;">ABC-123-XYZ</strong>'
  ],
  contentAfterButton: [
    'Use este código para acessar o sistema.',
    '<em>Válido por 48 horas</em>'
  ]
})
```

## 📁 Arquivos Atualizados

Todos os templates existentes foram refatorados para usar o novo sistema:

### ✅ Templates de Usuários
- `src/users/users.service.ts` - Email de convite para usuários

### ✅ Templates de Candidatos
- `src/candidates/email-templates/candidate-form-access.template.ts`
- `src/candidates/email-templates/resend-access-code.template.ts`
- `src/candidates/email-templates/import-summary.template.ts`

## 🖼️ Configuração de Imagens

Consulte o arquivo `EMAIL_IMAGES.md` para detalhes sobre:
- Onde hospedar as imagens
- Formatos e tamanhos recomendados
- Configuração via variáveis de ambiente
- Troubleshooting

## 🎯 Benefícios

- ✅ **DRY**: Zero repetição de HTML/CSS
- ✅ **Consistência**: Todos os emails têm a mesma aparência
- ✅ **Manutenção**: Mudanças de estilo em um único lugar
- ✅ **Flexibilidade**: Fácil personalização quando necessário
- ✅ **TypeScript**: Autocomplete e validação de tipos

## 🔧 Personalização Avançada

Se precisar de um email completamente diferente do template base, você ainda pode criar HTML customizado. Mas para 90% dos casos, o `EmailTemplateBuilder` será suficiente.

### Modificar o Template Base

Edite o arquivo:
```
src/shared/utils-module/email-sender/email-template.builder.ts
```

As mudanças serão automaticamente aplicadas a todos os emails do sistema.
