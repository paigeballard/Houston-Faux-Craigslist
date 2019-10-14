
exports.up = function(knex, Promise) {
    return knex.schema.table('sales', (table) => {
        table.renameColumn('title', 'sale_item');
    }
    )};

exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE sales')
};
