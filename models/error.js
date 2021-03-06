
function error(details) {
  var err = new Error(details.message);
  for (var k in details) {
    if (details.hasOwnProperty(k)) {
      err[k] = details[k];
    }
  }
  return err;
}

function accountExists(email) {
  return error({
    errno: 101,
    message: 'Account already exists',
    email: email
  })
}

function unknownAccount(email) {
  return error({
    errno: 102,
    message: 'Unknown account',
    email: email
  })
}

function incorrectPassword() {
  return error({
    errno: 103,
    message: 'Incorrect password'
  })
}

function invalidSignature() {
  return error({
    errno: 109,
    message: 'Invalid signature'
  })
}

module.exports = {
  error: error,
  accountExists: accountExists,
  unknownAccount: unknownAccount,
  incorrectPassword: incorrectPassword,
  invalidSignature: invalidSignature
}
