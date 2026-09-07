import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("generations", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.enum("type", ["generic_model", "own_photo"]).notNullable();
    table
      .enum("status", ["pending", "processing", "completed", "failed"])
      .notNullable()
      .defaultTo("pending");

    table.string("input_image_url");   // uploaded garment/photo, if scanning — nullable
    table.string("output_image_url");  // the generated result — nullable until completed
    table.text("prompt");              // the translated, detailed prompt sent to the image API

    table.decimal("cost_usd", 8, 4);   // actual cost of this generation, for tracking real spend
    table.string("provider");          // e.g. "replicate", "fal"
    table.string("provider_job_id");   // external job/request ID, useful for debugging failed calls

    table.timestamps(true, true);

    // speeds up the allowance-count query you'll run constantly:
    // "how many completed generations of this type has this user made since X date"
    table.index(["user_id", "type", "status", "created_at"]);
  });
};


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("generations");
}

