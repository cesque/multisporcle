const WebSocket = require('ws')
const chalk = require('chalk')

const Room = require('./room')

const port = 3000
const server = new WebSocket.Server({ port: port })

let rooms = []

server.on('listening', socket => {
    console.log(chalk`{greenBright server running on port {white ${port}}}`)
})

server.on('connection', (socket, req) => {
    console.log(chalk`{blue new connection from: {white ${req.socket.remoteAddress}}}`)

    socket.once('message', message => {
        message = JSON.parse(message)

        if(message.type != 'connect') {
            console.error(chalk`{red recieved a non-connection message ({white ${message.type}}) on first connect from client {white ${req.socket.remoteAddress}}}`)
            return
        }

        if(message.roomCode) {
            let room = rooms.find(room => room.code == message.roomCode.toUpperCase())

            if(room) {
                if(message.user == 'host') {
                    // room code, room exists, host
                    room.connectHost(socket, message)
                } else {
                    // room code, room exists, player
                    room.connectPlayer(socket, message)
                }
            } else {
                if(message.user == 'host') {
                    // room code, room does not exist, host
                    createRoom(socket, message)
                } else {
                    // room code, room does not exist, player
                    // todo: send connection failed
                }
            }
        } else {
            if(message.user == 'host') {
                // no room code, host
                createRoom(socket, message)
            } else {
                // no room code, player
                // todo: send connection failed
            }
        }
    })
})

function createRoom(socket, message) {
    let room = new Room()
    rooms.push(room)
    room.connectHost(socket, message)
}