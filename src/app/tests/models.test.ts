import {EventReminder, Reminder} from "../models";
import {getValidId, getValidReminder, waitForEvent} from "./test-utils";

describe('Models', () => {

    describe('Reminder', () => {

        it('Should be possible to create a reminder', () => {
            let date = new Date();
            let reminder = new Reminder(getValidId(), "Test reminder", date);
            expect(reminder.name).toBe("Test reminder");
            expect(reminder.date.getTime()).toBe(date.getTime());
            expect(reminder.id).not.toBeUndefined();
        });

        it("Should not be possible to create a reminder with an invalid date", () => {
            let action = () => new Reminder(getValidId(), "Test reminder", new Date("invalid date"))
            expect(action).toThrow();
        });

    });

    describe("EventReminder", () => {
        let eventReminder: EventReminder;

        beforeEach(() => {
            eventReminder = new EventReminder();
        });

        it("Reminder should throw a 'reminder' event when it's due", async () => {
            let date = new Date(Date.now() + 10);
            let reminder = getValidReminder({date});
            let promise = waitForEvent(eventReminder, "reminder", 30);

            eventReminder.registerReminder(reminder);
            let thrownReminder = await promise;

            expect(thrownReminder).toEqual(reminder);
        });

        it("Reminder should not be thrown when it is unregistered", async () => {
            let date = new Date(Date.now() + 5);
            let reminder = getValidReminder({date});
            let promise = waitForEvent(eventReminder, "reminder", 10);

            eventReminder.registerReminder(reminder);
            eventReminder.unregisterReminder(reminder.id);
            let thrownReminder = await promise

            expect(thrownReminder).toBeUndefined();
        });

        it("Reminder can be overwritten if it is registered again", async () => {
            let reminder = getValidReminder({name: "Old Name", date: new Date(Date.now() + 15)});
            let promise = waitForEvent(eventReminder, "reminder", 30);

            eventReminder.registerReminder(reminder);
            reminder.name = "New Name";
            eventReminder.registerReminder(reminder);

            let thrownReminder = await promise;

            expect(thrownReminder).toBeDefined();
            expect(thrownReminder.name).toEqual("New Name");
        });


    });



});