exports.up = function(knex) {
  return knex.schema.createTable('businesses', function(table) {
    table.string('id').primary().defaultTo(knex.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.string('phone');
    table.string('address');
    table.string('logo_url');
    table.text('working_days'); // JSON as text for SQLite
    table.integer('standard_working_hours').defaultTo(8);
    table.date('week_start_day').defaultTo('2023-01-01'); // SQLite doesn't support date default
    table.text('holidays'); // JSON as text for SQLite
    table.text('overtime_rates'); // JSON as text for SQLite
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('businesses');
};
