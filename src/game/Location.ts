import * as _ from 'lodash';
import { MoveDirections } from './enums';

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

    public expand(stopX?: number, stopY?: number, exclusionSet?: Location[]): Location[] {
        let result: Location[] = [
            new Location(this.x - 1, this.y, 0, this),
            new Location(this.x + 1, this.y, 0, this),
            new Location(this.x, this.y + 1, 0, this),
            new Location(this.x, this.y - 1, 0, this)
        ];

        result = result.filter((el) => el.x >= 0 && el.y >= 0 //Check for proper coords
            && el.x < stopX && el.y < stopY                   //Check for map boundaries
            && !_.some(exclusionSet, { x: el.x, y: el.y }));  //Check if this location is new

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