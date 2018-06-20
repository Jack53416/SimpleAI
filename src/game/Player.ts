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
    private readonly flagMovePenalty: number = 1.5;
    private readonly maxComputationRange = 6;

    private movesLeft: number;
    public lastFlagPosition: Location;

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
        this.lastFlagPosition = new Location();
        this.cashedPath = new pathfinder.Path();
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
            return path.moveCost + this.flagMovePenalty * path.nodes.length <= movePoints;
        let flagIdx = path.findLocationIdx(this.lastFlagPosition);
        if (flagIdx != -1) {
            path.moveCost += this.flagMovePenalty * flagIdx;
        }
        return path.moveCost <= movePoints;
    }

    public avoidEnemy(world: GameMap, target: Location, enemy: Player): pathfinder.Path {
        let calcRadius = Math.min(this.viewRange, this.maxComputationRange);
        let losFields: Location[] = world.getFieldsInRadius(this.position, calcRadius);
        let resultPath: pathfinder.Path;

        losFields = losFields.filter((el) => el.manhattanDist(enemy.position) > 1); //remove fields adjacent to the enemy
        losFields = losFields.filter((el) =>  // remove all fields too close to the enemy or too far to reach
            !enemy.isReachable(pathfinder.findPath(world, enemy.position, el), enemy.maxMovesPerRound) &&
            this.isReachable(pathfinder.findPath(world, this.position, el))
        );

        // sort remaining fields based on the movement cost to the target
        losFields.sort((locA, locB) => {
            return pathfinder.findPath(world, locA, target).moveCost - pathfinder.findPath(world, locB, target).moveCost
        });

        console.log(`Avoiding enemy found fields:\r\n${JSON.stringify(losFields)}`);

        if (losFields.length == 0) {
            resultPath = pathfinder.findPath(world, this.position, target, pathfinder.ComputationType.GREEDY);
        }
        else {
            resultPath = pathfinder.findPath(world, this.position, losFields[0]);
            this.cashedPath = resultPath;
        }
        return resultPath;
    }

    private attackEnemy(world: GameMap, target: Location, enemy: Player): pathfinder.Path {
        let pathToEnemy = pathfinder.findPath(world, this.position, enemy.position);
        let canReach: boolean = this.isReachable(pathToEnemy);
        let isFlagCaptured = this.hasFlag || enemy.hasFlag;

        if (!canReach && this.lastFlagPosition.chebyshevDist(this.position) <= this.viewRange && !isFlagCaptured) { //Check if can find better path than through the flag
            pathToEnemy = pathfinder.findPath(world, this.position, enemy.position, pathfinder.ComputationType.ACCURATE, [this.lastFlagPosition]);
            canReach = this.isReachable(pathToEnemy);
        }

        if (!canReach)
            return this.avoidEnemy(world, target, enemy);

        this.cashedPath = pathToEnemy;
        return pathToEnemy;
    }

    public calculatePath(world: GameMap, target: Location, enemy: Player): pathfinder.Path {
        if (enemy.isVisible && enemy.isAlive) {
            return this.attackEnemy(world, target, enemy);
        }
        return pathfinder.findPath(world, this.position, target, pathfinder.ComputationType.GREEDY);
    }

    public move(world: GameMap, flagPosition: Location, enemy: Player): MoveDirections {
        let targetPosition: Location = this.hasFlag ? this.basePosition : flagPosition;
        let res: pathfinder.Path;
        let bestMove: Location;
        this.lastFlagPosition = flagPosition; 

        if (this.movesLeft == this.maxMovesPerRound || this.position.equals(this.basePosition) )
            this.cashedPath.reset();

        if (this.cashedPath.status == pathfinder.PathStatus.EMPTY)
            res = this.calculatePath(world, targetPosition, enemy);
        else if (this.cashedPath.status == pathfinder.PathStatus.FINISHED)
            return MoveDirections.NO_MOVE;

        if (res) {
            bestMove = res.getNextNode();
        }
        else
            bestMove = this.cashedPath.getNextNode();

        let moveCost = this.hasFlag ? world.getTerrainCost(bestMove) + this.flagMovePenalty : world.getTerrainCost(bestMove);

        if (moveCost > this.movesLeft)
            return MoveDirections.NO_MOVE;
        return this.position.getDirection(bestMove);
    }
}