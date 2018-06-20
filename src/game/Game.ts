import Player from './Player';
import GameMap from './GameMap';
import Connection from './Connection';
import Location from './Location';
import { MoveDirections } from "./enums";
import { GameMapDto } from '../common/GameMapDto';
import { MoveRequest } from '../communication/serverRequests';
import { table } from 'table';
import * as readline from 'readline';
import chalk from 'chalk';

export default class Game{
    private world: GameMap;
    private player: Player;
    private enemy: Player;
    private flagPosition: Location;
    private connection: Connection;
    private readonly url: string;
    private pId: number;
    private pName: string = 'razor1911';
    private keyMap: Map<string, MoveDirections>;
    private manualPlay: boolean;
    private debugMode: boolean;

    constructor(url: string = 'ws://localhost:8000', manualPlay?: boolean) {
        this.url = url;
        this.world = null;
        this.player = null;
        this.enemy = null;
        this.flagPosition = new Location();
        this.manualPlay = manualPlay != undefined ? manualPlay : false;
        this.initConnection();

        this.keyMap = new Map();
        this.keyMap.set('w', MoveDirections.UP);
        this.keyMap.set('s', MoveDirections.DOWN);
        this.keyMap.set('a', MoveDirections.LEFT);
        this.keyMap.set('d', MoveDirections.RIGHT);
        this.keyMap.set('z', MoveDirections.NO_MOVE);
        this.keyMap.set('p', MoveDirections.AUTOMATIC);
        if (this.manualPlay)
            this.playManually();
    }

    private initConnection() {
        let that = this;
        this.connection = new Connection(this.url,
            (e) => that.connection.sendPlayerInfo(that.pName),
            (connectResp) => {
                console.log(`Connected \r\n${JSON.stringify(connectResp)}`);
                that.pId = connectResp.playerId;
            },
            (moveReq) => {
                console.log(`Move request!`);
                try {
                    this.makeMove(moveReq);
                }
                catch (err) {
                    console.log(chalk.redBright(`Error occured: ${err}\r\n${err.stack}`));
                    this.connection.sendMove(this.player.id, MoveDirections.NO_MOVE);
                }
            },
            (e) => {
                console.log(`Game Over: ${JSON.stringify(e)}`);
                this.clearCaschedData();
            }
        );
    }

    private clearCaschedData() {
        this.world = null;
        this.player = null;
        this.enemy = null;

    }

    private makeMove(moveReq: MoveRequest) {
        let playerDto = moveReq.players.filter((el) => el.id == this.pId)[0];
        moveReq.players.splice(moveReq.players.indexOf(playerDto), 1);
        let enemyDto = moveReq.players.pop(); // TO DO: more enemies !

        if (!this.world) {
            this.world = new GameMap(moveReq.map.height, moveReq.map.width);
        }

        if (!this.player) {
            this.player = new Player(playerDto);
        }

        if (!this.enemy) {
            this.enemy = new Player(playerDto);
        }

        this.world.updateMap(moveReq.map);
        this.flagPosition.x = moveReq.flag.x;
        this.flagPosition.y = moveReq.flag.y;
        this.player.updateData(playerDto);
        if (enemyDto) {
            this.enemy.updateData(enemyDto);
            this.enemy.isVisible = true;
            if (this.player.position.equals(this.enemy.position))
                this.enemy.isAlive = false;
        }
        else {
            this.enemy.isVisible = false;
        }

        if (this.manualPlay)
            this.displayDebugInfo();
        else
            this.connection.sendMove(this.player.id, this.player.move(this.world, this.flagPosition, this.enemy));
    }

    private displayDebugInfo() {
        console.log(`Player : ${JSON.stringify(this.player.getDto())}`);

        let map: string[][] = this.world.printMap();
        map[this.player.basePosition.y][this.player.basePosition.x] = '$';
        map[this.player.position.y][this.player.position.x] = `\x1b[36mP\x1b[0m`;
        map[this.flagPosition.y][this.flagPosition.x] = 'F';
        if (this.enemy && this.enemy.isAlive) {
            if (this.enemy.isVisible)
                map[this.enemy.position.y][this.enemy.position.x] = chalk.redBright('E');
            else map[this.enemy.position.y][this.enemy.position.x] = chalk.red('~E~');

            console.log(`Enemy: ${JSON.stringify(this.enemy.getDto())}`)
        }
        console.log(table(map));
    }

    public playManually() {
        let that = this;
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.on('keypress', (str, key) => {

            if (key.ctrl && key.name == 'c') {
                process.exit();
            } else if (that.keyMap.has(str)) {
                console.log("keyPressed");
                try {
                    if (that.keyMap.get(str) == MoveDirections.AUTOMATIC)
                        that.connection.sendMove(that.player.id, that.player.move(that.world, that.flagPosition, this.enemy));
                    else
                        that.connection.sendMove(that.player.id, that.keyMap.get(str));
                }
                catch (err) {
                    console.error(chalk.redBright("Invalid game session, uknown player location"));
                }
            }

        });
    }

    public start() {

    }

    public abort() {

    }
    
}