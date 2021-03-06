///<references path="../../node_modules/@types/node/index.d.ts" />

import { GenericClient }                          from './GenericClient'
import { PlayerClientOptions }                    from './PlayerClient'
import { Parser }                                 from './Parser'
import { GAME_IDENTIFIER, GameResult, GameState } from '../rules/CurrentGame'
import { Logger }                                 from '../Logger'

const PASSPHRASE = 'examplepassword' // TODO read from server.properties file (in server directory)

export class ObserverClient extends GenericClient {
  log: string

  constructor(host: string, port: number) {
    super(host, port, true, 'Observer')
    this.log = ''
  }

  prepareRoom(player1: PlayerClientOptions, player2: PlayerClientOptions): Promise<RoomReservation> {
    return new Promise<RoomReservation>((resolve, reject) => {
      this.writeData(`
        <authenticate password="${PASSPHRASE}" />
        <prepare gameType="${GAME_IDENTIFIER}">
          <slot displayName="${player1.displayName}" canTimeout="${player1.canTimeout}" shouldBePaused="false"/>
          <slot displayName="${player2.displayName}" canTimeout="${player2.canTimeout}" shouldBePaused="false"/>
        </prepare>
      `, () => {
      })

      this.once('message', d => {
        d = d.toString() //Stringify buffer
        if (/\<prepared/.test(d.toString())) { //Check if it's actually a message something was prepared
          d = d.replace('<protocol>', '') //Strip unmatched protocol tag
          Parser.getJSONFromXML(d).then(res => {//Convert to JSON object
            res = res.prepared//strip outer tag
            resolve({//Resolve promise
              roomId:       res['$'].roomId,
              reservation1: res.reservation[0],
              reservation2: res.reservation[1],
            })
          })
        }
      })


    })
  }

  awaitJoinGameRoom(): Promise<string> {
    this.writeData(`<authenticate password="${PASSPHRASE}" />`, () => { })
    return new Promise((res, rej) => {
      let l = (m) => {
        m = m.toString()
        if (/joinedGameRoom/.test(m)) {
          this.removeListener('message', l)
          m = m.replace('<protocol>', '') //Strip unmatched protocol tag
          Parser.getJSONFromXML(m).then(result => {//Convert to JSON object
            let roomId = result.joinedGameRoom.$.roomId
            Logger.getLogger().log('ObserverClient', 'awaitJoinGameRoom', 'joined game room ' + roomId)
            res(roomId)
          })
        }
      }
      this.on('message', l)
    })
  }

  observeRoom(roomId: string): Promise<void> {
    return new Promise<void>((res, rej) => {
      this.writeData(`<observe roomId="${roomId}" password="${PASSPHRASE}" />`)//Send request
      this.once('message', d => {//Wait for answer
        d = d.toString() //Stringify buffer
        Parser.getJSONFromXML(d).then(ans => {
          if (ans.observed.$.roomId == roomId) {
            res()
          } else {
            rej(`Expected to observe room ${roomId} but got confirmation for room ${ans.observed.$.roomId}!`)
          }
        }).then(val => {
          this.on('message', async function(msg) {
            // this.emit('message', msg);
            const decoded = await Parser.getJSONFromXML(msg)
            if (decoded.room) {
              switch (decoded.room.data[0]['$'].class) {
                case 'memento':
                  const state = decoded.room.data[0].state[0]
                  if (state == null || typeof state == 'undefined') {
                    const ipc = require('electron').ipcRenderer
                    ipc.send('showErrorBox', 'Server antwortet nicht', 'Der Server hat eine ungültige Antwort gesendet, wahrscheinlich ist er gestorben...')
                  }
                  const gs = GameState.fromJSON(state)
                  this.emit('state', gs)
                  break
                case 'result':
                  const result = decoded.room.data[0]
                  const gr = GameResult.fromJSON(result)
                  this.emit('result', gr)
                  break
              }
            }
          })
        })
      })
    })
  }

  requestStep(roomId: string, forced: boolean = true): Promise<void> {
    Logger.getLogger().log('ObserverClient', 'requestStep', 'Requesting next step for room with id ' + roomId + '(forced=' + forced + ')')
    return new Promise<void>((res, rej) => {
      this.writeData(`<step roomId="${roomId}" forced="${forced}" />`)//Send request
      this.once('state', () => res()) //Wait for state
    })
  }

  setPaused(roomId: string, pause: boolean) {
    Logger.getLogger().log('ObserverClient', 'setPaused', `Setting room ${roomId} to ${pause ? 'paused' : 'unpaused'}`)
    this.writeData(`<pause roomId="${roomId}" pause="${pause}" />`)//Send request
  }

  setTimeoutEnabled(roomId: string, slot: 0 | 1, enabled: boolean) {
    Logger.getLogger()
      .log('ObserverClient', 'setTimeoutEnabled', `Setting timeout in ${roomId} and slot ${slot} to ${enabled ? 'enabled' : 'disabled'}`)
    this.writeData(`<timeout activate="${enabled}" roomId="${roomId}" slot="${slot}" />`)
  }

  cancelGame(roomId: string) {
    Logger.getLogger().log('ObserverClient', 'cancelGame', `Canceling game with room id ${roomId}.`)
    this.writeData(`<cancel roomId="${roomId}" />`)
  }
}

export interface RoomReservation {
  roomId: string;
  reservation1: string;
  reservation2: string;
}
