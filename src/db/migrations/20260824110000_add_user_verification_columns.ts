import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasEmailVerified = await knex.schema.hasColumn("users", "email_verified");
  const hasPhoneVerified = await knex.schema.hasColumn("users", "phone_verified");

  await knex.schema.alterTable("users", (table) => {
    if (!hasEmailVerified) table.boolean("email_verified").notNullable().defaultTo(false);
    if (!hasPhoneVerified) table.boolean("phone_verified").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasEmailVerified = await knex.schema.hasColumn("users", "email_verified");
  const hasPhoneVerified = await knex.schema.hasColumn("users", "phone_verified");

  await knex.schema.alterTable("users", (table) => {
    if (hasEmailVerified) table.dropColumn("email_verified");
    if (hasPhoneVerified) table.dropColumn("phone_verified");
  });
}
