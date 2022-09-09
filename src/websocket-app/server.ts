import {App} from "./app";
import WebSocket from "ws";

export interface Config {
    port: number;
}

async function initServer(config : Config) {
    // Create wss
    const wss = new WebSocket.Server({ port: config.port });

    new App(wss);

}


let config : Config = {
    port: 8080
}
initServer(config).then(() => {
    console.log(`Server started on  ws://localhost:${config.port}`);
});