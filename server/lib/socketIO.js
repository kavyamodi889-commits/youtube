// FILE: server/lib/socketIO.js
// Singleton to hold the Socket.IO instance
// Avoids circular require between server.js and notification controllers
let _io = null

module.exports = {
  setIO: (io) => { _io = io },
  getIO: ()   => _io,
  // Emit to a specific room
  emitTo: (room, event, data) => {
    if (_io) _io.to(room).emit(event, data)
  },
}