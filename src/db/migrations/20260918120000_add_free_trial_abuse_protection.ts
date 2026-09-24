import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("free_trial_claims", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().unique().references("id").inTable("users").onDelete("CASCADE");
    table.string("device_hash", 64).notNullable().unique();
    table.string("ip_hash", 64).notNullable().index();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("abuse_signals", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").nullable().references("id").inTable("users").onDelete("SET NULL");
    table.string("device_hash", 64).nullable().index();
    table.string("ip_hash", 64).nullable().index();
    table.string("reason", 80).notNullable().index();
    table.jsonb("metadata").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now()).index();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("abuse_signals");
  await knex.schema.dropTableIfExists("free_trial_claims");
}
