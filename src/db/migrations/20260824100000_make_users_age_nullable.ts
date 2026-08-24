import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasAge = await knex.schema.hasColumn("users", "age");
  if (!hasAge) return;

  await knex.schema.alterTable("users", (table) => {
    table.string("age").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasAge = await knex.schema.hasColumn("users", "age");
  if (!hasAge) return;

  await knex.schema.alterTable("users", (table) => {
    table.string("age").notNullable().alter();
  });
}
