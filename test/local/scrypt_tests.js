/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var test = require('../ptaptest')
var promise = require('../../promise')
var scrypt = require('../../crypto/scrypt')

test(
  'scrypt basic',
  function (t) {
    var K1 = Buffer('f84913e3d8e6d624689d0a3e9678ac8dcc79d2c2f3d9641488cd9d6ef6cd83dd', 'hex')
    var salt = Buffer('identity.mozilla.com/picl/v1/scrypt')

    return scrypt.hash(K1, salt, 65536, 8, 1, 32)
      .then(
        function (K2) {
          t.equal(K2, '5b82f146a64126923e4167a0350bb181feba61f63cb1714012b19cb0be0119c5')
        }
      )
  }
)

test(
  'scrypt enforces maximum number of pending requests',
  function (t) {
    var K1 = Buffer('f84913e3d8e6d624689d0a3e9678ac8dcc79d2c2f3d9641488cd9d6ef6cd83dd', 'hex')
    var salt = Buffer('identity.mozilla.com/picl/v1/scrypt')
    // Set a lower MAX_PENDING so the test runs quicker.
    var orig_max_pending = scrypt.MAX_PENDING;
    scrypt.MAX_PENDING = 5;
    // Send many concurent requests.
    // Not yielding the event loop ensures they will pile up quickly.
    var promises = [];
    for (var i = 0; i < 10; i++) {
      promises.push(scrypt.hash(K1, salt, 65536, 8, 1, 32))
    }
    scrypt.MAX_PENDING = orig_max_pending;
    return promise.all(promises).then(
      function () {
        t.fail('too many pending scrypt hashes were allowed')
      },
      function (err) {
        t.equal(err.message, 'too many pending scrypt hashes')
      }
    );
  }
)
