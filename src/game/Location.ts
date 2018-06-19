import * as _ from 'lodash';
import { MoveDirections } from './enums';

export const enum MetricType {
    EUCLIDEAN,
    MANHATTAN,
    CHEBYSHEV
};

export default class Location {
    public x: number;
    public y: number;
    public cost: number;
    public parent: Location;

    constructor(posX = 0, posY = 0, cost = 0, parent?: Location) {
        this.x = posX;
        this.y = posY;
        this.cost = cost;
        if (parent) {
            this.parent = parent;
        }
    }

    equals(other: Location): boolean {
        if (this.x == other.x && this.y == other.y)
            return true;
        return false;
    }

    public dist(other: Location): number {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }

    public manhattanDist(other: Location): number {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    public chebyshevDist(other: Location): number {
        return Math.max(Math.abs(this.x - other.x), Math.abs(this.y - other.y));
    }

    public expand(stopX?: number, stopY?: number, exclusionSet?: Location[]): Location[] {
        let result: Location[] = [
            new Location(this.x - 1, this.y, this.cost, this),
            new Location(this.x + 1, this.y, this.cost, this),
            new Location(this.x, this.y + 1, this.cost, this),
            new Location(this.x, this.y - 1, this.cost, this)
        ];

        result = result.filter((el) => el.x >= 0 && el.y >= 0
            && el.x < stopX && el.y < stopY
            && !_.some(exclusionSet, { x: el.x, y: el.y }));

        return result;
    }

    public getDirection(other: Location): MoveDirections {
        if (other.x > this.x)
            return MoveDirections.RIGHT;
        if (other.x < this.x)
            return MoveDirections.LEFT;
        if (other.y > this.y)
            return MoveDirections.DOWN;
        if (other.y < this.y)
            return MoveDirections.UP;
        return MoveDirections.NO_MOVE;
    }

}