import {Point} from "../common/Point";
import {PlayerDto} from "../common/PlayerDto";
import {GameMapDto} from "../common/GameMapDto";

export const enum ServerRequestsTypes  {
    MoveRequest = "MoveRequest"
}

export interface MoveRequest {
    readonly type: ServerRequestsTypes;
    map: GameMapDto;
    players: PlayerDto[];
    flag: Point;
}