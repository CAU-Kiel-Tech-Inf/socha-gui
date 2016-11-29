///  <reference path="../node_modules/babylonjs/babylon.d.ts" />
import {Replay, FIELDTYPE, Tile, GameState, Field, Board} from "./Replay";
import {Helpers} from "./Helpers";

export class Viewer{
    replay: Replay;
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene:  BABYLON.Scene;
    camera: BABYLON.ArcRotateCamera;

    debug: HTMLDivElement;

    fields: {[position: string]:VisibleField} = {};

    constructor(replay: Replay, element: Element, document: Document, window: Window){
        //Save replay for later
        this.replay = replay;
        //Initialize engine
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('viewerCanvas');
        this.debug = document.createElement('div');
        this.debug.classList.add('debug');
        element.appendChild(this.canvas);
        element.appendChild(this.debug);
        this.engine = new BABYLON.Engine(this.canvas, true);
        //Initialize scene
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera('camera1',Math.PI, Math.PI, 10,new BABYLON.Vector3(0,0,0),this.scene);
        this.camera.attachControl(this.canvas, false);
        this.camera.setPosition(new BABYLON.Vector3(3,3,15));
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0),this.scene);
        var sphere = BABYLON.Mesh.CreateSphere('sphere1',6,2,this.scene);
        sphere.position.y = 1;
        var cyl = BABYLON.Mesh.CreateCylinder('cyl',1.5,1.5,1.5,6,1,this.scene, false,BABYLON.Mesh.DEFAULTSIDE);
        cyl.position.x = 0.7;
        var ground = BABYLON.Mesh.CreateGround('ground1', 400,400,1,this.scene);
        var groundmaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);
        groundmaterial.diffuseColor = new BABYLON.Color3(0.1,0.1,0.2);
        groundmaterial.specularColor = new BABYLON.Color3(1,1,1);
        ground.material = groundmaterial;
        this.camera.beta  =  0;//0.72;
        this.engine.runRenderLoop(() =>{
            this.scene.render();
            this.camera.alpha += 0.003;
            this.debug.innerText = "α: " + this.camera.alpha.toString() + ", β: " + this.camera.beta.toString();
        });
        window.addEventListener('resize', () => {
            this.engine.resize();
        })
        this.renderBoard(replay.states[10].board);
    }

    getCenterOfBoard(board: Board):[number,number]{
        let x: number, y: number;
        let tiles: number;
        for(let t of board.tiles){
            if(t.visible){
                x += t.center_x;
                y += t.center_y;
            }
        }
        x /= board.tiles.length;
        y /= board.tiles.length;
        return [x,y];
    }

    renderBoard(board: Board){
        console.log("Rendering board with " + board.tiles.length.toString() + " tiles");
        for(let t of board.tiles){
            console.log("Tile " + t.index.toString() + " has " + t.fields.length.toString() + " fields");
            for(let f of t.fields){
                if(this.fields[f.toString()] && !t.visible){
                    this.fields[f.toString()].sink();
                }else if (t.visible){
                    this.fields[f.toString()] = new VisibleField(f,this.scene);
                }
            }
        }
        let [x,y] = this.getCenterOfBoard(board);
        //this.camera.setPosition(new BABYLON.Vector3(x,y,15));
    }


}

class Grid {
    public static getCoordinates(x: number, y:number, size:number){
        /*Next we want to put several hexagons together. 
        In the horizontal orientation, the height of a hexagon is height = size * 2. 
        The vertical distance between adjacent hexes is vert = height * 3/4.
        The width of a hexagon is width = sqrt(3)/2 * height. 
        The horizontal distance between adjacent hexes is horiz = width. */
        let spacer = 0.2;
        size += spacer;
        let width = size * 2;
        let px = x * (width * 3/2) + (3/4 * width * (1- (y % 2)));
        let height = Math.sqrt(3) * width / 2;
        let py = y * height / 2;
        //let px = (x * ((width / 2) + (width * 3/4))) - (width / 2 * (y % 2));
        //let py = y * height;
        return [px, py];
    }
}

/*
    This is very preliminary, it's probably better to create Textured Materials while loading the replay
*/
class FieldTypeMaterialFactory{
    private static fieldMap: {[type: string]: BABYLON.Material} = {};
    public static getMaterialForFieldType(f: FIELDTYPE, scene: BABYLON.Scene):BABYLON.Material{
        if(FieldTypeMaterialFactory.fieldMap[f.toString()]){
            return FieldTypeMaterialFactory.fieldMap[f.toString()];
        }else{
            switch(f){
                case FIELDTYPE.WATER:
                     var m = new BABYLON.StandardMaterial(f.toString(),scene);
                     m.diffuseColor = new BABYLON.Color3(0.1,0.1,0.5);
                     m.specularColor = new BABYLON.Color3(0.2,0.2,1);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.LOG:
                     var m = new BABYLON.StandardMaterial(f.toString(),scene);
                     m.diffuseColor = new BABYLON.Color3(0.6,0.1,0.5);
                     m.specularColor = new BABYLON.Color3(1,0.5,0.1);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.BLOCKED:
                     var m = new BABYLON.StandardMaterial(f.toString(),scene);
                     m.diffuseColor = new BABYLON.Color3(1,0.5,0.1);
                     m.specularColor = new BABYLON.Color3(1,0.5,0.4);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                 case FIELDTYPE.SANDBANK:
                     var m = new BABYLON.StandardMaterial(f.toString(),scene);
                     m.diffuseColor = new BABYLON.Color3(229/255,224/255,197/255);
                     m.specularColor = new BABYLON.Color3(1,1,1);
                     FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                case FIELDTYPE.GOAL:
                    var m = new BABYLON.StandardMaterial(f.toString(),scene);
                    m.diffuseColor = new BABYLON.Color3(0,1,0);
                    m.specularColor = new BABYLON.Color3(0.5,1,0.5);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                //All passengers
                default:
                    var m = new BABYLON.StandardMaterial(f.toString(),scene);
                    m.diffuseColor = new BABYLON.Color3(0,1,1);
                    m.specularColor = new BABYLON.Color3(0.5,1,1);
                    FieldTypeMaterialFactory.fieldMap[f.toString()] = m;
                break;
                

            }
            return FieldTypeMaterialFactory.fieldMap[f.toString()];
        }
    }
}

class VisibleField extends Field{
    /*
    Okay, so I could derive this class from Field, but I haven't figured out how to do factory methods
    */
    public field: Field;
    public mesh: BABYLON.Mesh;
    constructor(field: Field, scene: BABYLON.Scene){
        super(field.type,field.x,field.y, field.points);
        this.mesh = BABYLON.Mesh.CreateCylinder(this.toString(),4,3,3,6,1,scene,false,BABYLON.Mesh.DEFAULTSIDE);
        [this.mesh.position.x, this.mesh.position.z] = Grid.getCoordinates(this.x, this.y, 3/2);
        //this.mesh.rotation.y = Math.PI / 2;
        this.mesh.material = FieldTypeMaterialFactory.getMaterialForFieldType(this.type,scene);
    }

    public sink(){
        this.mesh.position.y = -10;
    }
}