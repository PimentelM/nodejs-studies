import WebSocket, {RawData} from "ws";
import {handlePromise, tryCatch} from "./utils";
import {EventReminder, Reminder} from "./models";
import {randomUUID} from "crypto";
import {IReminderRepository} from "./repositories";


function log(...args: any[]) {
  console.log(...args);
}



export type CommandType = "register-event-reminder" | "list-event-reminders" |"now";

export type AppCommand = {
    type: CommandType;
    [key: string]: any;
}

export class App {
    private clients: Set<WebSocket> = new Set();

    private eventReminder: EventReminder = new EventReminder();

    public initPromise: Promise<void>;

    constructor(private wss: WebSocket.Server, private reminderRepository: IReminderRepository, private logger : (...args: any[]) => void = log) {
        this.registerConnectionHandler();
        this.registerEventReminderHandler();
        this.initPromise = this.init().then();
    }

    public async init(){
        // Load saved reminders
        let [err, reminders] = await handlePromise(this.reminderRepository.findAll());

        if(err){
            throw new Error(`Error loading reminders: ${err.message}`);
        }

        for(let reminder of reminders!){
            let [canRegister, message] = this.eventReminder.canRegisterReminder(reminder);
            if(!canRegister){
                this.log(`Can't register reminder: ${reminder}: ${message}`);
                await this.reminderRepository.delete(reminder.id);
                continue;
            }
            this.log(`Loaded persisted reminder: ${reminder.id}`);
            this.eventReminder.registerReminder(reminder);
        }

    }

    private registerEventReminderHandler() {
        this.eventReminder.on('reminder', (reminder) => {
            this.clients.forEach((client) => {
                client.send(`We are reminding you from this event: ${reminder.name}`);
                this.reminderRepository.delete(reminder.id).then();
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
        ws.on('message', async (message) => {
            await this.initPromise; // Only handle messages when app is fully initialized

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

                    let [err] = await handlePromise(this.reminderRepository.save(reminder));

                    if(err){
                        return ws.send(`Error saving reminder: ${err.message}`);
                    }

                    this.eventReminder.registerReminder(reminder);

                    ws.send(`Registered event reminder. We have ${this.clients.size} connected clients.`);
                    break;
                case "list-event-reminders":
                    let reminders = this.eventReminder.listActiveReminders();
                    ws.send(JSON.stringify(reminders));
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