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
    private readonly url = "ws://localhost:8000";
    private pId: number;
    private pName: string = 'razor1911';
    private keyMap: Map<string, MoveDirections>;
    private manualPlay: boolean;

    constructor(manualPlay?: boolean) {
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
            (e) => {
                console.log(`Connected \r\n${JSON.stringify(e)}`);
                that.pId = e.playerId;
            },
            (e) => {
                console.log(`Move request!`);
                let playerDto = e.players.filter((el) => el.id == that.pId)[0];
                e.players.splice(e.players.indexOf(playerDto), 1);
                let enemyDto = e.players[0]; // TO DO: more enemies !

                if (!that.world) {
                    that.world = new GameMap(e.map.height, e.map.width);
                }

                if (!that.player) {
                    that.player = new Player(playerDto);
                }

                if (!that.enemy && enemyDto) {
                    that.enemy = new Player(enemyDto);
                }

                that.world.updateMap(e.map);
                that.flagPosition.x = e.flag.x;
                that.flagPosition.y = e.flag.y;
                that.player.updateData(playerDto);
                if (that.enemy && enemyDto)
                    that.enemy.updateData(enemyDto);
                if (that.manualPlay)
                    that.displayDebugInfo();
                else
                    that.connection.sendMove(that.player.id, that.player.move(that.world, that.flagPosition));
            },
            (e) => console.log('Game Over'),
            (e) => console.log('Game Error')
        );
    }

    private displayDebugInfo() {
        console.log(`Player : ${JSON.stringify(this.player.getDto())}`);

        let map: string[][] = this.world.printMap();
        map[this.player.basePosition.y][this.player.basePosition.x] = '$';
        map[this.player.position.y][this.player.position.x] = `\x1b[36mP\x1b[0m`;
        map[this.flagPosition.y][this.flagPosition.x] = 'F';
        if (this.enemy) {
            map[this.enemy.position.y][this.enemy.position.x] = chalk.redBright('E');
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
                if (that.keyMap.get(str) == MoveDirections.AUTOMATIC)
                    that.connection.sendMove(that.player.id, that.player.move(that.world, that.flagPosition));
                else
                    that.connection.sendMove(that.player.id, that.keyMap.get(str));
            }

        });
    }

    public start() {

    }

    public abort() {

    }
    
}