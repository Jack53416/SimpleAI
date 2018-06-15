import * as WebSocket from "ws";
import { MoveDirections } from "../game/enums";
import { ServerRequestsTypes, MoveRequest } from "../communication/serverRequests";
import { ConnectMessage, IncomingMessagesTypes, IncomingMessage, MoveMessage } from "../communication/incomingMessages";
import { ConnectResponse, ServerResponseTypes } from "../communication/serverResponses";

export default class Connection {
    private readonly url: string;
    private socket: WebSocket;

    private onConnect: (msg: ConnectResponse) => void;
    private onMoveRequest: (msg: MoveRequest) => void;
    private onGameOver: (event: any) => void;
    private onError: (error: any) => void;
    private onOpen: (event: any) => void;

    constructor(url: string,
        onOpen: (event: any) => void,
        onConnect: (msg: ConnectResponse) => void,
        onMoveRequest: (msg: MoveRequest) => void,
        onGameOver: (event: any) => void,
        onError: (error: any) => void) {

        this.url = url;
        this.onOpen = onOpen;
        this.onConnect = onConnect;
        this.onMoveRequest = onMoveRequest;
        this.onGameOver = onGameOver;
        this.onError = this.onError;
   
        this.socket = new WebSocket(this.url);
        this.socket.onopen = this.onOpen;
        this.socket.onmessage = (msg) => {
            const msgData: any = JSON.parse((<string>msg.data));
            console.log(msgData);
            switch (msgData.type) {
                case ServerRequestsTypes.MoveRequest:
                    this.onMoveRequest(msgData);
                    break;
                case ServerResponseTypes.Connected:
                    this.onConnect(msgData);
                    break;
            }
        }
        this.socket.onerror = this.onError;

    }

    public sendPlayerInfo(playerName: string) {
        let connectMessage: ConnectMessage = {
            type: IncomingMessagesTypes.Connect,
            name: playerName
        };

        this.socket.send(JSON.stringify(connectMessage));
    }

    public sendMove(playerId: number, playerMove: MoveDirections) {
        let moveMessage: MoveMessage = {
            type: IncomingMessagesTypes.Move,
            playerId: playerId,
            move: playerMove
        };
        this.socket.send(JSON.stringify(moveMessage));
    }
}