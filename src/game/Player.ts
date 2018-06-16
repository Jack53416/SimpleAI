import { PlayerDto } from '../common/PlayerDto';
import GameMap from './GameMap';
import Location from './Location';
import { MoveDirections } from './enums';
import * as pathfinder from './Pathfinder';

export default class Player {
    public readonly id: number;
    public hasFlag: boolean;
    public isAlive: boolean;

    private readonly name: string;
    private readonly maxMovesPerRound: number;
    public readonly basePosition: Location;
    private readonly viewRange: number;

    private movesLeft: number;
    public position: Location;
    
    private moveHistory: Location[];

    constructor(playerDto: PlayerDto) {
        this.id = playerDto.id;
        this.name = playerDto.name;
        this.hasFlag = playerDto.hasFlag;
        this.isAlive = playerDto.isAlive;
        this.maxMovesPerRound = playerDto.maxMovesPerRound;
        this.basePosition = new Location(playerDto.basePosition.x, playerDto.basePosition.y);
        this.viewRange = playerDto.viewRange;
        this.movesLeft = playerDto.movesLeft;
        this.position = new Location(playerDto.x, playerDto.y);
        this.moveHistory = [];
    }

    public updateData(playerDto: PlayerDto) {
        this.hasFlag = playerDto.hasFlag;
        this.isAlive = playerDto.isAlive;
        this.movesLeft = playerDto.movesLeft;
        this.position.x = playerDto.x;
        this.position.y = playerDto.y;
        delete this.position.parent;
    }

    public getDto(): PlayerDto {
        return {
            id: this.id,
            hasFlag: this.hasFlag,
            isAlive: this.isAlive,
            name: this.name,
            maxMovesPerRound: this.maxMovesPerRound,
            basePosition: {
                x: this.basePosition.x,
                y: this.basePosition.y
            },

            viewRange: this.viewRange,
            movesLeft: this.movesLeft,
            x: this.position.x,
            y: this.position.y
        };
    }

    move(world: GameMap, flagPositon: Location) {
        let target = this.hasFlag ? this.basePosition : flagPositon;
        let pathDescr = pathfinder.find(this.position, target, world);

        if (this.hasFlag)
            pathDescr.firstDirectionCost += 1.5;
        console.log(`next move: ${pathDescr.firstDirection}\r\ncost:${pathDescr.firstDirectionCost}\r\npointsAvaliable:${this.movesLeft} `);

        if (pathDescr.firstDirectionCost > this.movesLeft)
            return MoveDirections.NO_MOVE;
        return pathDescr.firstDirection;
    }
}