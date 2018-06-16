import Location from './Location';
import GameMap from './GameMap';
import { MoveDirections } from './enums';

export interface PathResult {
    path: Location[],
    cost: number,
    firstDirection: MoveDirections
    firstDirectionCost: number
}


export class InvalidPath extends Error { }
export class InvalidLocation extends Error { }


function assignCost(nodeArr: Location[], targetPosition: Location, world: GameMap) {
    nodeArr.forEach((el: Location) => el.cost += el.dist(targetPosition) + 0.97 * world.getTerrainCost(el));
}

function recreatePath(targetNode: Location): Location[] {
    let path = [];
    let node = targetNode;
    while (node) {
        path.push(node);
        node = node.parent;
    }
    return path.reverse();
}

function getFirstMoveDirection(startPos: Location, path: Location[]): MoveDirections {
    if (path.length < 2) {
        throw new InvalidPath(`Generated path ${path} of length ${path.length} is invalid`);
    }

    let bestMove = path[1];
    return startPos.getDirection(bestMove);

}
export function find(startPos: Location, target: Location, world: GameMap): PathResult {
    startPos.cost = 0;
    if (startPos.equals(target)) {
        throw new InvalidLocation("Starting Position and target are the same");
    }

    let nodeHistory = [startPos];
    let possibleMoves: Location[] = startPos.expand(world.width, world.height);
    // assign cost
    assignCost(possibleMoves, target, world);

    while (true) {
        // choose min cost location
        let bestMove: Location = possibleMoves.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
        nodeHistory.push(bestMove);

        if (bestMove.equals(target))
            break;
 
        // expand
        let bestIdx = possibleMoves.indexOf(bestMove);
        if (bestIdx == -1) {
            throw Error('Best idx not found ?');
        }
        let expandMoves = bestMove.expand(world.width, world.height, nodeHistory);
        assignCost(possibleMoves, target, world); // assign cost
        possibleMoves.splice(bestIdx, 1); // filter
        possibleMoves.push(...expandMoves); // join
    }

    let targetNode = nodeHistory.pop();
    let path = recreatePath(targetNode);
    return {
        path: path,
        cost: targetNode.cost,
        firstDirection: getFirstMoveDirection(startPos, path),
        firstDirectionCost: world.getTerrainCost(path[1])
    };
}


