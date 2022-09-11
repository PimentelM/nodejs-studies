import {App} from "./app";
import WebSocket from "ws";
import {FileSystemBasedReminderRepository} from "./repositories";

export interface Config {
    port: number;
}

export async function initServer(config : Config) {
    // Create wss
    const wss = new WebSocket.Server({ port: config.port });

    // Create reminder repository
    const reminderRepository = new FileSystemBasedReminderRepository(`_PERSISTENCE_PATH_`);

    let app = new App(wss, reminderRepository);

}