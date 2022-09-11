import {App, AppCommand} from "./app";
import WebSocket from "ws";
import {createOpenSocket, sendMessageAndWaitForResponse, waitForNextMessage, waitForSocketState} from "./test-utils";

describe("Event Reminder App", () => {

    let port = 65501;
    let wss: WebSocket.Server;
    let app: App;
    let testCount = 0;

    let ws: WebSocket;

    beforeEach(async () => {
        // Resets the whole app, so we don't have random reminders from previous tests popping up
        wss = new WebSocket.Server({ port });
        app = new App(wss);

        ws = new WebSocket(`ws://localhost:${port}`);
        await waitForSocketState(ws, WebSocket.OPEN);
    });

    afterEach(async () => {
        ws.close();
        await waitForSocketState(ws, WebSocket.CLOSED);
        wss.close();
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


    describe("[Command] register-event-reminder", () => {

        describe("When the command is valid", () => {
            let getValidCommand = (name: string, milissecondsFromNow?: number) : AppCommand => ({
                type: "register-event-reminder",
                name: name,
                date: Date.now() + (milissecondsFromNow ?? 15)
            });

            it.skip("should save event reminder to the database", () => {
                // Check the event was saved to database

            });

            it("should send back a success message", async () => {
                let command = getValidCommand("Successful Event");

                let response = await sendMessageAndWaitForResponse(ws, command);

                // Check the response is a success message
                expect(response).toMatch(/.*Registered event reminder.*/i)
            });

            it("should receive a reminder when the event is due", async () => {
                let command = getValidCommand("Single Client Event", 20);

                let response = await sendMessageAndWaitForResponse(ws, command);
                let reminderMessage = await waitForNextMessage(ws);

                expect(response).toMatch(/.*Registered event reminder.*/i)
                expect(reminderMessage).toMatch(/.*Single Client Event.*/i)
            });

            it("Due reminder is broadcasted to all clients", async () => {
                let command = getValidCommand("Broadcast Event Name", 30);
                let ws2 = await createOpenSocket(port);
                let ws3 = await createOpenSocket(port);

                let response = await sendMessageAndWaitForResponse(ws, command);
                let [r1,r2,r3] = await Promise.all([ws, ws2, ws3].map(ws => waitForNextMessage(ws)));

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
    });
})


