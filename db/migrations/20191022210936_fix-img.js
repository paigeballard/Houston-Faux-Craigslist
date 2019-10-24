
exports.up = function (knex) {
  return knex.schema.alterTable('sales', (table) => {
    table.string('img').alter()
  })
}

exports.down = function (knex) {
  return knex.schema.raw('DROP COLUMN img')
}
