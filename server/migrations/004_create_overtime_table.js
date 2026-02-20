exports.up = function(knex) {
  return knex.schema.createTable('overtime', function(table) {
    table.string('id').primary().defaultTo(knex.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.string('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
    table.date('date').notNullable();
    table.decimal('hours', 4, 2).notNullable(); // Overtime hours
    table.enum('rate_type', ['normal', 'holiday']).notNullable();
    table.decimal('rate_multiplier', 3, 2).notNullable(); // e.g., 1.5, 2.0
    table.decimal('total_amount', 10, 2); // Calculated amount
    table.text('notes');
    table.string('approved_by').references('id').inTable('businesses');
    table.timestamp('approved_at').defaultTo(knex.fn.now());
    
    table.index(['employee_id', 'date']);
    table.index(['date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('overtime');
};
