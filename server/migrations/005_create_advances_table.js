exports.up = function(knex) {
  return knex.schema.createTable('advances', function(table) {
    table.string('id').primary().defaultTo(knex.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.string('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.date('date').notNullable();
    table.text('notes');
    table.string('recorded_by').references('id').inTable('businesses');
    table.timestamp('recorded_at').defaultTo(knex.fn.now());
    table.decimal('balance_remaining', 10, 2).notNullable(); // Remaining balance to deduct
    
    table.index(['employee_id', 'date']);
    table.index(['date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('advances');
};
