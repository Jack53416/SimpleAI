import chalk from 'chalk';
import { GameMapDto } from '../common/GameMapDto';
import Location from './Location';
import * as math from 'mathjs';

export const enum TerrainType {
    UKNOWN = -1,
    STANDARD = 1,
    WATER = 2,
    MARSH = 3
}

export default class GameMap {
    readonly uknownFieldCost: number;
    readonly width: number;
    readonly height: number;
    fields: number[][] = [];

    constructor(heigth: number, width: number) {
        this.height = heigth;
        this.width = width;
        this.uknownFieldCost = this.getTerraIncognitaValue();
        this.initMap();
    }

    private getTerraIncognitaValue(): number {
        const terrains: number[] = [TerrainType.STANDARD, TerrainType.MARSH, TerrainType.WATER];
        return math.mean(terrains) - math.std(terrains)/2;
    }

    private initMap() {
        for (let i = 0; i < this.height; i++) {
            this.fields[i] = [...new Array(this.width)].map(() => TerrainType.UKNOWN);
        }
    }

    public updateMap(mapDto: GameMapDto) {
        if (mapDto.height != this.height || mapDto.width != this.width) {
            //ToDo throw error Ivalid_Map or recreate map
            console.log('Ivalid Map size !');
            return;
        }
        for (let i = 0; i < this.height; i++){
            for (let j = 0; j < this.width; j++) {
                if (mapDto.fields[i][j] != TerrainType.UKNOWN) {
                    this.fields[i][j] = mapDto.fields[i][j];
                }
            }
        }
    }

    public getTerrainCost(position: Location) {
        if (this.fields[position.y][position.x] == TerrainType.UKNOWN)
            return this.uknownFieldCost;
        return this.fields[position.y][position.x];
    }

    public getMapDto(): GameMapDto{
        return {
            width: this.width,
            height: this.height,
            fields: this.fields
        };
    }

    public printMap(): string[][] {
        let result: any[][] = this.fields.map((arr) => arr.slice());
        for (let row of result) {
            row.forEach((el, idx, arr) => {
                switch (el) {
                    case TerrainType.STANDARD:
                        arr[idx] = chalk.green(el.toString());
                        break;
                    case TerrainType.WATER:
                        arr[idx] = chalk.blue(el.toString());
                        break;
                    case TerrainType.MARSH:
                        arr[idx] = chalk.yellow(el.toString());
                        break;
                    default:
                        arr[idx] = chalk.black(el.toString());
                };
            });
        }
        return result;
    }
}