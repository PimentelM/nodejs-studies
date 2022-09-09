import WebSocket, {RawData} from "ws";
import {tryCatch} from "./utils";
import {EventReminder, Reminder} from "./models";


function log(...args: any[]) {
  console.log(...args);
}



type CommandType = "register-event-reminder" | "now";

type AppCommand = {
    type: CommandType;
    [key: string]: any;
}

class Server {
    private wss: WebSocket.Server;
    private clients: Set<WebSocket> = new Set();

    private eventReminder : EventReminder = new EventReminder();

    constructor(private port: number) {
        this.wss = new WebSocket.Server({ port: this.port });
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

    private registerConnectionHandler(){
        this.wss.on('connection', (ws) => {
            // Save ws to clients
            this.clients.add(ws);

            // Remove from clients once connection is closed
            ws.on('close', () => {
                log(`Connection with WebSocket closed. Removing from client list.`);
                this.clients.delete(ws);
            });

            // Register message handlers
            this.registerMessageHandler(ws);
        });
    }

    private registerMessageHandler(ws: WebSocket.WebSocket) {
        ws.on('message', (message) => {
            log(`Received message: ${message}`);

            let [err, data] = tryCatch(() => Server.parseMessage(message));

            if(err) {
                log(`Error parsing message: ${err}`);
                return ws.send(err.message);
            }

            // Handle message
            switch(data.type) {
                case "register-event-reminder":
                    let reminder = new Reminder(data.name, new Date(data.date));
                    let [canRegister, message] = this.eventReminder.canRegisterReminder(reminder);

                    if(!canRegister) {
                        return ws.send(message);
                    }

                    this.eventReminder.registerReminder(reminder);
                    ws.send("Registered event reminder");
                    break;
                case "now":
                    ws.send(`Current time: ${new Date().toISOString()}`);
                    break;
                default:
                    log(`Unknown message type: ${data.type}`);
                    ws.send("Unknown message type");
            }
        });
    }

    static parseMessage(message: RawData) : AppCommand {
        let [err, data] =  tryCatch(() => JSON.parse(message.toString()));

        if (err) {
            throw new Error("Error parsing JSON message");
        }

        if(!data.type) {
            throw new Error("Message type not specified");
        }

        return data;
    }
}

new Server(8080);


