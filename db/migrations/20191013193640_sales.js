
exports.up = function(knex) {
    return knex.schema.createTable('sales', (table) => {
        table.integer('sale_id')
        table.text('title')
        table.integer('price')
        table.string('description')
        table.foreign('sale_id').references('user_id').inTable('users');
      })
    };
    
    exports.down = function(knex) {
      return knex.schema.raw('DROP TABLE sales')
    };
