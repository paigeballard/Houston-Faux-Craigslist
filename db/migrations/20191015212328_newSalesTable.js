
exports.up = function (knex) {
  return knex.schema.createTable('sales', (table) => {
    table.increments('id')
    table.text('sale_item')
    table.integer('price')
    table.text('description')  
  })
};   
exports.down = function (knex) {
  return knex.schema.raw('DROP TABLE sales')
};