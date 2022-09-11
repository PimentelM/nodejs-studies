import {App} from "./app";
import WebSocket from "ws";
import {ReminderRepository} from "./repositories";

export interface Config {
    port: number;
}

async function initServer(config : Config) {
    // Create wss
    const wss = new WebSocket.Server({ port: config.port });

    // Create reminder repository
    const reminderRepository = new ReminderRepository(`_PERSISTENCE_PATH_`);

    let app = new App(wss, reminderRepository);

}


let config : Config = {
    port: 8080
}
initServer(config).then(() => {
    console.log(`Server started on  ws://localhost:${config.port}`);
});