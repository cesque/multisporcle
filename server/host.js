const chalk = require('chalk')

class Host {
    constructor(room, socket) {
        this.room = room
        this.socket = socket

        socket.on('message', message => {
            message = JSON.parse(message)
            switch(message.type) {
                case 'answer response': this.receiveAnswerResponse(message); break
                case 'quiz start': this.receiveQuizStart(message); break
                case 'quiz end': this.receiveQuizEnd(message); break
                default: console.error(chalk`{red unknown message type in host ({white ${message.type}})}`)
            }
        })
    }

    sendRoomInfo() {
        this.socket.send(JSON.stringify({
            type: 'room info',
            ...this.room.getInfo(),
        }))
    }

    submitAnswer(player, answer) {
        this.socket.send(JSON.stringify({
            type: 'submit answer',
            player: player.name,
            answer: answer,
        }))
    }

    receiveAnswerResponse(message) {
        this.room.sendAnswerResponse(message.player, message.status, message.result)
    }

    receiveQuizStart(message) {
        this.room.startQuiz()
    }

    receiveQuizEnd(message) {
        this.room.endQuiz()
    }
}

module.exports = Host