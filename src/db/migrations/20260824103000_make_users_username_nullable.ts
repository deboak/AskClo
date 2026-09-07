import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasUsername = await knex.schema.hasColumn("users", "username");
  if (!hasUsername) return;

  await knex.schema.alterTable("users", (table) => {
    table.string("username").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasUsername = await knex.schema.hasColumn("users", "username");
  if (!hasUsername) return;

  await knex.schema.alterTable("users", (table) => {
    table.string("username").notNullable().alter();
  });
}
