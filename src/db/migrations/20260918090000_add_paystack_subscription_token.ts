import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("subscriptions", (table) => {
    table.string("paystack_email_token");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("subscriptions", (table) => {
    table.dropColumn("paystack_email_token");
  });
}
