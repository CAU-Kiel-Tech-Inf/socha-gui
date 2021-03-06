import { GameState, Move, PLAYERCOLOR } from '../rules/CurrentGame'
import { GameClient }                   from './LiveGame'
import { GenericPlayer }                from './PlayerClient'

import { AsyncApi } from './AsyncApi'

import { Logger } from '../Logger'

//const dialog = remote.dialog;

export class HumanClient extends GenericPlayer implements GameClient {
  color: PLAYERCOLOR
  private state: GameState
  private reservation: string
  private roomId: string
  private gameId: number

  constructor(host: string, port: number, name: string, reservation: string, gameId: number) {
    super(host, port, name)
    this.reservation = reservation
    this.gameId = gameId
    this.on('welcome', welcomeMessage => {
      Logger.getLogger().log('HumanClient', 'welcome', name + ` got welcome message: ${JSON.stringify(welcomeMessage, null, 4)}`)
      this.color = welcomeMessage.mycolor
      this.roomId = welcomeMessage.roomId
    })
    this.on('moverequest', this.handleMoveRequest)
    this.on('state', s => this.state = s)
    this.on('error', error => {
      Logger.getLogger().log('HumanClient', 'Message-Handler', 'Fehler menschlicher Spieler')
    })
  }

  handleMoveRequest = async function() {
    Logger.getLogger().log('HumanClient', 'handleMoveRequest', 'handling move request')
    console.log('move request for game', this.gameId)

    AsyncApi.lodgeActionRequest(this.gameId, this.state.clone(), (move: Move) => {
      var xml: string = '<room roomId="' + this.roomId + '">'
      if (move.moveType == 'DRAG') {
        xml = xml +
          '<data class="dragmove">' +
          '<start x="' + move.fromField.q + '" y="' + move.fromField.r + '" z="' + move.fromField.s + '"/>' +
          '<destination x="' + move.toField.q + '" y="' + move.toField.r + '" z="' + move.toField.s + '"/>'
      } else if (move.moveType == 'SET') {
        xml = xml +
          '<data class="setmove">' +
          '<piece owner="' + this.state.currentPlayerColor + '" type="' + move.undeployedPiece + '" />' +
          '<destination x="' + move.toField.q + '" y="' + move.toField.r + '" z="' + move.toField.s + '"/>'
      } else if (move.moveType == 'SKIP') {
        xml = xml + '<data class="skipmove">'
      } else {
        throw 'Unexpected MoveType'
      }
      xml = xml + '</data></room>'
      Logger.getLogger().log('HumanClient', 'handleMoveRequest', 'Sending move ' + xml)
      this.writeData(xml)
    })
  }

  start(): Promise<any> {
    Logger.getLogger().log('HumanClient', 'start', 'Human player starting')
    return this.joinPrepared(this.reservation)
  }

  stop() {
    const stop = async function() {
      Logger.getLogger().log('HumanClient', 'stop', 'Human player stopped')
    }.bind(this)
    return stop()
  }
}