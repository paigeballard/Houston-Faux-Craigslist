
exports.up = function (knex) {
    return knex.schema.table('sales', (table) => {
        table.specificType('img', 'bytea')
    })
  };   
  exports.down = function (knex) {
    return knex.schema.raw('DROP TABLE sales')
  };