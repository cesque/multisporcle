const WebSocket = require('ws')
const chalk = require('chalk')

const server = new WebSocket.Server({ port: 3000 })

let state = {
    quiz: '',
    playing: false,
}
let sporcle = null
let players = []

server.on('open', event => {
    console.log('server running')
})

server.on('connection', client => {
    client.on('message', message => {
        message = JSON.parse(message)
        switch(message.type) {
            case 'connect': 
                client.removeAllListeners('message')
                if(message.mode == 'sporcle') {
                    connectSporcle(message, client)
                } else {
                    if(sporcle) {
                        connectPlayer(message, client)
                    } else {
                        client.send(JSON.stringify({
                            type: 'not connected'
                        }))
                    }
                }
                break
            default: throw `unknown message type: ${JSON.stringify(message)}`
        }
    })
})

function connectSporcle(message, socket) {
    state.quiz = message.quiz
    sporcle = socket

    socket.send(JSON.stringify({
        type: 'connected'
    }))

    console.log('sporcle connected')

    socket.on('message', message => {
        message = JSON.parse(message)
        console.log(message)
        switch(message.type) {
            case 'quiz start':
                for(let player of players) {
                    player.send(JSON.stringify({
                        type: 'quiz start'
                    }))
                }
                break
            
            case 'answer response':
                let player = players.find(x => x.id == message.playerId)
                player.send(JSON.stringify({
                    type: 'answer response',
                    text: message.text,
                    result: message.result,
                }))
                break
            default: throw `unknown message type: ${JSON.stringify(message)}`
        }
    })
}

function connectPlayer(message, socket) {
    let player = {
        id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        socket: socket,
        send: m => socket.send(m)
    }

    players.push(player)
    console.log(chalk`{greenBright new player connected with id {redBright ${player.id}}!}`)

    socket.send(JSON.stringify({
        type: 'connected'
    }))

    if(state.playing) {
        socket.send(JSON.stringify({
            type: 'quiz start'
        }))
    }

    socket.on('message', message => {
        message = JSON.parse(message)
        switch(message.type) {
            case 'answer':
                console.log(chalk`{blue {white ${player.id}} said '{green ${message.text}}}'`)
                sporcle.send(JSON.stringify({
                    type: 'answer',
                    playerId: player.id,
                    text: message.text,
                }))
                break
            default: throw `unknown message type: ${JSON.stringify(message)}`
        }
    })
}