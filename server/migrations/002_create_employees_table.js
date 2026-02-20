exports.up = function(knex) {
  return knex.schema.createTable('employees', function(table) {
    table.string('id').primary().defaultTo(knex.raw("(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))"));
    table.string('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('employee_code').notNullable().unique();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email');
    table.string('phone');
    table.string('address');
    table.date('date_of_birth');
    table.date('join_date').notNullable();
    table.string('position');
    table.string('department');
    table.enum('salary_type', ['daily', 'weekly', 'monthly']).notNullable();
    table.decimal('salary_amount', 10, 2).notNullable();
    table.string('bank_account');
    table.string('bank_name');
    table.string('profile_photo_url');
    table.text('documents'); // JSON as text for SQLite
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['business_id', 'employee_code']);
    table.index(['business_id', 'active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('employees');
};
