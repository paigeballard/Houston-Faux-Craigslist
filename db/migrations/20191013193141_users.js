exports.up = function(knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('user_id')
        table.string('firstName')
        table.string('lastName')
      })
    };
    
    exports.down = function(knex) {
      return knex.schema.raw('DROP TABLE users')
    };