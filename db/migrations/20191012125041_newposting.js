
exports.up = function(knex) {
    return knex.schema.createTable('newposting', (table) => {
        table.increments('id')
        table.string('title')
        table.integer('price')
        table.string('description')
      })
    };
    
    exports.down = function(knex) {
      return knex.schema.raw('DROP TABLE newposting')
    };