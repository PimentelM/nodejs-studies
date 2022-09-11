import {App, AppCommand} from "../app";
import WebSocket from "ws";
import {
    createOpenSocket,
    getValidId,
    sendMessageAndWaitForResponse,
    waitForNextMessage,
    waitForSocketState
} from "./test-utils";
import {InMemoryReminderRepository} from "../repositories";
import {randomUUID} from "crypto";

describe("Event Reminder App", () => {

    let port = 65501;
    let wss: WebSocket.Server;
    let app: App;
    let reminderRepository: InMemoryReminderRepository;

    let ws: WebSocket;

    async function initializeApp(repository?: InMemoryReminderRepository) {
        wss = new WebSocket.Server({port});
        reminderRepository = repository ?? new InMemoryReminderRepository();
        app = new App(wss, reminderRepository);

        ws = new WebSocket(`ws://localhost:${port}`);
        await waitForSocketState(ws, WebSocket.OPEN);
    }

    async function closeApp() {
        ws.close();
        await waitForSocketState(ws, WebSocket.CLOSED);
        wss.close();
    }

    beforeEach(async () => {
        // Resets the whole app, so we don't have random reminders from previous tests popping up
        await initializeApp();
    });

    afterEach(async () => {
        await closeApp();
    });

    it("Should persist reminders between app restarts", async () => {
        let command = getValidCommand({name: "This event survived an app restart"}, 100);
        await sendMessageAndWaitForResponse(ws, command);
        let currentRepository = reminderRepository;

        // Restart app
        await closeApp();
        await initializeApp(currentRepository);

        // Check if reminder is still there
        let response = await sendMessageAndWaitForResponse(ws, {type: "list-event-reminders"});
        let reminders = JSON.parse(response);
        expect(reminders.length).toBe(1);
    });


    it("Handles malformed messages", async () => {
        let response = await sendMessageAndWaitForResponse(ws, "malformed message");

        expect(response).toMatch(/.*Error.*/i)
    });

    it("Handles unknown commands", async () => {
        let command = {type: "unknown"};

        let response = await sendMessageAndWaitForResponse(ws, command);

        expect(response).toMatch(/.*Unknown message.*/i)
    });

    describe("[Command] list-event-reminders", () => {

        it("Should return empty list if no reminders are registered", async () => {
            let response = await sendMessageAndWaitForResponse(ws, {type: "list-event-reminders"});
            let reminders = JSON.parse(response);
            expect(reminders).toEqual([]);
        });

        it("Should return list of reminders", async () => {
            let command = getValidCommand({name: "Event1"}, 100);
            await sendMessageAndWaitForResponse(ws, command);
            command = getValidCommand({name: "Event2"}, 100);
            await sendMessageAndWaitForResponse(ws, command);

            let response = await sendMessageAndWaitForResponse(ws, {type: "list-event-reminders"});

            let reminders = JSON.parse(response);
            let reminderNames = reminders.map((r: any) => r.name);
            expect(reminders.length).toBe(2);
            expect(reminderNames).toContain("Event1");
            expect(reminderNames).toContain("Event2");
        });

    });

    describe("[Command] register-event-reminder", () => {

        describe("When the command is valid", () => {

            it("should save event reminder to the database", async () => {
                let command = getValidCommand({name: "Saved to the Database"});

                let response = await sendMessageAndWaitForResponse(ws, command);

                // Check the event was saved to database
                let [reminder] = await reminderRepository.findByName("Saved to the Database");
                expect(reminder).toBeDefined();
            });

            it("should send back a success message", async () => {
                let command = getValidCommand({name: "Successful Event"});

                let response = await sendMessageAndWaitForResponse(ws, command);

                // Check the response is a success message
                expect(response).toMatch(/.*Registered event reminder.*/i)
            });

            it("should receive a reminder when the event is due", async () => {
                let command = getValidCommand({name: "Single Client Event"}, 20);

                let response = await sendMessageAndWaitForResponse(ws, command);
                let reminderMessage = await waitForNextMessage(ws);

                expect(response).toMatch(/.*Registered event reminder.*/i)
                expect(reminderMessage).toMatch(/.*Single Client Event.*/i)
            });

            it("Due reminder is broadcasted to all clients", async () => {
                let command = getValidCommand({name: "Broadcast Event Name"}, 30);
                let ws2 = await createOpenSocket(port);
                let ws3 = await createOpenSocket(port);

                let response = await sendMessageAndWaitForResponse(ws, command);
                let [r1, r2, r3] = await Promise.all([ws, ws2, ws3].map(ws => waitForNextMessage(ws)));

                expect(response).toMatch(/.*Registered event reminder.*/i)
                expect(r1).toMatch(/.*Broadcast Event Name.*/i);
                expect(r2).toMatch(/.*Broadcast Event Name.*/i);
                expect(r3).toMatch(/.*Broadcast Event Name.*/i);

                // Close the sockets
                ws2.close();
                ws3.close();
                await waitForSocketState(ws2, WebSocket.CLOSED);
                await waitForSocketState(ws3, WebSocket.CLOSED);
            });

        });

        describe("When the command is invalid", () => {

            it("Should not register reminder if name is missing", async () => {
                let id = getValidId();
                let command = getValidCommand({id});
                delete command.name;

                let response = await sendMessageAndWaitForResponse(ws, command);

                expect(response).toMatch(/.*Error.*/i)
                expect(await reminderRepository.findById(id)).toBeUndefined();
            });

            it("Should not register reminder if date is missing", async () => {
                let id = getValidId();
                let command = getValidCommand({id});
                delete command.date;

                let response = await sendMessageAndWaitForResponse(ws, command);

                expect(response).toMatch(/.*Error.*/i)
                expect(await reminderRepository.findById(id)).toBeUndefined();
            })

            it("Should not register reminder if date is invalid", async () => {
                let id = getValidId();
                let command = getValidCommand({id, date: "invalid date"});

                let response = await sendMessageAndWaitForResponse(ws, command);

                expect(response).toMatch(/.*Error.*/i)
                expect(await reminderRepository.findById(id)).toBeUndefined();
            });

            it("Should not register reminder if it's alredy expired", async () => {
                let id = getValidId();
                let date = new Date();
                date.setFullYear(date.getFullYear() - 1);
                let command = getValidCommand({id, date: date.toISOString()});

                let response = await sendMessageAndWaitForResponse(ws, command);

                expect(response).toMatch(/.*already expired.*/i)
                expect(await reminderRepository.findById(id)).toBeUndefined();
            });
        });

    });

});


function getValidCommand(overwrites?: object, milissecondsFromNow?: number): AppCommand {
    return {
        type: "register-event-reminder",
        name: "event-name",
        date: Date.now() + (milissecondsFromNow ?? 15),
        ...overwrites
    }
}



