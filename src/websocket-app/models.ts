import {randomUUID} from "crypto";
import EventEmitter from "events";

export type ReminderID = string;

export class Reminder {
    public readonly id: ReminderID = randomUUID();
    constructor(
        public name: string,
        public date: Date,
    ){}
}

export class EventReminder extends EventEmitter {
    private reminderTimeoutMap : Map<ReminderID, NodeJS.Timeout> = new Map();

    constructor() {
        super();
    }

    static isExpired(reminder: Reminder) {
        return reminder.date.getTime() < Date.now();
    }

    static timeUntilReminder(reminder: Reminder) {
        return reminder.date.getTime() - Date.now();
    }

    public registerReminder(reminder: Reminder) {
        if(EventReminder.isExpired(reminder)) throw new Error("Reminder is already expired");

        let timeUntilReminder = EventReminder.timeUntilReminder(reminder);
        let timeoutId = setTimeout(()=>{
            this.emit('reminder', reminder);
            this.reminderTimeoutMap.delete(reminder.id);
        }, timeUntilReminder);

        this.reminderTimeoutMap.set(reminder.id, timeoutId);
    }

    public unregisterReminder(reminderID: ReminderID) {
        clearTimeout(this.reminderTimeoutMap.get(reminderID));
        this.reminderTimeoutMap.delete(reminderID);
    }

}