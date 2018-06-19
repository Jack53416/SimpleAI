import Location from './Location';
import GameMap from './GameMap';
import { MoveDirections } from './enums';
import * as _ from 'lodash';

export const enum ComputationType {
    GREEDY,
    ACCURATE
}

export interface Path {
    nodes: Location[],
    moveCost: number
}



export class InvalidPath extends Error { }
export class InvalidLocation extends Error { }

function recreatePath(targetNode: Location, world: GameMap): Path {
    let path: Path = {
        nodes: [],
        moveCost: 0
    };
    let node = targetNode;
    while (node) {
        path.nodes.push(node);
        path.moveCost += world.getTerrainCost(node);
        node = node.parent;
    }

    path.moveCost -= world.getTerrainCost(path.nodes[path.nodes.length - 1]);
    path.nodes.pop();
    return path;
}


export function getNextMove(path: Path): Location {
    return path.nodes.pop();
}

export function findPath(world: GameMap, startPositon: Location, targetPosition: Location, mode: ComputationType = ComputationType.ACCURATE): Path {
    if (startPositon.equals(targetPosition))
        return {
            nodes: [startPositon],
            moveCost: 0
        };

    let moveHistory = [];
    let iterNum = 0;
    startPositon.cost = 0;

    moveHistory.push(startPositon);
    let possibleMoves: Location[] = startPositon.expand(world.width, world.height);
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


