// ==UserScript==
// @name        sporcle multiplayer
// @namespace   Violentmonkey Scripts
// @match       https://www.sporcle.com/games/*
// @grant       none
// @version     1.0
// @author      -
// @description 2/19/2021, 2:59:35 PM
// ==/UserScript==

let overlay = document.createElement('div')
overlay.classList = 'sporcle-multiplayer__overlay'
overlay.innerHTML = `
    click to create room
`


let style1 = document.createElement('style')
style1.textContent = `
    .sporcle-multiplayer__overlay {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 9999999999;
        background: rgba(255, 255, 255, 0.9);
        font-weight: bold;
        color: #2c3e50;
        text-stroke: 3px solid white;
        font-family: monospace;
        padding: 20px;
        font-size: 2rem;
        text-transform: lowercase;
        cursor: pointer;
    }
`

let style2 = document.createElement('style')
style2.textContent = `
    .sporcle-multiplayer__overlay {
        position: fixed;
        top: 0;
        right: 0;
        pointer-events: none;
        z-index: 9999999999;
        background: rgba(255, 255, 255, 0.9);
        font-weight: bold;
        color: #2c3e50;
        text-stroke: 3px solid white;
        font-family: monospace;
        padding: 20px;
        font-size: 1.4rem;
        text-transform: lowercase;
        display: flex;
        flex-direction: column;
        align-items: right;
    }

    .sporcle-multiplayer__overlay h2 {
        font-size: 2rem;
        margin-bottom: 0
    }

    .sporcle-multiplayer__overlay p {
        margin: 4px;
        text-align: right;
    }

    .sporcle-multiplayer__overlay .code {
        color: #3498db;
    }
`

document.body.appendChild(overlay)
document.body.appendChild(style1)


let playButton = document.querySelector('#button-play')
let textInput = null

let answerQueue = []
let hasQuizStarted = false

const socket = new WebSocket('ws://localhost:3000')

let cookieRoomCode = getCookie('sporcle-multiplayer-room-code')

if(!cookieRoomCode) {
    overlay.addEventListener('click', () => {
        socket.send(JSON.stringify({
            type: 'connect',
            user: 'host',
            quiz: document.querySelector('#gameMeta h2').textContent,
        }))

        style1.remove()
        document.body.appendChild(style2)
        overlay.innerHTML =  `
            loading...
        `
    }, { once: true })
}

socket.addEventListener('open', event => {
    console.log('socket opened')

    if(cookieRoomCode) {
        socket.send(JSON.stringify({
            type: 'connect',
            user: 'host',
            roomCode: cookieRoomCode,
            quiz: document.querySelector('#gameMeta h2').textContent,
        }))

        style1.remove()
        document.body.appendChild(style2)
    }

    playButton.addEventListener('click', event => {
        socket.send(JSON.stringify({
            type: 'quiz start',
        }))

        hasQuizStarted = true

        let interval = setInterval(() => {
            if(!inProgress) {
                socket.send(JSON.stringify({
                    type: 'quiz end'
                }))
                clearInterval(interval)
            }
        }, 333)
    })

    socket.addEventListener('message', message => {
        message = JSON.parse(message.data)

        switch(message.type) {
            case 'submit answer': submitAnswer(message, socket); break
            case 'room info': receiveRoomInfo(message, socket); break
            default: console.error(`received unknown message type ${message.type}`, message)
        }
    })
})

function receiveRoomInfo(message, socket) {
    console.log(message)
    setCookie('sporcle-multiplayer-room-code', message.code)

    overlay.innerHTML = `
        <h2>code: <span class="code">${message.code}</span></h2>
        <p>players: <span class="code">${message.players.length}</span></p>
    `
}

let answerQueueIntervalReference = null
function processAnswerQueue() {
    if(answerQueue.length) {
        let current = answerQueue.shift()
        let message = current.message
        let socket = current.socket
        console.log(message)

        textInput = document.querySelector('#gameinput')

        if(!textInput) {
            socket.send(JSON.stringify({
                type: 'quiz end',
            }))

            answerQueue = []

            return
        }

        let value = textInput.value
        let cursorPosition = [
            textInput.selectionStart,
            textInput.selectionEnd,
            textInput.selectionDirection,
        ]

        textInput.value = message.answer
        window.checkGameInput(textInput)

        if(textInput.value == '') {
            // answer correct
            socket.send(JSON.stringify({
                type: 'answer response',
                player: message.player,
                status: true,
                result: true,
            }))
        } else {
            // answer not correct
            socket.send(JSON.stringify({
                type: 'answer response',
                player: message.player,
                status: true,
                result: false,
            }))
        }

        textInput.value = value
        textInput.setSelectionRange(...cursorPosition)
    }

    if(answerQueue.length == 0) {
        clearInterval(answerQueueIntervalReference)
        answerQueueIntervalReference = null
    }
}

function submitAnswer(message, socket) {
    if(!hasQuizStarted) return

    answerQueue.push({
        message, 
        socket,
    })

    if(!answerQueueIntervalReference) {
        answerQueueIntervalReference = setInterval(processAnswerQueue, 1)
    }
}
