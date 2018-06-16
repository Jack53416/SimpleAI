import { PlayerDto } from '../common/PlayerDto';
import GameMap from './GameMap';
import Location from './Location';
import { MoveDirections } from './enums';

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

    move(world: GameMap, targetPosition: Location) {
        this.moveHistory = [];
        this.position.cost = 0;
        this.moveHistory.push(this.position);
        if (this.hasFlag) {
            targetPosition = this.basePosition;
        }
        let possibleMoves: Location[] = this.position.expand(world.width, world.height);
        // assign cost
        possibleMoves.map((el: Location) =>  el.cost += el.dist(targetPosition) + 0.97 * world.getTerrainCost(el));

        while (true) {
            // choose min cost location
            let bestMove: Location = possibleMoves.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
            this.moveHistory.push(bestMove);
            if (bestMove.equals(targetPosition))
                break;
            // expand
            let bestIdx = possibleMoves.indexOf(bestMove);
            if (bestIdx == -1) {
                throw Error('Best idx not found ?');
            }

            let expandMoves = bestMove.expand(world.width, world.height, this.moveHistory);

            // assign cost
            expandMoves.map((el) => el.cost += el.dist(targetPosition) + 0.97 * world.getTerrainCost(el));
            // filter
            possibleMoves.splice(bestIdx, 1);
            // join
            possibleMoves.push(...expandMoves);
        }

        let node = this.moveHistory.pop();
        let res = [];

        while (node) {
            res.push(node);
            node = node.parent;
        }
        res = res.reverse();
        let bestMove = res[1];
        let moveCost = this.hasFlag ? world.getTerrainCost(bestMove) + 1.5 : world.getTerrainCost(bestMove);
        console.log(`next move: ${this.position.getDirection(bestMove)}\r\ncost:${moveCost}\r\npointsAvaliable:${this.movesLeft} `);
        if (moveCost > this.movesLeft)
            return MoveDirections.NO_MOVE;
        return this.position.getDirection(res[1]);
    }
}