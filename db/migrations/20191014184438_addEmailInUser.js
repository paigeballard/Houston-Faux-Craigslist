
exports.up = function(knex, Promise) {
    return knex.schema.raw
    ('ALTER TABLE users ADD COLUMN email text;')
}

exports.down = function(knex, Promise) {
    return knex.schema.raw('DROP TABLE users')
};


