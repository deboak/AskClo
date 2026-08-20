import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("profiles", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .unique() // one profile per user — enforces the one-to-one relationship
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.enum("gender", ["male", "female", "other", "prefer_not_to_say"]);
    table.date("date_of_birth");
    table.string("style_preference"); // e.g. streetwear, minimalist, traditional-leaning, mixed
    table.string("body_type");
    table.string("cultural_preference"); // tribe/region, optional — informs traditional wear suggestions

    table.timestamps(true, true);
    });
};


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("profiles");
}

