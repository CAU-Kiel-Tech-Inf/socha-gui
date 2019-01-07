import { GameState, Move, PLAYERCOLOR } from '../rules/CurrentGame'
import { GameClient } from './LiveGame'
import { GenericPlayer } from './PlayerClient'

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
    //this.on('error', error => dialog.showErrorBox("Fehler menschlicher Spieler", error));
  }

  handleMoveRequest = async function() {
    Logger.getLogger().log('HumanClient', 'handleMoveRequest', 'handling move request')
    console.log('move request for game', this.gameId)

    AsyncApi.lodgeActionRequest(this.gameId, this.state.clone(), (move: Move) => {
      let xml: string = '<room roomId="' + this.roomId + '">' +
        '<data class="move" x="' + move.fromField.x + '" y="' + move.fromField.y + '" direction="' + move.direction + '">' +
        '</data></room>'
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
