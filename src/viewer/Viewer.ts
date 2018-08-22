import { PiranhasEngine } from './Engine/PiranhasEngine';
import { Helpers } from "./Helpers";
import { Player, GameResult, Coordinates, Direction, Move, GameRuleLogic, GameState, Board, RenderState, UiState, SelectFish, SelectTargetDirection, FinishMove, None, InteractionEvent, FieldSelected } from '../api/rules/CurrentGame';
import { Logger } from '../api/Logger';

export class Viewer {
  //DOM Elements
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  debug: HTMLDivElement;

  //Engine
  engine: PiranhasEngine;
  startup_timestamp: number;

  //Rendering

  private rerenderControlActive: boolean;
  private endScreen: HTMLDivElement = null;
  private currentMove: number = 0;
  // the last rendered state (i.e. what is currently displayed)
  private currentState: RenderState;

  constructor() {
    //Initialize container
    this.element = document.createElement('div');
    this.element.classList.add('viewer-container');
    window.addEventListener('resize', this.resize.bind(this));
    //Take time measurement for later performance analysis
    this.startup_timestamp = performance.now();

    //Initialize engine
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('viewerCanvas');
    this.element.appendChild(this.canvas);

    this.engine = new PiranhasEngine(this.canvas);
  }

  resize() {
    /*
    this.canvas.setAttribute('width', this.element.clientWidth.toString());
    this.canvas.setAttribute('height', this.element.clientHeight.toString());
    */
    this.canvas.setAttribute('width', '800');
    this.canvas.setAttribute('height', '800');
    if (this.engine) {
      this.engine.resize();
    }
    /*
    if (this.tempstate) {
      this.render(this.tempstate);
    }
    */
  }

  getElement() {
    return this.element;
  }

  dock(element: Element) {
    element.appendChild(this.element);
    window.requestAnimationFrame(this.resize.bind(this));
  }

  undock() {
    this.engine.clearUI()
  }

  render(state: RenderState) {
    if (this.engine == null) {
      return;
    }
    if (this.currentState && this.currentState.equals(state)) {
      console.log("should render same state, doing nothing")
      return
    } else {
      console.log("rendering new state", {ui: state.uiState, turn: state.gameState.turn})
    }

    this.engine.clearUI();

    if (state.gameState.lastMove &&
        this.currentState &&
//        !this.engine.animating() &&
        (state.gameState.turn === this.currentState.gameState.turn + 1) &&
        this.engine.scene.boardEqualsView(this.currentState.gameState.board)) {
      this.engine.animateMove(this.currentState.gameState, state.gameState.lastMove);
      this.currentState = state
    } else {
      this.engine.finishAnimations();
      this.engine.scene.tweens.killAll()
      this.engine.draw(state);
      this.currentState = state
    }
  }

  // user interacted somehow
  userHasInteracted(state: GameState, actions: InteractionEvent[], move_callback: (move: Move) => void, interaction: InteractionEvent) {
    actions = actions.concat(interaction);
    if (interaction == 'cancelled') {
      // remove all interactions and request new input
      this.requestUserInteraction(state, [], move_callback);
    } else if (actions.length == 2) {
      // create move and send it
      let move = this.interactionsToMove(actions)
      move_callback(move);
    } else {
      // we need more input to get a complete move
      this.requestUserInteraction(state, actions, move_callback);
    }
  }

  fieldsToDirection(fromField: Coordinates, toField: Coordinates):Direction {
    if (fromField.x == toField.x) {
      if (fromField.y > toField.y) {
        return "DOWN"
      } else if (fromField.y < toField.y) {
        return "UP"
      }
    } else if (fromField.y == toField.y) {
      if (fromField.x > toField.x) {
        return "LEFT"
      } else if (fromField.x < toField.x) {
        return "RIGHT"
      }
    } else {
      if (fromField.x > toField.x) {
        if (fromField.y > toField.y) {
          return "DOWN_LEFT"
        } else {
          return "UP_LEFT"
        }
      } else if (fromField.x < toField.x) {
        if (fromField.y > toField.y) {
          return "DOWN_RIGHT"
        } else {
          return "UP_RIGHT"
        }
      }
    }
  }

  // NOTE that currentPlayerIndex is only required for the advance action (which will always be the first action of a move)
  interactionsToMove(interactions: InteractionEvent[]): Move {
    let fromField = interactions[0];
    let toField = interactions[1];
    if (fromField instanceof FieldSelected && toField instanceof FieldSelected) {
      return new Move(fromField.coordinates, this.fieldsToDirection(fromField.coordinates, toField.coordinates))
    } else {
      throw "got illegal list of interactions to create a move"
    }
  }

  // modifies the gamestate so that interactions are reflected
  applyInteractions(gameState: GameState, actions: InteractionEvent[]): GameState {
    return gameState; // there are no steps between full moves in this game
  }

  // initialize ui to show the user where interaction is possible
  requestUserInteraction(state: GameState, actions: InteractionEvent[], move_callback: (move: Move) => void) {

    // figure out which interactions are currently needed and put them into uistate
    let shouldSelectFish: boolean = actions.length == 0;
    let shouldSelectTarget: boolean = actions.length == 1;
    let cancellable: boolean = shouldSelectTarget;
    let modified_gamestate = this.applyInteractions(state, actions);

    var uiState: UiState
    if (shouldSelectFish) {
      let ownFishFields = state.board.fields.map((col, x) => {
        return col.map((field, y) => {
          if (field == GameRuleLogic.playerFieldType(state.currentPlayerColor)) {
            return {x: x, y: y};
          } else {
            return null;
          }
        })
      }).reduce((a, c) => a.concat(c)).filter(e => e != null)
      uiState = new SelectFish(ownFishFields);
    } else if (shouldSelectTarget) {
      let firstAction = actions[0];
      if (firstAction instanceof FieldSelected) {
        let fish = firstAction.coordinates;
        let possibleMoves = GameRuleLogic.possibleMoves(modified_gamestate.board, fish);
        uiState = new SelectTargetDirection(
          fish,
          possibleMoves.map(m => ({ direction: m.direction, target: GameRuleLogic.moveTarget(m, state.board) }))
        )
      } else {
        throw "first action was not of type FieldSelected"
      }
    } else {
      throw "we should not interact at all"
    }
    // render gamestate with interactions
    this.render(new RenderState(modified_gamestate, uiState));
    // keep original gamestate in callback
    this.engine.interact((interaction) => this.userHasInteracted(state, actions, move_callback, interaction));
  }

  stop() {
    this.engine.cancelInteractions();
  }

  showEndscreen(result: GameResult) {
    console.log("Showing Endscreen for GameResult", result)
    if (this.endScreen === null) {
      this.endScreen = document.createElement('div');
      this.endScreen.classList.add('endscreen');
      this.element.appendChild(this.endScreen);
    }
    this.endScreen.innerHTML = "<h1>Spiel vorbei</h1>"+
      "<h2>"+result.reason+"</h2>"+
      (result.winner ?
      "<h3>Gewinner: "+result.winner.displayName+" ("+(result.winner.color == Player.COLOR.RED ? "Rot" : "Blau")+")</h3>" :
      "<h3>Unentschieden!</h3>");
    this.endScreen.setAttribute('style', "opacity: 1.0; display: block");
  }

  hideEndscreen() {
    if (this.endScreen) {
      this.endScreen.setAttribute('style', "opacity: 0.0; display: none");
    }
  }
}