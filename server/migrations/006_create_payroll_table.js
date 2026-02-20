exports.up = function(knex) {
  return knex.schema.createTable('payroll', function(table) {
    table.string('id').primary().defaultTo(knex.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.string('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.enum('period_type', ['weekly', 'monthly']).notNullable();
    
    // Salary components
    table.decimal('base_salary', 10, 2).notNullable();
    table.decimal('attendance_deduction', 10, 2).defaultTo(0);
    table.decimal('overtime_amount', 10, 2).defaultTo(0);
    table.decimal('advance_deduction', 10, 2).defaultTo(0);
    table.decimal('total_deductions', 10, 2).defaultTo(0);
    table.decimal('net_salary', 10, 2).notNullable();
    
    // Status and metadata
    table.enum('status', ['pending', 'processed', 'paid']).defaultTo('pending');
    table.date('payment_date');
    table.text('notes');
    table.string('processed_by').references('id').inTable('businesses');
    table.timestamp('processed_at').defaultTo(knex.fn.now());
    
    // Ensure unique payroll per employee per period
    table.unique(['employee_id', 'period_start', 'period_end']);
    table.index(['employee_id', 'period_start']);
    table.index(['status']);
    table.index(['period_type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payroll');
};
