
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', table => {
        table.dropColumn('userid')
    })
        
}
    
exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE users')
};
