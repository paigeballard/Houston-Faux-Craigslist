
const faker = require("faker");

const createFakeUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  //email: faker.internet.email(),
});

exports.seed = async function(knex, Promise) {
  // users
  const fakeUsers = [];
  const desiredFakeUsers = 500;
  for (let i = 0; i < desiredFakeUsers; i++) {
    fakeUsers.push(createFakeUser());
  }
  await knex("users")
    .insert(fakeUsers)
};
