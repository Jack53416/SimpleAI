import GameMap from '../game/GameMap';
import Location from '../game/Location';
//import { PerlinNoiseGenerator } from './PerlinNoiseGenerator';
import * as fs from 'fs';

import { table } from 'table';
import { GameMapDto } from '../common/GameMapDto';
import { PlayerDto } from '../common/PlayerDto';

import Player from '../game/Player';
import chalk from 'chalk';
import * as pathfinder from '../game/Pathfinder';

const width = 10;
const height = 10;
const waterThreshold = 0.5;
const swampThreshold = 0.75;

function convertGroundType(field: number): number {
    if (field <= waterThreshold) {
        return 1;
    }
    if (field > waterThreshold && field < swampThreshold) {
        return 2;
    }
    if (field > swampThreshold) {
        return 3;
    }
}

//let noiseGen = new PerlinNoiseGenerator(width, height);
let map = new GameMap(width, height);
let mapDto: GameMapDto = <GameMapDto>JSON.parse(fs.readFileSync('map.json').toString());
map.updateMap(mapDto);
let playerDto: PlayerDto = {
    id: 0,
    hasFlag: false,
    isAlive: true,
    name: 'player',
    maxMovesPerRound: 7,
    basePosition: new Location(0,0),
    viewRange: 4,
    movesLeft: 7,
    x: 5,
    y: 5,

};

let enemyDto: PlayerDto = {
    id: 1,
    hasFlag: true,
    isAlive: true,
    name: 'enemy',
    maxMovesPerRound: 7,
    basePosition: new Location(9, 9),
    viewRange: 4,
    movesLeft: 7,
    x: 5,
    y: 4,
};

let flagPostion = new Location(5, 4);

let player = new Player(playerDto);
let enemy = new Player(enemyDto);
let l1 = new Location(5, 4), l2 = new Location(3, 5);
let pTest = pathfinder.findPath(map, l1, l2);

let path = player.avoidEnemy(map, flagPostion, enemy);
let safeSquare = path.nodes.pop();
let los = map.getFieldsInRadius(player.position, 4);

let mapPrint = map.printMap();
/*los.map((el) => {
    mapPrint[el.y][el.x] = '*';
    if (player.isInView(el))
        mapPrint[el.y][el.x] = chalk.green('+');
});*/
mapPrint[player.position.y][player.position.x] = `\x1b[36mP\x1b[0m`;
if (enemy && enemy.isAlive) {
    if (enemy.isInView(player.position))
        mapPrint[enemy.position.y][enemy.position.x] = chalk.redBright('E');
    else mapPrint[enemy.position.y][enemy.position.x] = chalk.red('~E~');
}


mapPrint[safeSquare.y][safeSquare.x] = 'X';
console.log(table(mapPrint));



/*let noise = noiseGen.generatePerlinNoise(2);
for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
        map.fields[i][j] = convertGroundType(noise[i][j])
    }
}*/

/*fs.writeFile('map.json', JSON.stringify(map.getMapDto()), (err) => {
    if (err)
        throw err;
});*/