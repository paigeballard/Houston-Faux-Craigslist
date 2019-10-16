exports.up = function(knex, Promise) {
    return knex.schema.raw(
        'ALTER TABLE sales ADD COLUMN user_id integer'
    )
}
    
exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE sales')
};
