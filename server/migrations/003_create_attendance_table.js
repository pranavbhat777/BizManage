exports.up = function(knex) {
  return knex.schema.createTable('attendance', function(table) {
    table.string('id').primary().defaultTo(knex.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.string('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
    table.date('date').notNullable();
    table.enum('status', ['present', 'absent', 'half_day']).notNullable();
    table.text('notes');
    table.string('marked_by').references('id').inTable('businesses'); // Admin who marked attendance
    table.timestamp('marked_at').defaultTo(knex.fn.now());
    
    table.unique(['employee_id', 'date']);
    table.index(['employee_id', 'date']);
    table.index(['date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attendance');
};
