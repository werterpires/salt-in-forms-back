/**
 * Interface para definir o conteúdo dinâmico do email
 */
export interface EmailContent {
  /** Nome do destinatário para saudação */
  recipientName: string
  /** Parágrafos de conteúdo antes do botão */
  contentBeforeButton?: string[]
  /** Configuração do botão (opcional) */
  button?: {
    text: string
    url: string
  }
  /** Parágrafos de conteúdo depois do botão */
  contentAfterButton?: string[]
  /** Informações adicionais (em fonte menor) */
  infoText?: string[]
}

/**
 * Interface para configurar as imagens do email
 */
export interface EmailImages {
  /** URL da imagem do ícone de mão acenando */
  wavingHandIcon?: string
  /** URL do logo no footer */
  logoUrl?: string
}

/**
 * Interface para configurar o footer
 */
export interface EmailFooter {
  /** Itens do menu do footer */
  menuItems?: string[]
}

/**
 * Classe para construir emails seguindo o template base padronizado
 */
export class EmailTemplateBuilder {
  private static readonly DEFAULT_WAVING_HAND =
    'https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/svg/1f44b.svg'
  private static readonly DEFAULT_LOGO = ''
  private static readonly DEFAULT_CONTACT_EMAIL =
    'vestibularsalt.faama@faama.edu.br'

  /**
   * Constrói o HTML completo do email baseado no template padronizado
   */
  static build(
    content: EmailContent,
    images?: EmailImages,
    footer?: EmailFooter
  ): string {
    const wavingHandUrl = images?.wavingHandIcon || this.DEFAULT_WAVING_HAND
    const logoUrl = images?.logoUrl || this.DEFAULT_LOGO

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', 'Arial', sans-serif;
          }

          body {
            padding: 8vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4vh;
            max-width: 900px;
            margin: auto;
          }

          #waving_hand_icon {
            width: 10vh;
            height: 10vh;
          }

          h1 {
            font-size: 4vh;
            font-weight: 600;
            text-align: center;
          }

          .content_container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .content {
            font-size: 2vh;
            text-align: center;
            max-width: 60vh;
            margin-bottom: 2vh;
            line-height: 2.5vh;
            font-weight: 500;
          }

          #button_container {
            display: flex;
            justify-content: center;
            width: 100%;
          }

          button {
            padding: 2vh 4vh;
            border-radius: 8px;
            background-color: #246996;
            color: #ffffff;
            border: none;
            font-size: 2vh;
            font-weight: 700;
            height: 7vh;
            width: 100%;
            max-width: 400px;
            margin: 0 50px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            line-height: 3vh;
          }

          a.button {
            padding: 2vh 4vh;
            border-radius: 8px;
            background-color: #246996;
            color: #ffffff;
            border: none;
            font-size: 2vh;
            font-weight: 700;
            height: 7vh;
            width: 100%;
            max-width: 400px;
            margin: 0 50px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            line-height: 3vh;
          }

          .info_container {
            font-size: 12px;
            text-align: center;
            max-width: 60vh;
            line-height: 15px;
            font-weight: 500;
          }

          .info_container p {
            margin-bottom: 8px;
          }

          .footer {
            padding: 24px;
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: space-between;
            gap: 5vh;
            background-color: #F2F2F2;
            width: 100%;
          }

          .footer img {
            max-width: 200px;
            height: auto;
          }

          #menu {
            display: flex;
            gap: 8px;
            font-size: 12px;
            flex-wrap: wrap;
            justify-content: center;
          }

          #menu p {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div>
          <img id="waving_hand_icon" src="${wavingHandUrl}" alt="👋">
        </div>
        
        <h1>Olá, ${content.recipientName}</h1>
        
        ${this.buildContentSection(content.contentBeforeButton)}
        
        ${this.buildButtonSection(content.button)}
        
        ${this.buildContentSection(content.contentAfterButton)}
        
        ${this.buildInfoSection(content.infoText)}
        
        ${this.buildFooter(logoUrl, footer)}
      </body>
      </html>
    `
  }

  /**
   * Constrói uma seção de conteúdo com parágrafos
   */
  private static buildContentSection(paragraphs?: string[]): string {
    if (!paragraphs || paragraphs.length === 0) {
      return ''
    }

    const paragraphsHtml = paragraphs
      .map((p) => `<p class="content">${p}</p>`)
      .join('\n          ')

    return `
        <div class="content_container">
          ${paragraphsHtml}
        </div>
    `
  }

  /**
   * Constrói a seção do botão
   */
  private static buildButtonSection(button?: {
    text: string
    url: string
  }): string {
    if (!button) {
      return ''
    }

    return `
        <div id="button_container">
          <a href="${button.url}" class="button">${button.text}</a>
        </div>
    `
  }

  /**
   * Constrói a seção de informações
   */
  private static buildInfoSection(infoText?: string[]): string {
    if (!infoText || infoText.length === 0) {
      return `
        <div class="info_container">
          <p>Por favor, não responda a este email.</p>
          <p>Em caso de dúvidas, entrar em contato por meio do email ${this.DEFAULT_CONTACT_EMAIL}</p>
        </div>
      `
    }

    const infoHtml = infoText
      .map((text) => `<p>${text}</p>`)
      .join('\n          ')

    return `
        <div class="info_container">
          ${infoHtml}
        </div>
    `
  }

  /**
   * Constrói o footer do email
   */
  private static buildFooter(logoUrl: string, footer?: EmailFooter): string {
    const menuItems = footer?.menuItems || [
      'Sobre',
      'Contato',
      'Política de Privacidade'
    ]

    const menuHtml = menuItems
      .map((item, index) => {
        const separator = index < menuItems.length - 1 ? '|' : ''
        return `<p>${item}</p>${separator ? ' | ' : ''}`
      })
      .join('\n            ')

    const logoSection = logoUrl ? `<img src="${logoUrl}" alt="Logo FAAMA">` : ''

    return `
        <div class="footer">
          ${logoSection}
          <div id="menu">
            ${menuHtml}
          </div>
        </div>
    `
  }
}
