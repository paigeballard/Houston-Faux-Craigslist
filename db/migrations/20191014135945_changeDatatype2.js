
exports.up = function(knex, Promise) {
    return knex.schema.raw('ALTER TABLE sales ALTER COLUMN description SET DATA TYPE text;')
    
        
}

exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE sales')
};