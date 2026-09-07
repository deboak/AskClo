import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("auth_identities", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("provider").notNullable();
        table.string("provider_id").notNullable();
        table.timestamps(true, true);

        table.unique(["provider", "provider_id"]);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("auth_identities");
}

