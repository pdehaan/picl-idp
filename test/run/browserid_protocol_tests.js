var test = require('tap').test
var cp = require('child_process')
var P = require('p-promise')
var Client = require('../../client')

var config = require('../../config').root()

function main() {

  test(
    'fetch /.well-known/browserid support document',
    function (t) {
      var client = new Client(config.public_url)
      function fetch(url) {
        return client.api.doRequest('GET', config.public_url + url)
      }
      fetch('/.well-known/browserid')
      .then(
        function (doc) {
          t.ok(doc.hasOwnProperty('public-key'), 'doc has public key')
          t.ok(doc.hasOwnProperty('authentication'), 'doc has auth page')
          t.ok(doc.hasOwnProperty('provisioning'), 'doc has provisioning page')
          return doc
        }
      )
      .then(
        function (doc) {
          return fetch(doc['authentication'])
          .then(
            function (authPage) {
              t.ok(authPage, 'auth page can be fetched')
              return doc
            }
          )
        }
      )
      .then(
        function (doc) {
          return fetch(doc['provisioning'])
          .then(
            function (provPage) {
              t.ok(provPage, 'provisioning page can be fetched')
              return doc
            }
          )
        }
      )
      .done(
        function () {
          t.end()
        },
        function (err) {
          t.fail(err.message || err.error)
          t.end()
        }
      )
    }
  )

  test(
    'teardown',
    function (t) {
      if (server) server.kill('SIGINT')
      t.end()
    }
  )

}

///////////////////////////////////////////////////////////////////////////////

var server = null

function startServer() {
  var server = cp.spawn(
    'node',
    ['../../bin/key_server.js'],
    {
      cwd: __dirname
    }
  )

  server.stdout.on('data', process.stdout.write.bind(process.stdout))
  server.stderr.on('data', process.stderr.write.bind(process.stderr))
  return server
}

function waitLoop() {
  Client.Api.heartbeat(config.public_url)
    .done(
      main,
      function (err) {
        if (!server) {
          server = startServer()
        }
        console.log('waiting...')
        setTimeout(waitLoop, 100)
      }
    )
}

waitLoop()
