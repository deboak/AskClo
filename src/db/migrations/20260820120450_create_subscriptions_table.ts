import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("subscriptions", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
        .uuid("user_id")
        .notNullable()
        .unique() // one active subscription record per user
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");

        table
        .enum("tier", ["free_trial", "basic", "pro", "gold"])
        .notNullable()
        .defaultTo("free_trial");
        table
        .enum("status", ["active", "expired", "cancelled", "past_due"])
        .notNullable()
        .defaultTo("active");

        table.timestamp("current_period_start").notNullable().defaultTo(knex.fn.now());
        table.timestamp("current_period_end").notNullable();

        table.string("paystack_customer_id");
        table.string("paystack_subscription_code");

        table.timestamps(true, true);
        });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("subscriptions");
}

