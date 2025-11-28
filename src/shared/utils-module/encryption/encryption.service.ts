import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as crypto from 'crypto'

@Injectable()
export class EncryptionService {
  private readonly algorithm: string
  private readonly key: Buffer
  private readonly ivLength: number
  private readonly bufferFormat: BufferEncoding

  constructor() {
    if (!process.env.ENCRYPTION_ALGORITHM) {
      throw new InternalServerErrorException(
        'ENCRYPTION_ALGORITHM não está definido no .env'
      )
    }
    if (!process.env.ENCRYPTION_PASSWORD) {
      throw new InternalServerErrorException(
        'ENCRYPTION_PASSWORD não está definido no .env'
      )
    }
    if (!process.env.ENCRYPTION_SALT) {
      throw new InternalServerErrorException(
        'ENCRYPTION_SALT não está definido no .env'
      )
    }
    if (!process.env.ENCRYPTION_KEYLEN) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEYLEN não está definido no .env'
      )
    }
    if (!process.env.ENCRYPTION_IV_LENGTH) {
      throw new InternalServerErrorException(
        'ENCRYPTION_IV_LENGTH não está definido no .env'
      )
    }
    if (!process.env.ENCRYPTION_BUFFER_FORMAT) {
      throw new InternalServerErrorException(
        'ENCRYPTION_BUFFER_FORMAT não está definido no .env'
      )
    }

    this.algorithm = process.env.ENCRYPTION_ALGORITHM
    const password = process.env.ENCRYPTION_PASSWORD
    const salt = process.env.ENCRYPTION_SALT
    const keylen = parseInt(process.env.ENCRYPTION_KEYLEN, 10)

    if (isNaN(keylen)) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEYLEN deve ser um número válido'
      )
    }

    this.ivLength = parseInt(process.env.ENCRYPTION_IV_LENGTH, 10)

    if (isNaN(this.ivLength)) {
      throw new InternalServerErrorException(
        'ENCRYPTION_IV_LENGTH deve ser um número válido'
      )
    }

    this.bufferFormat = process.env.ENCRYPTION_BUFFER_FORMAT as BufferEncoding
    this.key = crypto.scryptSync(password, salt, keylen)
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
