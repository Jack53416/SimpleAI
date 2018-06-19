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
    public isVisible: boolean;

    private cashedPath: pathfinder.Path;

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
        this.cashedPath = {
            nodes: [],
            moveCost: 0
        }
        this.isVisible = true;
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

    public isReachable(path: pathfinder.Path, movePoints: number = this.movesLeft): boolean {
        if (this.hasFlag)
            return path.moveCost + 1.5 * (path.nodes.length - 1) <= movePoints;
        return path.moveCost <= movePoints;
    }

    public avoidEnemy(world: GameMap, target: Location, enemy: Player): pathfinder.Path {
        let losFields: Location[] = world.getFieldsInRadius(this.position, this.viewRange);
        let resultPath: pathfinder.Path;

        losFields = losFields.filter((el) => el.manhattanDist(enemy.position) > 1); //remove fields adjacent to the enemy
        losFields = losFields.filter((el) =>  // remove all fields too close to the enemy or too far to reach
            !enemy.isReachable(pathfinder.findPath(world, enemy.position, el), enemy.maxMovesPerRound) &&
                this.isReachable(pathfinder.findPath(world, this.position, el))
        );

        // sort remaining fields based on the movement cost to the target
        losFields.sort((locA, locB) => pathfinder.findPath(world, locA, target).moveCost - pathfinder.findPath(world, locB, target).moveCost);

        console.log(`Avoiding enemy found fields:\r\n${JSON.stringify(losFields)}`);

        if (losFields.length == 0) {
            resultPath = pathfinder.findPath(world, this.position, target, pathfinder.ComputationType.ACCURATE);
        }
        else {
            resultPath = pathfinder.findPath(world, this.position, losFields[0]);
            this.cashedPath = resultPath;
        }
        return resultPath;
    }

    private calculatePath(world: GameMap, target: Location, enemy: Player): pathfinder.Path {
        if (enemy.isVisible && enemy.isAlive) {
            let pathToEnemy = pathfinder.findPath(world, this.position, enemy.position);
            if (this.isReachable(pathToEnemy)) {
                this.cashedPath = pathToEnemy;
                return pathToEnemy;
            }
            else
                return this.avoidEnemy(world, target, enemy);
        }
        return pathfinder.findPath(world, this.position, target, pathfinder.ComputationType.ACCURATE);

    }

    public move(world: GameMap, flagPosition: Location, enemy: Player): MoveDirections {
        let targetPosition: Location = this.hasFlag ? this.basePosition : flagPosition;
        let res: pathfinder.Path;
        let bestMove;

        if (this.position.equals(this.basePosition)) {
            this.cashedPath.nodes.length = 0;
            this.cashedPath.moveCost = 0;
        }
        if (this.cashedPath.nodes.length == 0)
            res = this.calculatePath(world, targetPosition, enemy);

        if (res) {
            bestMove = res.nodes.pop()
        }
        else
            bestMove = this.cashedPath.nodes.pop();

        let moveCost = this.hasFlag ? world.getTerrainCost(bestMove) + 1.5 : world.getTerrainCost(bestMove);

        if (moveCost > this.movesLeft)
            return MoveDirections.NO_MOVE;
        return this.position.getDirection(bestMove);
    }
}