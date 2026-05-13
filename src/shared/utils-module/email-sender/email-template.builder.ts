// ─── Typed content block interfaces ───────────────────────────────────────────

export interface CodeBlock {
  type: 'codeBlock'
  label: string
  code: string
  backgroundColor: string
  textColor: string
  labelColor: string
}

export interface AlertBox {
  type: 'alertBox'
  icon?: string
  title: string
  message: string
  backgroundColor: string
  borderColor: string
  titleColor: string
  textColor?: string
}

export interface StatCards {
  type: 'statCards'
  cards: Array<{
    label: string
    value: string | number
    backgroundColor: string
    borderColor: string
    valueColor: string
  }>
}

export interface KeyValueBox {
  type: 'keyValueBox'
  fields: Array<{ label: string; value: string }>
  backgroundColor?: string
}

export type ContentItem =
  | string
  | CodeBlock
  | AlertBox
  | StatCards
  | KeyValueBox

// ─── Main email content interfaces ────────────────────────────────────────────

export interface EmailContent {
  recipientName: string
  contentBeforeButton?: ContentItem[]
  button?: {
    text: string
    url: string
  }
  contentAfterButton?: ContentItem[]
  infoText?: string[]
}

export interface EmailImages {
  wavingHandIcon?: string
  logoUrl?: string
}

