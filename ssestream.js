/*
 *  Generate a readable stream of Server-Sent-Events data.
 *
 *  The SSEStream class provides a simple say to turn a polling function
 *  call into a stream of Server-Sent-Events data messages.  It is a readable
 *  stream where each attempt to read from the stream triggers a call to
 *  `pollFunc`, whose returned data is rendered as an SSE "data" line.
 *  The calls are throttled to once every `pollInterval` seconds.
 *  The stream can be terminated by calling the `stop` method.
 *
 */

var stream = require('stream')
var util = require('util')

module.exports = SSEStream
util.inherits(SSEStream, stream.Readable)

function SSEStream(pollFunc, pollInterval) {
  stream.Readable.call(this)
  this.lastPollTime = 0
  this._pollFunc = pollFunc
  this._pollInterval = (pollInterval || 5) * 1000;
  this._pollStopped = false
  this._pollInFlight = null
}


// Implementation of abstract _read() method.
//
// Each call to this method triggers a call of the underlying `pollFunc`,
// unless there is already one in flight.  The calls are spaced at least
// `pollInterval` seconds apart, enforced using setTimeout as necessary.
// We rely on the consuming code calling _read() when more data is required,
// rathr than doing our own polling loop.
//
SSEStream.prototype._read = function(size) {
  console.log("READ FROM STREAM", size)
  var self = this
  if (this._pollStopped) {
    this.push(null);
  } else {
    if (this._pollInFlight === null) {
      var waitTime = this._pollInterval - ((+new Date()) - this.lastPollTime)
      console.log("WAIT TIME", waitTime);
      if (waitTime <= 0) {
        this.poll()
      } else {
        this._pollInFlight = setTimeout(this.poll.bind(this), waitTime)
      }
    }
  }
}


// Call the polling function, render its output as a "data" line.
//
SSEStream.prototype.poll = function() {
  console.log("BEGINNING TO POLL")
  var self = this;
  self.lastPollTime = +new Date()
  this._pollFunc(function(err, data) {
    if (err) {
      self.push('')
    } else {
      self.push('data: ' + JSON.stringify(data) + '\r\n\r\n')
    }
    self._pollInFlight = null;
  })
}


// Stop the polling process, terminating the SSE stream.
//
// This method must be called asynchronously to indicate that the stream
// should terminate.  It's safe to call to call it from within the polling
// function itself, e.g. in response to some sentinel value.
//
SSEStream.prototype.stop = function() {
  console.log("STOPPING TO POLL")
  this._pollStopped = true;
  if (this._pollInFlight) {
    clearTimeout(this._pollInFlight);
    this._pollInFlight = null;
    // Kick the stream to flush the EOF marker.
    // This must be async in case .stop() is called from within
    // the polling function itself, so that it gets a chance to
    // push the final data item before stopping.
    process.nextTick((function() {
      this.read(0)
    }).bind(this))
  }
}
