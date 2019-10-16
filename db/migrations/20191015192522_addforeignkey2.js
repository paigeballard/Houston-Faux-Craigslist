
exports.up = function(knex, Promise) {
    return knex.schema.table('sales', table => {
        table.integer('user_id')
        .unsigned()
        .references('users.user_id').alter()
    })
        
}
    
exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE sales')
};