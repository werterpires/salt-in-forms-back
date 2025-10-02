
import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'

@Injectable()
export class EncryptionService {
  private readonly algorithm: string
  private readonly key: Buffer
  private readonly ivLength: number
  private readonly bufferFormat: BufferEncoding

  constructor() {
    this.algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc'
    const password = process.env.ENCRYPTION_PASSWORD || 'minha-senha-secreta'
    const salt = process.env.ENCRYPTION_SALT || 'salto'
    const keylen = parseInt(process.env.ENCRYPTION_KEYLEN || '32', 10)
    this.key = crypto.scryptSync(password, salt, keylen)
    this.ivLength = parseInt(process.env.ENCRYPTION_IV_LENGTH || '16', 10)
    this.bufferFormat = (process.env.ENCRYPTION_BUFFER_FORMAT || 'hex') as BufferEncoding
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
    return (
      iv.toString(this.bufferFormat) +
      ':' +
      encrypted.toString(this.bufferFormat)
    )
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText.includes(':')) return encryptedText
    const [ivHex, encryptedHex] = encryptedText.split(':')
    const iv = Buffer.from(ivHex, this.bufferFormat)
    const encrypted = Buffer.from(encryptedHex, this.bufferFormat)
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    return decrypted.toString()
  }
}
