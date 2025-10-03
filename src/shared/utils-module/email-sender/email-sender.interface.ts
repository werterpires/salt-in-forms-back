
export interface EmailSender {
  sendEmail(recipientEmail: string, recipientName: string, body: string): Promise<void>
}
