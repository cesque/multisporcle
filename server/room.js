const chalk = require('chalk')
const colors = require('corpora/data/colors/crayola.json').colors
const animals = require('corpora/data/animals/common.json').animals
const pick = require('./pick')

const Host = require('./host')
const Player = require('./player')

class Room {
    constructor() {
        let alphabet = 'abcdefghijklmnopqrstuvwxyz'
        let badWords = [
            'CUNT', 'FUCK', 'FECK', 'FOCK', 'JISM', 'GISM', 'JIZZ', 'SHIT', 'TWAT', 'TITS',
            'PISS', 'ARSE', 'DAMN', 'CRAP', 'HELL', 'WANG', 'WANK', 'MONG', 'GOOK', 'KIKE',
            'SPIC', 'COON', 'DAGO', 'DYKE', 'DIKE', 'COCK', 'DICK', 'KNOB', 'MUFF', 'PUSS',
            'SHAG', 'TOSS', 'SLUT',
        ]

        do {
            this.code = new Array(4)
                .fill(0)
                .map(x => pick(alphabet))
                .join('')
                .toUpperCase()
        } while(badWords.includes(this.code))

        this.created = Date.now()
        this.lastActivity = Date.now()

        this.host = null
        this.players = []

        this.currentQuiz = null
        this.isQuizActive = false

        console.log(chalk`{greenBright created a new room with code {white ${this.code}}!}`)
    }

    getInfo() {
        return {
            code: this.code,
            currentQuiz: this.currentQuiz,
            isQuizActive: this.isQuizActive,
            isHostPresent: this.host != null,
            players: this.players.map(player => player.name),
        }
    }
    
    sendInfo() {
        for(let player of this.players) {
            player.sendRoomInfo()
        }

        if(this.host) this.host.sendRoomInfo()
    }

    connectHost(socket, message) {
        console.log(message)
        this.currentQuiz = message.quiz
        this.host = new Host(this, socket)
        
        this.sendInfo()

        console.log(chalk`{green +} {grey {white host} connected to room {blue ${this.code}}}`)

        socket.once('close', () => this.removeHost())
    }

    connectPlayer(socket, message) {
        let name = message.name

        if(!name || this.players.find(player => player.name == name)) {
            let p1 = pick(colors).color
            let p2 = pick(animals)

            name = `${p1} ${p2}`.toLowerCase()
        }

        let player = new Player(this, socket, name)
        this.players.push(player)

        this.sendInfo()

        console.log(chalk`{green +} {grey player {white ${name}} connected to room {blue ${this.code}}}`)
    }

    removeHost() {
        console.log(chalk`{red -} {grey {white host} disconnected from room {blue ${this.code}}}`)
        this.host = null
        this.currentQuiz = null
        this.isQuizActive = false

        this.sendInfo()
    }
    
    removePlayer(name) {
        console.log(chalk`{red - } {grey player {white ${name}} disconnected from room {blue ${this.code}}}`)
        this.players = this.players.filter(player => player.name != name)

        this.sendInfo()
    }

    startQuiz() {
        this.isQuizActive = true
        for(let player of this.players) {
            player.sendStartQuiz()
            player.sendRoomInfo()
        }

        this.host.sendRoomInfo()
    }

    endQuiz() {
        this.isQuizActive = false
        for(let player of this.players) {
            player.sendEndQuiz()
            player.sendRoomInfo()
        }

        this.host.sendRoomInfo()
    }

    submitAnswer(player, answer) {
        if(this.host) {
            this.host.submitAnswer(player, answer)
        } else {
            player.sendAnswerResponse(false)
        }
    }

    sendAnswerResponse(playerName, status, result) {
        let player = this.players.find(player => player.name == playerName)

        if(player) {
            player.sendAnswerResponse(status, result)
        } else {
            console.error(chalk`{red attempted to send an answer response to player {white ${playerName}} in room {white ${this.code}}} {blue (they might have disconnected?)}`)
        }
    }

    shutdown() {
        
    }
}

module.exports = Room;