
const faker = require("faker");

const createFakeSale = () => ({
    sale_item: faker.commerce.productName(),
    price: parseInt( faker.commerce.price() ) * 100,
    description: faker.lorem.sentences(6),
    img: faker.image.imageUrl()
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


