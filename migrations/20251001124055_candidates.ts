import type { Knex } from "knex";
import * as db from "../src/constants/db-schema.enum";


export async function up(knex: Knex): Promise<void> {
    const hasTable = await knex.schema.hasTable(db.Tables.CANDIDATES);
    if (hasTable) return;

    return knex.schema.createTable(db.Tables.CANDIDATES, (table) => {
        table.increments(db.Candidates.CANDIDATE_ID).primary();
        table.string(db.Candidates.CANDIDATE_NAME, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_UNIQUE_DOCUMENT, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_EMAIL, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_PHONE, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_BIRTHDATE, 255).notNullable();
        table.boolean(db.Candidates.CANDIDATE_FOREIGNER).notNullable();
        table.string(db.Candidates.CANDIDATE_ADDRESS, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_ADDRESS_NUMBER, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_DISTRICT, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_CITY, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_STATE, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_ZIP_CODE, 255).notNullable();
        table.string(db.Candidates.CANDIDATE_COUNTRY, 255).notNullable();
        table.integer(db.Candidates.PROCESS_ID).unsigned().notNullable()
            .references(db.Processes.PROCESS_ID)
            .inTable(db.Tables.PROCESSES)
            .onDelete('RESTRICT')
            .onUpdate('CASCADE');
        table.integer(db.Candidates.INTERVIEW_USER_ID).unsigned().nullable()
            .references(db.Users.USER_ID)
            .inTable(db.Tables.USERS)
            .onDelete('RESTRICT')
            .onUpdate('CASCADE');
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable(db.Tables.CANDIDATES);
}

