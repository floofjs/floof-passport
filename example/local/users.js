const db = [
  {
    id: 1,
    username: 'admin',
    password: 'password',
    name: 'Admin McAdminface',
    bio: 'The most powerful administrator of all time!',
  }, {
    id: 2,
    username: 'aturing',
    password: '1234',
    name: 'Alan Turing',
    bio: 'Does computer stuff.',
  },
];

class DbApi {
  constructor(db) {
    this.db = db;
  }
  
  async lookup(id) {
    for (const user of db) {
      if (user.id === id) return user;
    }
    return null;
  }
  
  async lookupUsername(name) {
    for (const user of db) {
      if (user.username === name) return user;
    }
    return null;
  }
}

const dbApi = new DbApi(db);

module.exports = dbApi;