
const faker = require("faker");

const createFakeUser = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
});

exports.seed = function(knex) {
  // users
  return knex('users')
  .then(function () {
    const fakeUsers = [];
    const desiredFakeUsers = 20;
    for (let i = 0; i < desiredFakeUsers; i++) {
      fakeUsers.push(createFakeUser());
    }
    return knex("users")
      .insert(fakeUsers)
  })
};
