let socket = null

document.addEventListener('DOMContentLoaded', () => {
    socket = new WebSocket('ws://dev.cesque.com:3000')

    let app = new Vue({
        el: '.app',
        data: {
            name: '',
            connected: false,
            roomCode: '',
            room: {},
            answer: '',
            isQuizActive: false,
        },
        watch: {
            answer: function(text) {
                socket.send(JSON.stringify({
                    type: 'submit answer',
                    answer: text,
                }))
            }
        },
        methods: {
            connect: function() {
                socket.send(JSON.stringify({
                    type: 'connect',
                    user: 'player',
                    roomCode: this.roomCode,
                }))

                socket.addEventListener('message', message => {
                    let data = JSON.parse(message.data)
                    
                    switch(data.type) {
                        case 'room info': this.receiveRoomInfo(data); break
                        case 'quiz start': this.receiveQuizStart(data); break
                        case 'quiz end': this.receiveQuizEnd(data); break
                        case 'answer response': this.receiveAnswerResponse(data); break
                        default: console.log(`received unknown message type ${data.type}?`)
                            console.log(data)
                            break
                    }
                })
            },
            receiveRoomInfo(data) {
                console.log(data)
                this.connected = true

                this.name = data.name

                this.isQuizActive = data.isQuizActive

                this.room = {
                    code: data.code,
                    currentQuiz: data.currentQuiz,
                    isHostPresent: data.isHostPresent,
                    players: data.players,
                    isQuizActive: data.isQuizActive,
                }
            },
            receiveQuizStart(data) {
                console.log('quiz start', data)
                this.isQuizActive = true
            },
            receiveQuizEnd(data) {
                console.log('quiz end', data)
                this.isQuizActive = false
            },
            receiveAnswerResponse(data) {
                console.log('answer response', data)

                if(data.status && data.result) {
                    this.answer = ''
                }
            },
        }
    }) 
})
