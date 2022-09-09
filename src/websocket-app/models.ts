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

    public canRegisterReminder(reminder: Reminder) : [canRegister : boolean, message? : string] {
        if(!isFinite(reminder.date.getTime?.())) return [false, "Invalid date"];
        if(EventReminder.isExpired(reminder)) return [false, "Reminder is already expired"];
        return [true];
    }

    public registerReminder(reminder: Reminder) {
        let [canRegister, message] = this.canRegisterReminder(reminder);
        if(!canRegister) throw new Error(message);

        let timeUntilReminder = EventReminder.timeUntilReminder(reminder);
        let timeoutId = setTimeout(()=>{
            this.emit('reminder', reminder);
            this.reminderTimeoutMap.delete(reminder.id);
        }, timeUntilReminder);

        this.reminderTimeoutMap.set(reminder.id, timeoutId);
    }

    public unregisterReminder(reminderID: ReminderID) {
        if(!this.reminderTimeoutMap.has(reminderID)) return;

        clearTimeout(this.reminderTimeoutMap.get(reminderID));
        this.reminderTimeoutMap.delete(reminderID);
    }

}