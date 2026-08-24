import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
    table.string("email", 255).notNullable().unique();
    table.enum("role", ["user", "admin"]).notNullable().defaultTo("user");
    table.string("avatar");
    table.string("phone_number").notNullable().unique();
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.boolean("phone_verified").notNullable().defaultTo(false);
    
    table.boolean("is_active").notNullable().defaultTo(true);
    table.boolean("is_deleted").notNullable().defaultTo(false);
    table.boolean("is_blocked").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}
