import WebSocket, {RawData} from "ws";
import {tryCatch} from "./utils";
import {EventReminder, Reminder} from "./models";
import {randomUUID} from "crypto";


function log(...args: any[]) {
  console.log(...args);
}



export type CommandType = "register-event-reminder" | "now";

export type AppCommand = {
    type: CommandType;
    [key: string]: any;
}

export class App {
    private clients: Set<WebSocket> = new Set();

    private eventReminder: EventReminder = new EventReminder();

    constructor(private wss: WebSocket.Server, private logger : (...args: any[]) => void = log) {
        this.registerConnectionHandler();
        this.registerEventReminderHandler();
    }

    private registerEventReminderHandler() {
        this.eventReminder.on('reminder', (reminder) => {
            this.clients.forEach((client) => {
                client.send(`We are reminding you from this event: ${reminder.name}`);
            });
        });
    }

    private registerConnectionHandler() {
        this.wss.on('connection', (ws) => {
            // Save ws to clients
            this.clients.add(ws);

            // Remove from clients once connection is closed
            ws.on('close', () => {
                this.log(`Connection with WebSocket closed. Removing it from clients list.`);
                this.clients.delete(ws);
            });

            // Register message handlers
            this.registerMessageHandler(ws);
        });
    }

    private registerMessageHandler(ws: WebSocket.WebSocket) {
        ws.on('message', (message) => {
            this.log(`Received message: ${message}`);

            let [err, data] = tryCatch(() => App.parseMessage(message));

            if (err) {
                this.log(`Error parsing message: ${err}`);
                return ws.send(err.message);
            }

            // Handle message
            switch (data.type) {
                case "register-event-reminder":
                    let reminder = new Reminder(data.id ?? randomUUID(), data.name, new Date(data.date));
                    let [canRegister, message] = this.eventReminder.canRegisterReminder(reminder);

                    if (!canRegister) {
                        return ws.send(message);
                    }

                    this.eventReminder.registerReminder(reminder);
                    ws.send(`Registered event reminder. We have ${this.clients.size} connected clients.`);
                    break;
                case "now":
                    ws.send(`Current time: ${new Date().toISOString()}`);
                    break;
                default:
                    this.log(`Unknown message type: ${data.type}`);
                    ws.send("Unknown message type");
            }
        });
    }

    private log(...args: any[]) {
        this.logger(...args);
    }

    static parseMessage(message: RawData): AppCommand {
        let [err, data] = tryCatch(() => JSON.parse(message.toString()));

        if (err) {
            throw new Error("Error parsing JSON message");
        }

        if (!data.type) {
            throw new Error("Message type not specified");
        }

        return data;
    }

}