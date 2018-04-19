import * as _ from "lodash";

enum TerrainType {
	STANDARD = 1,
	WATER = 2,
	MARSH = 3
}

enum MoveType {
	LEFT = 'left',
	RIGHT = 'right',
	UP = 'up',
	DOWN = 'down',
	END_TURN = 'no_move'
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
}

let gameMap:Terrain = new Terrain(10,10);
gameMap.generateMap();
console.log(gameMap.map);
