const faker = require("faker");

const createFakeUser = () => ({
  email: faker.internet.email(),
});

exports.seed = function(knex) {
  // users
  return knex('users').del()
    .then(function () {
      const fakeUsers = [];
  const desiredFakeUsers = 100;
  for (let i = 0; i < desiredFakeUsers; i++) {
    fakeUsers.push(createFakeUser());
  }
  return knex("users")
    .insert(fakeUsers)
    })
};
