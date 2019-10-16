
exports.up = function(knex, Promise) {
    return knex.schema.raw
    ('ALTER TABLE users ADD COLUMN userId integer') 
}
    


exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE users')
};
