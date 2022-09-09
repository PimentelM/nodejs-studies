import WebSocket, {RawData} from "ws";
import {tryCatch} from "./utils";
function log(...args: any[]) {
  console.log(...args);
}



type MessageType = "register-event-reminder";

type AppMessage = {
    type: MessageType;
    [key: string]: any;
}

class Server {
    private wss: WebSocket.Server;
    private clients: Set<WebSocket> = new Set();

    constructor(private port: number) {
        this.wss = new WebSocket.Server({ port: this.port });
        this.registerConnectionHandler();
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

            let [err, data] = tryCatch(() => parseMessage(message));

            if(err) {
                log(`Error parsing message: ${err}`);
                return ws.send(err.message);
            }

            // Handle message
            switch(data.type) {
                case "register-event-reminder":
                    ws.send("Registered event reminder");
                    break;
                default:
                    log(`Unknown message type: ${data.type}`);
                    ws.send("Unknown message type");
            }
        });
    }
}

new Server(8080);




function parseMessage(message: RawData) : AppMessage {
    let [err, data] =  tryCatch(() => JSON.parse(message.toString()));

    if (err) {
        throw new Error("Error parsing JSON message");
    }

    if(!data.type) {
        throw new Error("Message type not specified");
    }

    return data;
}