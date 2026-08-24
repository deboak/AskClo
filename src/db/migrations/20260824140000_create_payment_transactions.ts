import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("payment_transactions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("provider").notNullable();
    table.string("reference").notNullable().unique();
    table.string("tier", 30).notNullable();
    table.integer("amount_kobo").notNullable();
    table.string("currency", 10).notNullable().defaultTo("NGN");
    table.enum("status", ["pending", "successful", "failed"]).notNullable().defaultTo("pending");
    table.jsonb("provider_payload");
    table.timestamps(true, true);
    table.index(["user_id", "created_at"]);
  });
}
export async function down(knex: Knex): Promise<void> { await knex.schema.dropTable("payment_transactions"); }
