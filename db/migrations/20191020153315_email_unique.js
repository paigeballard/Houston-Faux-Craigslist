
exports.up = function (knex) {
  return knex.schema.table('users', (table) => {
    table.unique('email')
  })
}

exports.down = function (knex) {
  return knex.schema.table('users', (table) => {
    table.dropUnique('email')
  })
}
