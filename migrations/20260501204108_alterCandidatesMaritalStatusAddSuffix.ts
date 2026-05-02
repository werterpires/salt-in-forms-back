import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Alterar ENUM para incluir valores com "/a"
  await knex.raw(`
    ALTER TABLE candidates 
    MODIFY COLUMN candidate_marital_status 
    ENUM('solteiro/a', 'namorando', 'noivo/a', 'casado/a', 'divorciado/a', 'viúvo/a')kn
  `)
}

export async function down(knex: Knex): Promise<void> {
  // Voltar para valores sem "/a"
  await knex.raw(`
    ALTER TABLE candidates 
    MODIFY COLUMN candidate_marital_status 
    ENUM('solteiro', 'namorando', 'noivo', 'casado', 'divorciado', 'viúvo')
  `)
}
