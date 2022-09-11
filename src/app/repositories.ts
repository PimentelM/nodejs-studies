import {Reminder} from "./models";
import fs from "fs";

export interface IReminderRepository {
    save(reminder: Reminder): Promise<Reminder>;
    findById(reminderID: string): Promise<Reminder | undefined>;
    delete(reminderID: string): Promise<void>;
    findAll(): Promise<Reminder[]>;
    deleteAll(): Promise<void>;
    findByName(name: string): Promise<Reminder[]>;
}

export class InMemoryReminderRepository implements IReminderRepository {
    private reminders: Map<string, Reminder> = new Map();

    async save(reminder: Reminder): Promise<Reminder> {
        this.reminders.set(reminder.id, reminder);
        return reminder;
    }

    async findById(reminderID: string): Promise<Reminder | undefined> {
        return this.reminders.get(reminderID);
    }

    async delete(reminderID: string): Promise<void> {
        this.reminders.delete(reminderID);
    }

    async findAll(): Promise<Reminder[]> {
        return Array.from(this.reminders.values());
    }

    async findByName(name: string): Promise<Reminder[]> {
        return Array.from(this.reminders.values()).filter(reminder => reminder.name === name);
    }

    async deleteAll(): Promise<void> {
        this.reminders.clear();
    }

}

export class FileSystemBasedReminderRepository implements IReminderRepository {
    constructor(private folderPath: string) {
        // Create the folder if it does not exist
        if(!fs.existsSync(folderPath)){
            fs.mkdirSync(folderPath);
        }
    }

    async save(reminder: Reminder): Promise<Reminder> {
        // Serialize the reminder
        let serializedReminder = JSON.stringify({
            id: reminder.id,
            name: reminder.name,
            date: reminder.date.getTime(),
        });
        // Save it to the file system with the reminderID as the file name
        fs.writeFileSync(`${this.folderPath}/${reminder.id}`, serializedReminder);
        // Return the reminder
        return reminder;
    }

    async findById(reminderID: string): Promise<Reminder | undefined> {
        // See if there is a file with the reminderID as the file name
        let filePath = `${this.folderPath}/${reminderID}`;
        if(!fs.existsSync(filePath)) return undefined;

        // Read the file
        let serializedReminder = fs.readFileSync(filePath).toString();

        // Deserialize the reminder
        let data = JSON.parse(serializedReminder);

        // Return the reminder
        return new Reminder(data.id, data.name, new Date(data.date));
    }

    async delete(reminderID: string): Promise<void> {
        // See if there is a file with the reminderID as the file name
        let filePath = `${this.folderPath}/${reminderID}`;
        if(!fs.existsSync(filePath)) return;

        // Delete the file
        fs.unlinkSync(filePath);
    }

    async findAll(): Promise<Reminder[]> {
        // Get all the files in the folder
        let files = fs.readdirSync(this.folderPath);

        // Read all the files and deserialize the reminders
        return files.map(file => {
            let serializedReminder = fs.readFileSync(`${this.folderPath}/${file}`).toString();
            let data = JSON.parse(serializedReminder);
            return new Reminder(data.id, data.name, new Date(data.date));
        });
    }

    async findByName(name: string): Promise<Reminder[]> {
        // Get all the reminders
        let reminders = await this.findAll();

        // Filter the reminders by name
        return reminders.filter(reminder => reminder.name === name);
    }

    async deleteAll(): Promise<void> {
        // Get all the files in the folder
        let files = fs.readdirSync(this.folderPath);

        // Delete all the files
        files.forEach(file => {
            fs.unlinkSync(`${this.folderPath}/${file}`);
        });
    }
}

