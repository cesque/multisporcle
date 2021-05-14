const chalk = require('chalk')

class Player {
    constructor(room, socket, name) {
        this.room = room
        this.socket = socket
        this.name = name

        socket.once('close', () => this.remove()) 

        socket.on('message', message => {
            message = JSON.parse(message)
            switch(message.type) {
                case 'submit answer': this.receiveSubmitAnswer(message); break
                default: console.error(chalk`{red unknown message type in player ({white ${message.type}})}`)
            }
        })
    }

    receiveSubmitAnswer(message) {
        this.room.submitAnswer(this, message.answer)
    }

    sendAnswerResponse(status, result) {
        this.socket.send(JSON.stringify({
            type: 'answer response',
            status,
            result,
        }))
    }

    sendRoomInfo() {
        this.socket.send(JSON.stringify({
            type: 'room info',
            name: this.name,
            ...this.room.getInfo(),
        }))
    }

    sendStartQuiz() {
        this.socket.send(JSON.stringify({
            type: 'quiz start',
        }))
    }

    sendEndQuiz() {
        this.socket.send(JSON.stringify({
            type: 'quiz end',
        }))
    }

    remove() {
        this.room.removePlayer(this.name)
    }
}

module.exports = Player