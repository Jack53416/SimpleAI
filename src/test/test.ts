import GameMap from '../game/GameMap';
import Location from '../game/Location';

let map = new GameMap(10, 10);
let pos = new Location(4, 4);
let res = map.getFieldsInRadius(pos, 3);
console.log(res);