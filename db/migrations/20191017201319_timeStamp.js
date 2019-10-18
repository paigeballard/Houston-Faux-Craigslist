
exports.up = function (knex) {
    return knex.schema.table('sales', (table) => {
        table.timestamps(true);
    })
  };   
  exports.down = function (knex) {
    return knex.schema.raw('DROP TABLE sales')
  };
