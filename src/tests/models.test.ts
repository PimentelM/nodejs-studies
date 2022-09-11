import {Reminder} from "../models";
import {getValidId} from "./test-utils";

describe('Models', () => {
    it('Should be possible to create a reminder', () => {
        let date = new Date();
        let reminder = new Reminder(getValidId(), "Test reminder", date);
        expect(reminder.name).toBe("Test reminder");
        expect(reminder.date.getTime()).toBe(date.getTime());
        expect(reminder.id).not.toBeUndefined();
    });

});