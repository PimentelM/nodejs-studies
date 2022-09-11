import EventEmitter from "events";

export type ReminderID = string;
export class Reminder {
    constructor(
        public readonly id: ReminderID,
        public name: string,
        public date: Date,
    ){}
}

type Timestamp = number;
export class EventReminder extends EventEmitter {
    private reminderTimeoutMap : Map<ReminderID, NodeJS.Timeout> = new Map();
    private reminderIdToReminderMap : Map<ReminderID, Reminder> = new Map();

    constructor(private now : ()=> Timestamp = Date.now) {
        super();
    }

    private isExpired(reminder: Reminder) {
        return reminder.date.getTime() < this.now();
    }

    private timeUntilReminder(reminder: Reminder) {
        return reminder.date.getTime() - this.now();
    }

    public canRegisterReminder(reminder: Reminder) : [canRegister : boolean, message? : string] {
        if(!isFinite(reminder.date.getTime?.())) return [false, "Invalid date"];
        if(this.isExpired(reminder)) return [false, "Reminder is already expired"];
        if(this.reminderIdToReminderMap.has(reminder.id)) return [false, "Reminder with the same ID alredy registered"];

        return [true];
    }

    public listActiveReminders() : Reminder[] {
        return Array.from(this.reminderIdToReminderMap.values());
    }

    public registerReminder(reminder: Reminder) {
        let [canRegister, message] = this.canRegisterReminder(reminder);
        if(!canRegister) throw new Error(message);

        let timeUntilReminder = this.timeUntilReminder(reminder);
        let timeoutId = setTimeout(()=>{
            this.emit('reminder', reminder);
            this.reminderTimeoutMap.delete(reminder.id);
            this.reminderIdToReminderMap.delete(reminder.id);
        }, timeUntilReminder);

        this.reminderTimeoutMap.set(reminder.id, timeoutId);
        this.reminderIdToReminderMap.set(reminder.id, reminder);
    }

    public unregisterReminder(reminderID: ReminderID) {
        if(!this.reminderTimeoutMap.has(reminderID)) return;

        clearTimeout(this.reminderTimeoutMap.get(reminderID));
        this.reminderTimeoutMap.delete(reminderID);
        this.reminderIdToReminderMap.delete(reminderID);
    }

}