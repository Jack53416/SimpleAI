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

    private isOneTurnPath(path: pathfinder.Path): boolean {
        if (this.hasFlag)
            return path.moveCost + 1.5 * path.nodes.length <= this.movesLeft;
        return path.moveCost <= this.movesLeft;
    }

    private isInView(target: Location): boolean {
        return this.position.manhattanDist(target) <= this.viewRange;
    }

    private handleOtherPlayer(world: GameMap, enemy: Player): MoveDirections {
        if (!enemy)
            return MoveDirections.NO_MOVE;

        if (this.isInView(enemy.position) && enemy.isAlive) {
            let pathEnemy = pathfinder.findPath(world, this.position, enemy.position);
            if (this.isOneTurnPath(pathEnemy)) {
                return this.position.getDirection(pathEnemy.nodes[1]);
            }
        }
        return MoveDirections.NO_MOVE;
    }

    public move(world: GameMap, flagPosition: Location, enemy: Player): MoveDirections {
        let targetPosition: Location = this.hasFlag ? this.basePosition : flagPosition;
        let res: pathfinder.Path = pathfinder.findPath(world, this.position, targetPosition);
        let bestMove = res.nodes[1];
        let moveCost = this.hasFlag ? world.getTerrainCost(bestMove) + 1.5 : world.getTerrainCost(bestMove);
        //console.log(`next move: ${this.position.getDirection(bestMove)}\r\ncost:${moveCost}\r\npointsAvaliable:${this.movesLeft} `);

        let moveToEnemy: MoveDirections = this.handleOtherPlayer(world, enemy);
        if (moveToEnemy != MoveDirections.NO_MOVE)
            return moveToEnemy;

        if (moveCost > this.movesLeft)
            return MoveDirections.NO_MOVE;
        return this.position.getDirection(bestMove);
    }
}