import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasPasswordHash = await knex.schema.hasColumn("users", "password_hash");
  if (hasPasswordHash) return;

  await knex.schema.alterTable("users", (table) => {
    table.string("password_hash", 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasPasswordHash = await knex.schema.hasColumn("users", "password_hash");
  if (!hasPasswordHash) return;

  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("password_hash");
  });
}
