// testing.js
// const queries = require('/Users/joshua/Documents/GitHub/digital-pa-system/queries.js');
const queries = require(',/queries.js');

(async () => {
  try {
    // 1. Create all tables
    await queries.createUsers();
    await queries.createTasks();
    await queries.createTaskRel();
    await queries.createTaskUserRel();
    await queries.createMeeting();
    await queries.createMeetingUserRel();
    console.log('All tables created.');

    // 2. Insert test data
    console.log(await queries.newUser('admin', 'admin2@example.com', 'adminpw', 'IT admin', 'IT'));
    console.log(await queries.newUser('tester', 'tester2@example.com', 'testpw', 'Test Dummy', 'IT'));

    // Insert a task with assigned UIDs = [1, 2]
    console.log(await queries.newTask('task1', '2025-01-16 00:00:00', ['1', '2']));

    // Insert a subtask under mainTaskID=1 with assigned UIDs = [1, 2]
    console.log(await queries.newSubTask('1', 'subtask1', '2025-01-15 00:00:00', ['1', '2']));

    // Insert a new meeting
    console.log(await queries.newMeet('Testing functions', '2025-01-15 01:00:00', '3600', ['1', '2']));

    // 3. Show all
    console.log('\n\n=== SHOW ALL TABLES ===');
    await queries.showAll('users');
    await queries.showAll('tasks');
    await queries.showAll('taskRel');
    await queries.showAll('taskUserRel');
    await queries.showAll('meetings');
    await queries.showAll('meetingRel');

    // 4. Remove an entry
    // console.log(await queries.removeEntry('users', '2'));

    // 5. Drop a table (with passcode)
    // console.log(await queries.removeDB('users', 'goodbye123'));
  } catch (err) {
    console.error('Error in testing:', err);
  } finally {
    // Node typically will exit automatically unless there's an open handle.
    // If want to close the DB here, do:
    // queries.closeDB();
  }
})();
