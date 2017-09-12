import { EventEmitter } from 'events';
import { GameState, GameResult } from './HaseUndIgel'
import { ConsoleMessage } from './Api';

export abstract class Game extends EventEmitter {

  name: string;
  gameStates: GameState[] = [];
  gameResult: GameResult;
  messages: ConsoleMessage[] = [];
  ready: Promise<void>;

  abstract getState(n: number): Promise<GameState>;

  constructor(name: string) {
    super();
    this.name = name;
  }

  getStateCount(): number {
    return this.gameStates.length;
  }
  getStateNumber(state: GameState): number {
    return this.gameStates.findIndex((s: GameState) => { return s.turn == state.turn; })
  }

  getMessages(): ConsoleMessage[] {
    return this.messages;
  }

  stateHasResult(stateNumber: number): boolean {
    return this.gameResult && (stateNumber == this.gameStates.length - 1)
  }
  getResult() {
    return this.gameResult;
  }

  isLastState(turn: number) {
    return turn == this.gameStates.length - 1;
  }

}
