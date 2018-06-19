import * as WebSocket from 'ws';
import chalk from 'chalk';
import { MoveDirections } from '../game/enums';
import { ServerRequestsTypes, MoveRequest } from '../communication/serverRequests';
import { ConnectMessage, IncomingMessagesTypes, IncomingMessage, MoveMessage } from '../communication/incomingMessages';
import { ConnectResponse, ServerResponseTypes, ErrorResponse } from '../communication/serverResponses';

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
        onError?: (error: any) => void) {

        this.url = url;
        this.onOpen = onOpen;
        this.onConnect = onConnect;
        this.onMoveRequest = onMoveRequest;
        this.onGameOver = onGameOver;
        this.onError = onError != undefined ? onError : this.defaultErrorHandler;

        this.socket = new WebSocket(this.url);
        this.socket.onopen = this.onOpen;
        this.socket.onerror = this.onError;
        this.socket.onmessage = (msg) => {
            {
                const msgData: any = JSON.parse((<string>(msg.data)));
                switch (msgData.type) {
                    case ServerRequestsTypes.MoveRequest:
                        this.onMoveRequest(msgData);
                        break;
                    case ServerResponseTypes.Connected:
                        this.onConnect(msgData);
                        break;
                    case ServerResponseTypes.GameOver:
                        this.onGameOver(msgData);
                        break;
                    case ServerResponseTypes.Error:
                        let err = <ErrorResponse>msgData;
                        this.onError(new Error(err.msg.toString()));
                        break;
                }
            }
        };
        

    }

    public sendPlayerInfo(playerName: string) {
        let connectMessage: ConnectMessage = {
            type: IncomingMessagesTypes.Connect,
            name: playerName
        };

        this.socket.send(JSON.stringify(connectMessage), this.ack);
    }

    public sendMove(playerId: number, playerMove: MoveDirections) {
        let moveMessage: MoveMessage = {
            type: IncomingMessagesTypes.Move,
            playerId: playerId,
            move: playerMove
        };
        console.log(`sending move ${JSON.stringify(moveMessage)}`);
        this.socket.send(JSON.stringify(moveMessage), this.ack);
    }

    private ack(err: any) {
        if (err) {
            this.onError(<Error>err);
        }
    }

    private defaultErrorHandler(error: Error) {
        let message = error != undefined ? error.message : "Ivalid Exception";
        console.log(chalk.redBright(`connection error occured: ${message}`));
    }
}