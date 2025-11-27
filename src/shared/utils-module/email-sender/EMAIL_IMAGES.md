# Configuração de Imagens para Templates de Email

## Localização das Imagens

As imagens usadas nos templates de email devem ser hospedadas em um servidor acessível publicamente, pois os clientes de email (Gmail, Outlook, etc.) precisam fazer download delas quando o usuário abre o email.

### Opções Recomendadas

#### 1. **CDN Público (Atual)**
Por padrão, o sistema está configurado para usar:
- **Ícone de mão acenando**: Emoji do Twemoji CDN
  - URL: `https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/svg/1f44b.svg`
  - Gratuito e confiável

#### 2. **Servir via Backend (Recomendado para Produção)**
Crie uma pasta `public/email-assets/` no projeto e configure o NestJS para servir arquivos estáticos:

```
salt-informs-back/
├── public/
│   └── email-assets/
│       ├── waving-hand.svg
│       └── logo-faama.png
```

**Configuração no `main.ts`:**
```typescript
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  
  // Servir arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/'
  })
  
  await app.listen(3000)
}
```

Então as URLs ficariam:
- `http://seu-dominio.com/public/email-assets/waving-hand.svg`
- `http://seu-dominio.com/public/email-assets/logo-faama.png`

#### 3. **Cloud Storage (Melhor para Produção)**
Use serviços como:
- **AWS S3** + CloudFront
- **Google Cloud Storage**
- **Azure Blob Storage**
- **Cloudinary** (especializado em imagens)

**Vantagens:**
- Alta disponibilidade
- CDN global (carregamento rápido)
- Não sobrecarrega seu backend

## Como Usar as Imagens nos Templates

### Padrão (usa CDN público)
```typescript
import { EmailTemplateBuilder } from 'src/shared/utils-module/email-sender/email-template.builder'

const htmlEmail = EmailTemplateBuilder.build({
  recipientName: 'João Silva',
  contentBeforeButton: ['Bem-vindo ao sistema!'],
  button: { text: 'Acessar', url: 'https://...' }
})
// Usa automaticamente o ícone padrão do Twemoji CDN
```

### Personalizado (suas próprias imagens)
```typescript
const htmlEmail = EmailTemplateBuilder.build(
  {
    recipientName: 'João Silva',
    contentBeforeButton: ['Bem-vindo ao sistema!'],
    button: { text: 'Acessar', url: 'https://...' }
  },
  {
    wavingHandIcon: 'https://seu-dominio.com/public/email-assets/waving-hand.svg',
    logoUrl: 'https://seu-dominio.com/public/email-assets/logo-faama.png'
  }
)
```

## Especificações das Imagens

### Ícone de Mão Acenando
- **Formato**: SVG (recomendado) ou PNG
- **Tamanho**: 100x100px (será exibido como 10vh no email)
- **Peso**: Máximo 50KB
- **Fundo**: Transparente

### Logo FAAMA
- **Formato**: PNG (com transparência) ou SVG
- **Largura**: Máximo 200px
- **Altura**: Proporcional
- **Peso**: Máximo 100KB

## Configuração via Variáveis de Ambiente

Para facilitar a troca de URLs das imagens entre ambientes (desenvolvimento, homologação, produção), adicione ao `.env`:

```env
# URLs das imagens de email
EMAIL_WAVING_HAND_ICON=https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/svg/1f44b.svg
EMAIL_LOGO_URL=https://seu-dominio.com/public/email-assets/logo-faama.png
```

E atualize o `EmailTemplateBuilder` para ler essas variáveis:

```typescript
private static readonly DEFAULT_WAVING_HAND =
  process.env.EMAIL_WAVING_HAND_ICON || 
  'https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/svg/1f44b.svg'

private static readonly DEFAULT_LOGO = 
  process.env.EMAIL_LOGO_URL || ''
```

## Testes

Antes de usar em produção, teste os emails em diferentes clientes:
- Gmail (web e app)
- Outlook (web e desktop)
- Apple Mail
- Yahoo Mail

Use ferramentas como [Litmus](https://www.litmus.com/) ou [Email on Acid](https://www.emailonacid.com/) para testes profissionais.

## Troubleshooting

### Imagem não aparece no email
1. Verifique se a URL está acessível publicamente (abra no navegador)
2. Confirme que não há CORS bloqueando
3. Alguns clientes de email bloqueiam imagens por padrão - instrua usuários a "Mostrar imagens"

### Imagem demora para carregar
1. Otimize o tamanho do arquivo
2. Use CDN
3. Considere usar data URLs para imagens muito pequenas (< 10KB)
