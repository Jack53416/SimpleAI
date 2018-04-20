import * as _ from "lodash";

enum TerrainType {
	STANDARD = 1,
	WATER = 2,
	MARSH = 3
}

enum MoveType {
    LEFT,
	RIGHT,
	UP,
	DOWN,
	END_TURN
}


class Terrain {
	sizeX: number;
	sizeY: number;
	map:number[][];
	constructor(sizeX: number, sizeY:number){
        this.sizeX = Math.floor(sizeX);
        this.sizeY = Math.floor(sizeY);
        this.map = [];
	}

	public getRandomTerrain(): TerrainType {
		let terrainValues = Object.getOwnPropertyNames(TerrainType).filter((el) => !isNaN(Number(el)));
		var en: { [index: string]: any } = TerrainType;
		return en[_.sample(terrainValues)];
	}

	public generateMap(): void {
		this.map = new Array<Array<number>>(this.sizeY);

		for(let i = 0; i < this.sizeY; i++){
			this.map[i] = [...new Array<number>(this.sizeX)]
             				.map(() => Number(TerrainType[this.getRandomTerrain()]));
		}

    }

    public getTerrainCost(position: Location): number {
        return this.map[position.y][position.x];
    }
}

class Location {
    x: number;
    y: number;
    cost: number;
    parent: Location;

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

    dist(other: Location): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    expand(stopX?:number, stopY?:number, exclusionSet?: Location[]): Location[] {
        let result: Location[] = [
            new Location(this.x - 1, this.y, 0, this),
            new Location(this.x + 1, this.y, 0, this),
            new Location(this.x, this.y + 1, 0, this),
            new Location(this.x, this.y - 1, 0, this)
        ];

        result = result.filter((el) => el.x >= 0 && el.y >= 0
                                    && el.x < stopX && el.y < stopY
                                    && !_.some(exclusionSet, { x: el.x, y: el.y }));

        return result;
    }
 }

class Player {
    name: string;
    position: Location;
    hasFlag: boolean;
    moveHistory: Location[];

    constructor(name: string, startPosition: Location, hasflag = false) {
        this.name = name;
        this.position = startPosition;
        this.hasFlag = hasflag;
        this.moveHistory = [];
    }



    move(world: Terrain, flag: Flag): MoveType {
        this.moveHistory.push(this.position);
        let possibleMoves: Location[] = this.position.expand(world.sizeX, world.sizeY);
        // assign cost
        possibleMoves.map((el: Location) => el.cost += el.dist(flag.position) + world.getTerrainCost(el));

        while (true) {
            // choose min cost location
            let bestMove: Location = possibleMoves.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
            this.moveHistory.push(bestMove);
            if (bestMove.equals(flag.position))
                break;
            // expand
            let bestIdx = possibleMoves.indexOf(bestMove);
            if (bestIdx == -1) {
                throw Error("Best idx not found ?");
            }

            let expandMoves = bestMove.expand(world.sizeX, world.sizeY, this.moveHistory);

            // assign cost
            expandMoves.map((el) => el.cost += el.dist(flag.position) + world.getTerrainCost(el));
            // filter
            possibleMoves.splice(bestIdx, 1);
            // join
            possibleMoves.push(...expandMoves);
        }
        return MoveType.END_TURN;
    }
}

class Flag {
    position: Location;
    constructor(position: Location) {
        this.position = position;
    }
}

let gameMap: Terrain = new Terrain(5, 5);
let flag: Flag = new Flag(new Location(4, 4));
let player: Player = new Player("player1", new Location(0, 0));
gameMap.generateMap();
console.log(gameMap.map);
player.move(gameMap, flag);

let node = player.moveHistory.pop();
let res = [];
while (node) {
    res.push(node);
    node = node.parent;
}

console.log(res.reverse());