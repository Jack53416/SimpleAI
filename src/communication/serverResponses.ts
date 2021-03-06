import {IncomingMessage} from "./incomingMessages";
import {ErrorCodes} from "./ErrorCodes";
import {GameMapDto} from "../common/GameMapDto";
import {PlayerDto} from "../common/PlayerDto";

export enum ServerResponseTypes  {
    ResponseOK = "ResponseOK",
    Error = "Error",
    Connected = "Connected",
    FrontConnect = "FrontConnect",
    GameOver = "GameOver"
}

export class ResponseOK {
    type: ServerResponseTypes = ServerResponseTypes.ResponseOK;
    msg: string = "OK";
}

export class ErrorResponse {
    type: ServerResponseTypes = ServerResponseTypes.Error;
    msg: ErrorCodes;

    constructor(errCode: ErrorCodes) {
        this.msg = errCode;
    }
}

export class ConnectResponse {
    type: ServerResponseTypes = ServerResponseTypes.Connected;
    msg: string = "Connected";
    playerId: number;

    constructor(id: number) {
        this.playerId = id;
    }
}

export class FrontConnectResponse {
    type: ServerResponseTypes = ServerResponseTypes.FrontConnect;
    msg: string = "FrontConnect";
    map: GameMapDto;
    token: number;

    constructor(map: GameMapDto, token: number) {
        this.map = map;
        this.token = token;
    }
}

export class GameOverResponse {
    type: ServerResponseTypes = ServerResponseTypes.GameOver;
    winner: PlayerDto;

    constructor(winner: PlayerDto) {
        this.winner = winner;
    }
}


