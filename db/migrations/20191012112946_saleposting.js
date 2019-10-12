
exports.up = function(knex) {
    return knex.schema.createTable('saleposting', (table) => {
        table.increments('id')
        table.string('title')
        table.string('price')
        table.string('description')
      })
    };
    
    exports.down = function(knex) {
      return knex.schema.raw('DROP TABLE saleposting')
    };