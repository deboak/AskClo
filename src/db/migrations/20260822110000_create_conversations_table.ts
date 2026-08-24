import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("conversations", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("title", 255);
    table.timestamp("last_message_at");
    table.timestamps(true, true);

    table.index(["user_id", "last_message_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("conversations");
}
