const express = require('express');
const path = require('path');
const queries = require('./queries.js'); // import DB logic

const app = express();
app.use(express.json());

// Serve frontend (index.html, style.css, script.js) from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// --------------------- EVENTS (TASKS) ---------------------

// GET /api/events - read all tasks from DB
app.get('/api/events', async (req, res) => {
  try {
    // In queries, there's no "events" table, so we can reuse "tasks"
    const rows = await queries.showAll('tasks'); // returns an array
    // Convert them to the shape script.js expects, e.g. { summary, date, ... }
    // We'll assume tasks has "taskName" + "deadline" that map to "summary" + "date"
    const events = rows.map(t => ({
      summary: t.taskName,
      date: t.deadline.split('T')[0], // or whatever format
    }));
    return res.json(events);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Unable to fetch events' });
  }
});

// POST /api/events - create a new task in DB
app.post('/api/events', async (req, res) => {
  try {
    const { summary, date } = req.body; 
    // Possibly also read `description`, `users`, etc., if needed
    // queries.newTask(taskName, deadline, UIDs)
    // For now, let's assume no user IDs -> []
    const resultMsg = await queries.newTask(summary, date, []);
    return res.json({ message: resultMsg });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------- MEETINGS -------------------

// GET /api/meetings - read all meetings
app.get('/api/meetings', async (req, res) => {
  try {
    const rows = await queries.showAll('meetings');
    const meetings = rows.map(m => ({
      summary: m.meetingObj,
      date: m.time.split('T')[0], // or parse for display
      duration: m.duration,
    }));
    return res.json(meetings);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Unable to fetch meetings' });
  }
});

// POST /api/meetings - create a new meeting in DB
app.post('/api/meetings', async (req, res) => {
  try {
    const { summary, date, duration } = req.body;
    // queries.newMeet(meetObj, time, duration, UIDs)
    const resultMsg = await queries.newMeet(summary, date, duration, []);
    return res.json({ message: resultMsg });
  } catch (err) {
    console.error('Error creating meeting:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});

//<----- new stuff ---->

app.get('/api/users', async (req, res) => {
  try {
    // queries.showAll('users')
    const data = await queries.showAll('users'); 
    // Return JSON array of user rows
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    // queries.newUser(username, email, pw, role, dept)
    const { username, email, password, role, dept } = req.body;
    const msg = await queries.newUser(username, email, password, role, dept);
    res.json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    // removeEntry('users', uid)
    await queries.removeEntry('users', uid);
    res.json({ message: `User ${uid} removed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For tasks (since we renamed events -> tasks)
app.get('/api/tasks', async (req, res) => {
  try {
    // showAll('tasks') from queries
    const rows = await queries.showAll('tasks');
    // Map each row to { summary, date, ... } for the front-end
    const tasks = rows.map(r => ({
      summary: r.taskName,
      date: r.deadline?.split(' ')[0] || '',
    }));
    res.json(tasks);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    // from script.js: { summary, description, date, users }
    const { summary, date } = req.body;
    // calls queries.newTask(taskName, deadline, UIDs)
    const msg = await queries.newTask(summary, date, []);
    res.json({ message: msg });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// For users
app.get('/api/users', async (req, res) => {
  try {
    const data = await queries.showAll('users'); 
    res.json(data); // returns the raw rows
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    // newUser(username, email, pw, role, dept)
    const { username, email, password, role, dept } = req.body;
    const result = await queries.newUser(username, email, password, role, dept);
    res.json({ message: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  try {
    await queries.removeEntry('users', req.params.uid);
    res.json({ message: `User ${req.params.uid} removed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// server.js or Express routes:
app.get('/api/users/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    // Possibly queries.getSingleUser(uid):
    const user = await queries.getSingleUser(uid); 
    // Return the user object
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const { username, email, password, role, dept } = req.body;
    // calls queries.editUser(uid, username, email, password, role, dept)
    await queries.editUser(uid, username, email, password, role, dept);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const dbRows = await queries.showAll('tasks');
    // Convert each row into { summary, date, ... } if needed
    const tasks = dbRows.map(r => ({
      summary: r.taskName,
      description: r.description, // if you have that column
      date: r.deadline, // might be "2025-01-16T10:00:00"
      users: '', 
    }));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
app.post('/api/tasks', async (req, res) => {
  try {
    const { summary, date, users } = req.body;
    // queries.newTask(taskName, deadline, UIDs)
    await queries.newTask(summary, date, []); 
    res.json({ message: 'Task created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For single user fetch
app.get('/api/users/:uid', async (req, res) => {
  try {
    const uid = req.params.uid;
    const user = await queries.getSingleUser(uid); // implement or do showAll('users').find(…)
    res.json(user);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// For put user
app.put('/api/users/:uid', async (req, res) => {
  try {
    const { username, email, password, role, dept } = req.body;
    await queries.editUser(req.params.uid, username, email, password, role, dept);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
