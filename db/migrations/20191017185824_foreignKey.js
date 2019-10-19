
exports.up = function (knex) {
    return knex.schema.table('sales', (table) => {
        table.integer('user_id').unsigned().index().references('id').inTable('users')
    })
  };   
  exports.down = function (knex) {
    return knex.schema.raw('DROP COLUMN user_id')
  };