
const faker = require('faker')

const createFakeSale = (userIds) => ({
  sale_item: faker.commerce.productName(),
  price: parseInt(faker.commerce.price()),
  description: faker.lorem.sentences(6),
  img: faker.image.cats(),
  user_id: faker.random.arrayElement(userIds).id,
  created_at: faker.date.past(),
  updated_at: faker.date.recent()
})

exports.seed = function (knex) {
  // Sale Item
  return knex('sales').del()
    .then(function () {
      return knex
        .from('users')
        .select('id')
    }
    )
    .then(function (userIds) {
      console.log(userIds)
      const fakeSales = []
      const desiredFakeSales = 20
      for (let i = 0; i < desiredFakeSales; i++) {
        fakeSales.push(createFakeSale(userIds))
      }
      return knex('sales')
        .insert(fakeSales)
    })
}
