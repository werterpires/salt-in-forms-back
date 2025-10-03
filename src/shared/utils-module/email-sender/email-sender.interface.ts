
export interface EmailSender {
  sendEmail(recipient: string, body: string): Promise<void>
}
