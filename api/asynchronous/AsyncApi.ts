import { isUndefined } from 'util';
import { Server } from './Server';
import { GameState, PLAYERCOLOR, Action } from '../rules/HaseUndIgel';
import { AsyncGameManager } from './AsyncGameManager';
import { UIHint } from '../rules/UIHint';
import { ActionMethod } from '../rules/ActionMethod';

export class AsyncApi {
  private static server: Server;
  private static asyncGameManager: AsyncGameManager;

  private static actionRequests: Map<string, Map<number, ActionRequest>> = new Map<string, Map<number, ActionRequest>>();
  private static nextKey: number = 0;

  public static getServer(): Server {
    if (!AsyncApi.server) {
      AsyncApi.server = new Server(true);
    }
    return AsyncApi.server;
  }

  public static getAsyncGameManager(): AsyncGameManager {
    if (!this.asyncGameManager) {
      this.asyncGameManager = new AsyncGameManager();
    }
    return this.asyncGameManager;
  }

  public static hasActionRequest(gameName: string): boolean {
    console.log(`${gameName} has Request ID ${[...this.actionRequests.get(gameName).keys()].join(',')}`);
    return this.actionRequests.has(gameName) && this.actionRequests.get(gameName).size > 0;
  }

  public static getActionRequest(gameName: string): [number, ActionRequest] {
    return this.actionRequests.get(gameName).entries().next().value;
  }

  public static redeemActionRequest(gameName: string, id: number, method: ActionMethod, action?: Action) {
    console.log(`redeemActionRequest for game ${gameName}, id ${id}, map: `, this.actionRequests.get(gameName))
    let request = this.actionRequests.get(gameName).get(id)
    if (isUndefined(request)) {
      console.log(`found no request for id ${id}, map was`, this.actionRequests.get(gameName))
    }
    request.callback(method, action);//Handle things on the client side
    this.actionRequests.get(gameName).delete(id);//Remove request from list
  }

  public static lodgeActionRequest(gameName: string, state: GameState, color: PLAYERCOLOR, isFirstAction: boolean, uiHints: UIHint[], callback: (method: ActionMethod, action?: Action) => void) {
    if (!this.actionRequests.has(gameName)) {
      this.actionRequests.set(gameName, new Map<number, ActionRequest>());
    }

    this.actionRequests.get(gameName).set(this.nextKey, {
      state: state,
      color: color,
      isFirstAction: isFirstAction,
      uiHints: uiHints,
      callback: callback
    });
    this.nextKey++;
  }

}

interface ActionRequest {
  state: GameState,
  color: PLAYERCOLOR,
  isFirstAction: boolean,
  uiHints: UIHint[],
  callback: (method: "action" | "cancel" | "send", action?: Action) => void
}