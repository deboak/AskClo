import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("subscriptions", (table) => {
    table.boolean("cancel_at_period_end").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("subscriptions", (table) => {
    table.dropColumn("cancel_at_period_end");
  });
}
