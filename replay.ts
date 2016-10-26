namespace Replay{

/**
 * Represents the parsed data from an xml replay
 */
class Replay{
    public replayName: string;
    public states: GameState[];
    /**
     * Initializes the Replay from a URL and calls the callback once done
     */
    constructor(url: string, callback: (replay: Replay) => void){
        this.replayName = /\/(\w+)\./.exec(url)[1]; //Extract replay name from url
        Helpers.ajax(url,(replay: string) =>{//Get replay by ajax
            var parser = new DOMParser();//Parse to xml DOM tree
            var xml = parser.parseFromString(replay,"text/xml");
            var stateQuery = xml.getElementsByTagName("state");
            for(var i = 0; i < stateQuery.length; i++){//Iterate through all state nodes
                let g: GameState = new GameState();
                g.turn = parseInt(stateQuery[i].getAttribute("turn"));
                g.startPlayer = stateQuery[i].getAttribute("startPlayer") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
                g.currentPlayer = stateQuery[i].getAttribute("currentPlayer") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
                g.freeTurn = stateQuery[i].getAttribute("freeTurn") == "true";
                g.red = new Player(stateQuery[i].getElementsByTagName("red")[0]);
                g.blue = new Player(stateQuery[i].getElementsByTagName("blue")[0]);
                this.states.push(g);
            }
        });
    }
}

const enum FIELDTYPE{
    WATER = 0,
    LOG,
    BLOCKED,
    PASSENGER1,
    PASSENGER2,
    PASSENGER3,
    PASSENGER4,
    SANDBANK,
    GOAL
}

const enum DIRECTION{
    RIGHT,
    UP_RIGHT,
    UP_LEFT,
    LEFT,
    DOWN_LEFT,
    DOWN_RIGHT
}

const enum PLAYERCOLOR{
    RED = 0,
    BLUE
}

class Field{
    public type: FIELDTYPE;
    public x: number;
    public y: number;
    public points: number;
}

class Tile{
    public Fields: Field[];
    public visible: boolean;
    public index: number;
    public direction: number;
}

class Board{
    public Tiles: Tile[];
}

class Player{
    public displayName: string;
    public color: PLAYERCOLOR;
    public points: number;
    public x: number;
    public y: number;
    public direction: DIRECTION;
    public speed: number;
    public coal: number;
    public tile: number;
    public passenger: number;
    constructor(playerNode: Element){
        this.displayName = playerNode.getAttribute("displayName");
        this.color = playerNode.getAttribute("color") == "RED" ? PLAYERCOLOR.RED : PLAYERCOLOR.BLUE;
        this.points = parseInt(playerNode.getAttribute("points"));
        this.x = parseInt(playerNode.getAttribute("x"));
        this.y = parseInt(playerNode.getAttribute("y"));
        switch(playerNode.getAttribute("direction")){
            case "UP_LEFT": this.direction = DIRECTION.UP_LEFT; break;
            case "UP_RIGHT": this.direction = DIRECTION.UP_RIGHT; break;
            case "LEFT": this.direction = DIRECTION.LEFT; break;
            case "DOWN_LEFT": this.direction = DIRECTION.DOWN_LEFT; break;
            case "DOWN_RIGHT": this.direction = DIRECTION.UP_RIGHT; break;
            case "RIGHT": this.direction = DIRECTION.RIGHT; break;
            default: throw new RangeError("player direction was not parsable: " + this.direction);
        }
        this.speed = parseInt(playerNode.getAttribute("speed"));
        this.coal = parseInt(playerNode.getAttribute("coal"));
        this.tile = parseInt(playerNode.getAttribute("tile"));
        this.passenger = parseInt(playerNode.getAttribute("passenger"));
    }
}

class GameState{
    public red: Player;
    public blue: Player;
    public turn: number;
    public startPlayer: PLAYERCOLOR;
    public currentPlayer: PLAYERCOLOR;
    public freeTurn: boolean;
}



}