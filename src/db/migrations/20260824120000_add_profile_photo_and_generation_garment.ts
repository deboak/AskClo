import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profiles", (table) => {
    table.string("photo_url");
  });
  await knex.schema.alterTable("generations", (table) => {
    table.string("garment_image_url");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("generations", (table) => {
    table.dropColumn("garment_image_url");
  });
  await knex.schema.alterTable("profiles", (table) => {
    table.dropColumn("photo_url");
  });
}
