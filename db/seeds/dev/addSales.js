
const faker = require("faker");

const createFakeSale = () => ({
    sale_item: faker.commerce.productName(),
    price: parseInt( faker.commerce.price() ),
    description: faker.lorem.sentences(6),
    img: faker.image.cats()
});

exports.seed = function(knex) {
  // Sale Item
return knex('sales').del()
  .then(function () {
    const fakeSales = [];
  const desiredFakeSales = 100;
  for (let i = 0; i < desiredFakeSales; i++) {
    fakeSales.push(createFakeSale());
  }
  return knex("sales")
    .insert(fakeSales)
  })
};


