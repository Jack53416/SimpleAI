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
    
    private cashedPath: Location[];

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
        this.cashedPath = [];
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

    private avoidEnemy(world: GameMap, target: Location, enemy: Player): pathfinder.Path {
        let losFields: Location[] = world.getFieldsInRadius(this.position, this.viewRange);

        losFields = losFields.filter((el) => el.manhattanDist(enemy.position) >= 1); //remove fields adjacent to the enemy
        // TO DO: rest of the code !


        return null;
    }

    private calculatePath(world: GameMap, target: Location, enemy: Player): pathfinder.Path {
        if (!enemy)
            return pathfinder.findPath(world, this.position, target);

        if (this.isInView(enemy.position) && enemy.isAlive) {
            let pathToEnemy = pathfinder.findPath(world, this.position, enemy.position);
            if (this.isOneTurnPath(pathToEnemy)) {
                return pathToEnemy;
            }
            /*else
                return this.avoidEnemy(); TO DO */
        }
        return pathfinder.findPath(world, this.position, target);

    }

    public move(world: GameMap, flagPosition: Location, enemy: Player): MoveDirections {
        let targetPosition: Location = this.hasFlag ? this.basePosition : flagPosition;

        let res: pathfinder.Path = this.calculatePath(world, targetPosition, enemy);
        let bestMove = res.nodes[1];
        let moveCost = this.hasFlag ? world.getTerrainCost(bestMove) + 1.5 : world.getTerrainCost(bestMove);

        if (moveCost > this.movesLeft)
            return MoveDirections.NO_MOVE;
        return this.position.getDirection(bestMove);
    }
}