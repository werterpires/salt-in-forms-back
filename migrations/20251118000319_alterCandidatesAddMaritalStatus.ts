import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('candidates', (table) => {
    table.enum('candidate_marital_status', [
      'solteiro',
      'namorando',
      'noivo',
      'casado',
      'divorciado',
      'viúvo'
    ]).nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('candidates', (table) => {
    table.dropColumn('candidate_marital_status');
  });
}

