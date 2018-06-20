import Location from './Location';
import GameMap from './GameMap';
import { MoveDirections } from './enums';
import * as _ from 'lodash';

export const enum ComputationType {
    GREEDY,
    ACCURATE
}

export const enum PathStatus {
    EMPTY,
    FINISHED,
    IN_PROGRESS
}


export class Path {
    private readonly _startnode: Location;
    private _nodes: Location[];
    public moveCost: number;
    private _status: PathStatus;

    constructor(nodes: Location[] = [], startNode: Location = new Location(), moveCost: number = 0) {
        this._nodes = nodes;
        this.moveCost = moveCost;
        this._startnode = startNode;
        if (this._nodes.length > 0) {
            this._status = PathStatus.IN_PROGRESS;
        }
        else
            this._status = PathStatus.EMPTY;
    }

    get status(): PathStatus {
        return this._status;
    }

    public findLocationIdx(location: Location): number {
        return _.findIndex(this._nodes, (el) => el.equals(location));
    }

    get nodes(): Location[] {
        return this._nodes;
    }

    public getNextNode() {
        if (this._nodes.length == 1) {
            this._status = PathStatus.FINISHED;
        }
        if (this._nodes.length == 0)
            return this._startnode;
        return this._nodes.pop();
    }

    public reset() {
        this._nodes.length = 0;
        this._status = PathStatus.EMPTY;
    }

}


export class InvalidPath extends Error { }
export class InvalidLocation extends Error { }

const maxAccurateDist: number = 8;

function recreatePath(targetNode: Location, world: GameMap): Path {
    let path: Location[] = [];
    let moveCost: number = 0;
    
    let node = targetNode;
    while (node) {
        path.push(node);
        moveCost += world.getTerrainCost(node);
        node = node.parent;
    }

    moveCost -= world.getTerrainCost(path[path.length - 1]);
    let startnode: Location = path.pop();
    return new Path(path, startnode, moveCost);
}

export function findPath(world: GameMap, startPositon: Location, targetPosition: Location, mode: ComputationType = ComputationType.ACCURATE, excludeNodes: Location[] = []): Path {
    excludeNodes.map((el) => {
        if (el.equals(targetPosition) || el.equals(startPositon))
            throw new InvalidPath(`Exludede nodes: ${JSON.stringify(excludeNodes)} 
                                    include start or end point!\r\nStart Point: ${JSON.stringify(startPositon)}\r\nEnd Pont: ${JSON.stringify(targetPosition)}`);
    });

    if (startPositon.equals(targetPosition))
        return new Path([], startPositon);

    let moveHistory = excludeNodes;
    let iterNum = 0;
    if (startPositon.chebyshevDist(targetPosition) > maxAccurateDist) {
        mode = ComputationType.GREEDY;
    }
    startPositon.cost = 0;

    moveHistory.push(startPositon);
    let possibleMoves: Location[] = startPositon.expand(world.width, world.height, moveHistory);
    // assign cost
    possibleMoves.forEach((el: Location) => el.cost += 0.7 * el.dist(targetPosition) + world.getTerrainCost(el));

    while (true) {
        iterNum++;
        // choose min cost location
        possibleMoves = _.sortBy(possibleMoves, (val) => val.cost);
        let bestMove: Location = possibleMoves[0];
        moveHistory.push(bestMove);
        if (bestMove.equals(targetPosition))
            break;
        // expand
        let bestIdx = possibleMoves.indexOf(bestMove);
        if (bestIdx == -1) {
            throw Error('Best idx not found ?');
        }

        let expandMoves = bestMove.expand(world.width, world.height, moveHistory.concat(possibleMoves));

        // assign cost
        if (mode == ComputationType.ACCURATE)
            expandMoves.forEach((el) => el.cost += 0.7 * el.dist(targetPosition) + world.getTerrainCost(el));
        else
            expandMoves.forEach((el) => el.cost = el.dist(targetPosition) + world.getTerrainCost(el));
        // filter
        possibleMoves.splice(bestIdx, 1);
        // join
        possibleMoves.push(...expandMoves);
    }
    console.log(iterNum);
    let node = moveHistory.pop();
    let res = recreatePath(node, world);
    return res;
}


