import {FileSystemBasedReminderRepository, InMemoryReminderRepository} from "../repositories";
import {getValidId, getValidReminder} from "./test-utils";

FileSystemBasedReminderRepository.prototype.toString = ()=> FileSystemBasedReminderRepository.name;
InMemoryReminderRepository.prototype.toString = ()=> InMemoryReminderRepository.name;

describe('Repositories', () => {
    let inMemoryReminderRepository: InMemoryReminderRepository = new InMemoryReminderRepository();
    let fileSystemBasedReminderRepository: FileSystemBasedReminderRepository = new FileSystemBasedReminderRepository("_TEST_PERISTENCE_PATH_");

    describe.each([inMemoryReminderRepository,fileSystemBasedReminderRepository])("%s", (repository: any) => {

        beforeEach(async () => {
            await repository.deleteAll();
        });

        it("Should be possible to retreive a saved reminder by ID", async () => {
            let reminder = getValidReminder();

            await repository.save(reminder);

            let retrievedReminder = await repository.findById(reminder.id);
            expect(retrievedReminder).toEqual(reminder);
        });

        it("Should be possible to retreive a saved reminder by name", async () => {
            let reminder = getValidReminder();

            await repository.save(reminder);

            let retrievedReminder = await repository.findByName(reminder.name);
            expect(retrievedReminder).toEqual([reminder]);
        });

        it("Should be possible to retreive all saved reminders", async () => {
            let reminder1 = getValidReminder();
            let reminder2 = getValidReminder();

            await repository.save(reminder1);
            await repository.save(reminder2);

            let retrievedReminders = await repository.findAll();
            let retrievedRemindersIds = retrievedReminders.map(reminder => reminder.id);
            expect(retrievedRemindersIds).toContain(reminder1.id);
            expect(retrievedRemindersIds).toContain(reminder2.id);
        });

        it("Should be possible to delete a reminder by ID", async () => {
            let reminder = getValidReminder();

            await repository.save(reminder);
            await repository.delete(reminder.id);

            let retrievedReminder = await repository.findById(reminder.id);
            expect(retrievedReminder).toBeUndefined();
        });

        it("Should be possible to delete all reminders", async () => {
            let reminder1 = getValidReminder();
            let reminder2 = getValidReminder();

            await repository.save(reminder1);
            await repository.save(reminder2);
            await repository.deleteAll();

            let retrievedReminders = await repository.findAll();
            expect(retrievedReminders).toEqual([]);
        });

        it("Should be able to replace saved register when ID is the same", async ()=>{
            let id = getValidId();
            let reminder = getValidReminder({id, name: "Old name"});
            await repository.save(reminder);

            let newReminder = getValidReminder({id, name: "New name"});
            await repository.save(newReminder);

            let retrievedReminder = await repository.findById(id);
            expect(retrievedReminder).toEqual(newReminder);

        })


    });

});

