exports.up = function(knex) {
  return knex.schema.alterTable('businesses', function(table) {
    table.string('email').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('businesses', function(table) {
    table.string('email').notNullable().unique().alter();
  });
};
