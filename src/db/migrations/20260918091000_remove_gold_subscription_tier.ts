import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("subscriptions").where({ tier: "gold" }).update({ tier: "pro" });
  await knex("payment_transactions").where({ tier: "gold" }).update({ tier: "pro" });

  await knex.raw(
    "alter table subscriptions drop constraint if exists subscriptions_tier_check",
  );
  await knex.raw(
    "alter table subscriptions add constraint subscriptions_tier_check check (tier in ('free_trial', 'basic', 'pro'))",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "alter table subscriptions drop constraint if exists subscriptions_tier_check",
  );
  await knex.raw(
    "alter table subscriptions add constraint subscriptions_tier_check check (tier in ('free_trial', 'basic', 'pro', 'gold'))",
  );
}