export interface EmailFooter {
  menuItems?: string[]
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export class EmailTemplateBuilder {
  private static readonly DEFAULT_WAVING_HAND =
    'https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/svg/1f44b.svg'
  private static readonly DEFAULT_LOGO = ''
  private static readonly DEFAULT_CONTACT_EMAIL =
    'vestibularsalt.faama@faama.edu.br'

  static build(
    content: EmailContent,
    images?: EmailImages,
    footer?: EmailFooter
  ): string {
    const wavingHandUrl = images?.wavingHandIcon ?? this.DEFAULT_WAVING_HAND
    const logoUrl = images?.logoUrl ?? this.DEFAULT_LOGO

    return `<!DOCTYPE html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no">
  <meta name="color-scheme" content="light">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    body { margin: 0 !important; padding: 0 !important; background-color: #f5f5f5; width: 100% !important; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    a { color: #246996; }
    @media screen and (max-width: 620px) {
      .email-card { width: 100% !important; }
      .email-pad { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
         style="width:100%;background-color:#f5f5f5;mso-table-lspace:0pt;mso-table-rspace:0pt;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!--[if mso]>
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0">
        <tr><td>
        <![endif]-->

        <table class="email-card" role="presentation" border="0" cellpadding="0" cellspacing="0"
               style="width:100%;max-width:600px;background-color:#ffffff;border-radius:8px;
                      overflow:hidden;mso-table-lspace:0pt;mso-table-rspace:0pt;">

          <tr>
            <td class="email-pad" align="center"
                style="padding:40px 40px 24px 40px;background-color:#ffffff;">
              <img src="${wavingHandUrl}" width="60" height="60" alt="👋"
                   style="display:block;width:60px;height:60px;max-width:60px;margin:0 auto 20px auto;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#111827;
                         font-family:'Inter',Arial,Helvetica,sans-serif;
                         line-height:34px;text-align:center;">
                Olá, ${content.recipientName}
              </h1>
            </td>
          </tr>

          ${this.buildContentSection(content.contentBeforeButton)}

          ${this.buildButtonSection(content.button)}

          ${this.buildContentSection(content.contentAfterButton)}

          ${this.buildInfoSection(content.infoText)}

          ${this.buildFooter(logoUrl, footer)}

        </table>

        <!--[if mso]>
        </td></tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>`
  }

  private static buildContentSection(items?: ContentItem[]): string {
    if (!items || items.length === 0) return ''
    return items.map((item) => this.buildContentItem(item)).join('\n')
  }

  private static buildContentItem(item: ContentItem): string {
    if (typeof item === 'string') {
      return `
          <tr>
            <td class="email-pad" align="center"
                style="padding:0 40px 16px 40px;font-size:16px;line-height:26px;
                       color:#374151;font-family:'Inter',Arial,Helvetica,sans-serif;
                       font-weight:500;text-align:center;">
              <p style="margin:0;">${item}</p>
            </td>
          </tr>`
    }
    switch (item.type) {
      case 'codeBlock':
        return this.buildCodeBlock(item)
      case 'alertBox':
        return this.buildAlertBox(item)
      case 'statCards':
        return this.buildStatCards(item)
      case 'keyValueBox':
        return this.buildKeyValueBox(item)
    }
  }

  private static buildCodeBlock(block: CodeBlock): string {
    return `
          <tr>
            <td class="email-pad" style="padding:8px 40px 16px 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-radius:8px;">
                <tr>
                  <td align="center" bgcolor="${block.backgroundColor}"
                      style="background-color:${block.backgroundColor};padding:28px 24px;
                             border-radius:8px;text-align:center;">
                    <p style="margin:0 0 10px 0;color:${block.labelColor};font-size:12px;
                              font-weight:600;font-family:'Inter',Arial,Helvetica,sans-serif;
                              text-transform:uppercase;letter-spacing:1px;">
                      ${block.label}
                    </p>
                    <p style="margin:0;color:${block.textColor};font-size:42px;font-weight:700;
                              font-family:'Courier New',Courier,monospace;letter-spacing:8px;
                              line-height:54px;">
                      ${block.code}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
  }

  private static buildAlertBox(block: AlertBox): string {
    const textColor = block.textColor ?? block.titleColor
    const iconPrefix = block.icon ? `${block.icon} ` : ''
    return `
          <tr>
            <td class="email-pad" style="padding:8px 40px 16px 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                <tr>
                  <td width="4" bgcolor="${block.borderColor}"
                      style="width:4px;background-color:${block.borderColor};
                             font-size:0;line-height:0;">&nbsp;</td>
                  <td bgcolor="${block.backgroundColor}"
                      style="background-color:${block.backgroundColor};
                             padding:16px 16px 16px 16px;border-radius:0 4px 4px 0;">
                    <p style="margin:0 0 6px 0;color:${block.titleColor};font-size:15px;
                              font-weight:600;font-family:'Inter',Arial,Helvetica,sans-serif;
                              line-height:22px;">
                      ${iconPrefix}${block.title}
                    </p>
                    <p style="margin:0;color:${textColor};font-size:14px;
                              font-family:'Inter',Arial,Helvetica,sans-serif;
                              line-height:21px;">
                      ${block.message}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
  }

  private static buildStatCards(block: StatCards): string {
    const cardRows = block.cards
      .map(
        (card) => `
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                      <tr>
                        <td width="4" bgcolor="${card.borderColor}"
                            style="width:4px;background-color:${card.borderColor};
                                   font-size:0;line-height:0;">&nbsp;</td>
                        <td bgcolor="${card.backgroundColor}"
                            style="background-color:${card.backgroundColor};
                                   padding:14px 16px;border-radius:0 4px 4px 0;">
                          <p style="margin:0 0 4px 0;color:#64748b;font-size:13px;
                                    font-weight:500;font-family:'Inter',Arial,Helvetica,sans-serif;">
                            ${card.label}
                          </p>
                          <p style="margin:0;color:${card.valueColor};font-size:26px;
                                    font-weight:700;font-family:'Inter',Arial,Helvetica,sans-serif;
                                    line-height:34px;">
                            ${card.value}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
      )
      .join('\n')

    return `
          <tr>
            <td class="email-pad" style="padding:8px 40px 16px 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                ${cardRows}
              </table>
            </td>
          </tr>`
  }

  private static buildKeyValueBox(block: KeyValueBox): string {
    const bgColor = block.backgroundColor ?? '#f3f4f6'
    const fieldRows = block.fields
      .map(
        (field) => `
                  <tr>
                    <td style="padding:0 0 8px 0;">
                      <p style="margin:0;color:#374151;font-size:14px;
                                font-family:'Inter',Arial,Helvetica,sans-serif;line-height:20px;">
                        <strong>${field.label}:</strong> ${field.value}
                      </p>
                    </td>
                  </tr>`
      )
      .join('\n')

    return `
          <tr>
            <td class="email-pad" style="padding:8px 40px 16px 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                <tr>
                  <td bgcolor="${bgColor}"
                      style="background-color:${bgColor};padding:16px;border-radius:6px;">
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                      ${fieldRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
  }

  private static buildButtonSection(button?: {
    text: string
    url: string
  }): string {
    if (!button) return ''
    return `
          <tr>
            <td align="center" style="padding:8px 40px 24px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                <tr>
                  <td align="center" bgcolor="#246996"
                      style="background-color:#246996;border-radius:8px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                                 xmlns:w="urn:schemas-microsoft-com:office:word"
                                 href="${button.url}"
                                 style="height:48px;v-text-anchor:middle;width:280px;"
                                 arcsize="12%" stroke="f" fillcolor="#246996">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;
                                     font-size:16px;font-weight:700;">
                        ${button.text}
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${button.url}"
                       style="display:inline-block;background-color:#246996;color:#ffffff;
                              font-family:'Inter',Arial,Helvetica,sans-serif;font-size:16px;
                              font-weight:700;line-height:48px;padding:0 32px;
                              text-decoration:none;border-radius:8px;
                              -webkit-text-size-adjust:none;">
                      ${button.text}
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
  }

  private static buildInfoSection(infoText?: string[]): string {
    const lines =
      infoText && infoText.length > 0
        ? infoText
        : [
            'Por favor, não responda a este email.',
            `Em caso de dúvidas, entrar em contato por meio do email ${this.DEFAULT_CONTACT_EMAIL}`
          ]

    const paragraphs = lines
      .filter((text) => text.trim() !== '')
      .map(
        (text) =>
          `<p style="margin:0 0 10px 0;font-size:14px;line-height:22px;
              color:#6b7280;font-family:'Inter',Arial,Helvetica,sans-serif;">${text}</p>`
      )
      .join('\n              ')

    return `
          <tr>
            <td class="email-pad" align="center"
                style="padding:8px 40px 28px 40px;text-align:center;">
              ${paragraphs}
            </td>
          </tr>`
  }

  private static buildFooter(logoUrl: string, footer?: EmailFooter): string {
    const menuItems = footer?.menuItems ?? [
      'Sobre',
      'Contato',
      'Política de Privacidade'
    ]

    const menuCells = menuItems
      .map((item, i) => {
        const sep =
          i < menuItems.length - 1
            ? `<td style="padding:0 6px;color:#9ca3af;font-size:12px;
                         font-family:'Inter',Arial,Helvetica,sans-serif;">|</td>`
            : ''
        return `<td style="padding:0;color:#9ca3af;font-size:12px;
                           font-family:'Inter',Arial,Helvetica,sans-serif;">${item}</td>${sep}`
      })
      .join('\n              ')

    const logoSection = logoUrl
      ? `<tr>
           <td align="center" style="padding:0 0 14px 0;">
             <img src="${logoUrl}" width="120" alt="Logo FAAMA"
                  style="display:block;max-width:120px;height:auto;margin:0 auto;">
           </td>
         </tr>`
      : ''

    return `
          <tr>
            <td bgcolor="#F2F2F2"
                style="background-color:#F2F2F2;padding:24px 40px;
                       border-top:1px solid #e5e7eb;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"
                     style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                ${logoSection}
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;">
                      <tr>
                        ${menuCells}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
  }
}
