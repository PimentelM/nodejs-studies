import WebSocket from "ws";
import {randomUUID} from "crypto";
import {Reminder} from "../models";
import exp from "constants";
import {EventEmitter} from "events";

export function waitForSocketState(socket, state) {
    return new Promise<void>(function (resolve) {
        setTimeout(function () {
            if (socket.readyState === state) {
                resolve();
            } else {
                waitForSocketState(socket, state).then(resolve);
            }
        }, 5);
    });
}

export function sendMessageAndWaitForResponse(ws: WebSocket, message: any) : Promise<string>{
    if(typeof message === "object"){
        message = JSON.stringify(message);
    }
    return new Promise<string>(function (resolve) {
        ws.on('message', (response) => {
            resolve(response.toString());
        });

        ws.send(message);
    });
}

export function waitForNextMessage(ws: WebSocket) : Promise<string>{
    return new Promise<string>(function (resolve) {
        ws.on('message', (response) => {
            resolve(response.toString());
        });
    });
}

export async function createOpenSocket(port: number, host = "localhost") {
    let ws = new WebSocket(`ws://${host}:${port}`);
    await waitForSocketState(ws, WebSocket.OPEN);
    return ws;
}

export function getValidId() {
    return randomUUID();
}

export function getValidReminder(overwrites?: Partial<Reminder>): Reminder {
    return new Reminder(
        overwrites?.id ?? getValidId(),
        overwrites?.name ?? "name",
        overwrites?.date ?? new Date()
    );
}

export function waitForEvent<T = any>(eventEmitter: EventEmitter, eventName: string, timeout: number) : Promise<T>{
    return new Promise<T>( (resolve) => {
        eventEmitter.on(eventName, resolve);
        setTimeout(resolve, timeout);
    });
}