import {App} from "./app";
import WebSocket from "ws";
import {FileSystemBasedReminderRepository} from "./app/repositories";

export interface Config {
    port: number;
}

export async function initServer(config : Config) : Promise<void> {
    // Create wss
    const wss = new WebSocket.Server({ port: config.port });

    // Create reminder repository
    const reminderRepository = new FileSystemBasedReminderRepository(`_PERSISTENCE_PATH_`);

    new App(wss, reminderRepository);
}