import {RawData} from "ws";
import {tryCatch} from "./utils";

type CommandType = "register-event-reminder";

type AppCommand = {
    type: CommandType;
    [key: string]: any;
}

export class App {

    static parseMessage(message: string) : AppCommand {
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