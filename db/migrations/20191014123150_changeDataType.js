
exports.up = function(knex, Promise) {
    return knex.schema.raw('ALTER TABLE sales ALTER COLUMN sale_item SET DATA TYPE Text;')
    
        
}

exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE sales')
};
