/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('age').notNullable();
    table.string('username').notNullable().unique();
    table.string('bio');
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['user', 'admin']).notNullable().defaultTo('user');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('profile_picture_url');
    table.string('phone_number').notNullable().unique();

    table.timestamp('email_verified_at');
    table.timestamp('last_password_change');
    table.timestamp('last_login');
    table.timestamps(true, true);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
