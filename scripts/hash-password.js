const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Gebruik: npm run hash-password -- "jouwWachtwoord"');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10));
