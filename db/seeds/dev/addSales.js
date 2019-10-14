
const faker = require("faker");

const createFakeSale = () => ({
    sale_item: faker.commerce.productName(),
    price: parseInt( faker.commerce.price() ) * 100,
    description: faker.lorem.sentences(6),
});

exports.seed = async function(knex, Promise) {
  // Sale Item
  const fakeSales = [];
  const desiredFakeSales = 500;
  for (let i = 0; i < desiredFakeSales; i++) {
    fakeSales.push(createFakeSale());
  }
  await knex("sales")
    .insert(fakeSales)
};


