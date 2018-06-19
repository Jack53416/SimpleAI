import Location from './Location';
import GameMap from './GameMap';
import { MoveDirections } from './enums';

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
    path.nodes = path.nodes.reverse();
    path.moveCost -= world.getTerrainCost(path.nodes[0]);
    return path;
}


export function getFirstMove(path: Path): Location {
    if (path.nodes.length == 1) {
        return path.nodes[0];
    }
    return path.nodes[1];
}

export function findPath(world: GameMap, startPositon: Location, targetPosition: Location): Path {
    if (startPositon.equals(targetPosition))
        return {
            nodes: [startPositon],
            moveCost: 0
        };

    let moveHistory = [];
    startPositon.cost = 0;

    moveHistory.push(startPositon);
    let possibleMoves: Location[] = startPositon.expand(world.width, world.height);
    // assign cost
    possibleMoves.forEach((el: Location) => el.cost += el.dist(targetPosition) +  0.7 * world.getTerrainCost(el));

    while (true) {
        // choose min cost location
        let bestMove: Location = possibleMoves.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
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
        expandMoves.forEach((el) => el.cost += el.dist(targetPosition) + 0.97 * world.getTerrainCost(el));
        // filter
        possibleMoves.splice(bestIdx, 1);
        // join
        possibleMoves.push(...expandMoves);
    }

    let node = moveHistory.pop();
    let res = recreatePath(node, world);
    return res;
}


