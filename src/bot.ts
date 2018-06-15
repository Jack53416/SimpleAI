import * as minimist from 'minimist';
import Game from './game/Game';

const url = "ws://localhost:8000";
let args = minimist(process.argv.slice(2));
let game = new Game(args.m);

