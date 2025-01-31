// script.js

let nav = 0;
let clicked = null;
let tasks = [];      // was events
let meetings = [];   // stays the same

// DOM references
const calendar = document.getElementById('calendar');
const newEventModal = document.getElementById('newEventModal');
const addEventModal = document.getElementById('addEventModal');
// const deleteEventModal = document.getElementById('deleteEventModal');
const CalendarEventModal = document.getElementById('CalendarEventModal');
const newMeetingModal = document.getElementById('newMeetingModal');
const backDrop = document.getElementById('modalBackDrop');

// Task inputs
const taskSummaryInput = document.getElementById('taskSummaryInput');
const taskDescriptionInput = document.getElementById('taskDescriptionInput');
const taskUsersInput = document.getElementById('taskUsersInput');
const taskDateInput = document.getElementById('taskDateInput');

// second set (for addEventModal)
const taskSummaryInput2 = document.getElementById('taskSummaryInput2');
const taskDescriptionInput2 = document.getElementById('taskDescriptionInput2');
const taskUsersInput2 = document.getElementById('taskUsersInput2');

// Meeting inputs
const meetSummaryInput = document.getElementById('meetSummaryInput');
const meetDateInput = document.getElementById('meetDateInput');
const meetDescriptionInput = document.getElementById('meetDescriptionInput');
const meetDurationInput = document.getElementById('meetDurationInput');
const meetUsersInput = document.getElementById('meetUsersInput');

const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Keep the DO NOT REMOVE portion intact (the load() function):
function load() {
  const dt = new Date();

  if (nav !== 0) {
    dt.setMonth(new Date().getMonth() + nav);
  }

  const day = dt.getDate();
  const month = dt.getMonth();
  const year = dt.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dateString = firstDayOfMonth.toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric', 
  });
  const paddingDays = weekdays.indexOf(dateString.split(', ')[0]);

  document.getElementById('monthDisplay').innerText = 
    `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;

  calendar.innerHTML = '';

  for(let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('day');

    const dayString = `${year}-${month + 1}-${i - paddingDays}`;  

    if (i > paddingDays) {
      daySquare.innerText = i - paddingDays;
      
      if (i - paddingDays === day && nav === 0) {
        daySquare.id = 'currentDay';
      }

      // Instead of .find(...), we want .filter(...) to get multiple tasks
      const tasksForDay = tasks.filter(t => dateMatches(t.date, dayString));
      const meetsForDay = meetings.filter(m => dateMatches(m.date, dayString));

      tasksForDay.forEach(t => {
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event');
        eventDiv.innerText = t.summary;
        daySquare.appendChild(eventDiv);
      });

      meetsForDay.forEach(m => {
        const meetDiv = document.createElement('div');
        meetDiv.classList.add('meeting');
        meetDiv.innerText = m.summary;
        daySquare.appendChild(meetDiv);
      });

      daySquare.addEventListener('click', () => openModal(dayString));
    } else {
      daySquare.classList.add('padding');
    }

    calendar.appendChild(daySquare);
  }
}

// Open modal for clicked date
function openModal(date) {
  clicked = date;
  CalendarEventModal.style.display = 'block';
  backDrop.style.display = 'block';
}

// Close modals
function closeModal() {
  newEventModal.style.display = 'none';
  deleteEventModal.style.display = 'none';
  CalendarEventModal.style.display = 'none';
  addEventModal.style.display = 'none';
  newMeetingModal.style.display = 'none';
  backDrop.style.display = 'none';

  // Clear form fields
  taskSummaryInput.value = '';
  taskSummaryInput2.value = '';
  taskUsersInput.value = '';
  taskUsersInput2.value = '';

  clicked = null;
  load();
}

// Save a new Task
async function saveTask() {
  const summary = taskSummaryInput.value || taskSummaryInput2.value;
  const description = taskDescriptionInput.value || taskDescriptionInput2.value;
  const users = taskUsersInput.value || taskUsersInput2.value;
  const dateVal = taskDateInput.value || clicked; // fallback to clicked date if not specified

  // if (!summary) {
  //   return;
  // }

  const newTask = {
    summary,
    description,
    date: dateVal,
    users
  };

  try {
    // POST /api/tasks
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    if (!res.ok) throw new Error('Failed to create task');

    await loadDataFromServer();
    closeModal();
  } catch (err) {
    console.error('Error saving task:', err);
  }
}

// Save a new Meeting
async function saveMeet() {
  if (!meetSummaryInput.value) {
    meetSummaryInput.classList.add('error');
    return;
  }
  const newMeetObj = {
    summary: meetSummaryInput.value,
    description: meetDescriptionInput.value,
    date: meetDateInput.value,
    duration: meetDurationInput.value,
    users: meetUsersInput.value
  };

  try {
    // POST /api/meetings
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMeetObj)
    });
    if (!res.ok) throw new Error('Failed to create meeting');

    await loadDataFromServer();
    closeModal();
  } catch (err) {
    console.error('Error saving meeting:', err);
  }
}

// Load tasks & meetings from DB
async function loadDataFromServer() {
  try {
    const tasksRes = await fetch('/api/tasks');
    tasks = await tasksRes.json();

    const meetsRes = await fetch('/api/meetings');
    meetings = await meetsRes.json();

    // Fill the "Upcoming Tasks" and "Meetings" columns if desired
    populateTaskList();
    populateMeetingsList();

    // Now redraw the calendar
    load();
  } catch (err) {
    console.error('Error loading data from server:', err);
  }
}

// Example: populate tasks in the left column
function populateTaskList() {
  const taskListContainer = document.getElementById('taskListContainer');
  if (!taskListContainer) return;

  taskListContainer.innerHTML = ''; // clear
  tasks.forEach(t => {
    const div = document.createElement('div');
    div.textContent = `${t.summary} - ${t.date}`;
    div.classList.add('event');
    taskListContainer.appendChild(div);
  });
}

// Example: populate meetings in the right column
function populateMeetingsList() {
  const meetListContainer = document.getElementById('meetingsListContainer');
  if (!meetListContainer) return;

  meetListContainer.innerHTML = ''; // clear
  meetings.forEach(m => {
    const div = document.createElement('div');
    div.textContent = `${m.summary} - ${m.date}`;
    div.classList.add('meeting');
    meetListContainer.appendChild(div);
  });
}

// // (Optional) Example delete function
// async function deleteTask() {
//   // If you have /api/tasks/:id for deletion
//   closeModal();
// }

// UI Helpers
function addTaskModal() {
  addEventModal.style.display = 'block';
  CalendarEventModal.style.display = 'none';
  backDrop.style.display = 'block';
}

function newTaskModal() {
  newEventModal.style.display = 'block';
  backDrop.style.display = 'block';
}

function newMeeting() {
  newMeetingModal.style.display = 'block';
  backDrop.style.display = 'block';
}

// Initialize everything
function initButtons() {
  document.getElementById('nextButton').addEventListener('click', () => {
    nav++;
    load();
  });
  document.getElementById('backButton').addEventListener('click', () => {
    nav--;
    load();
  });

  // create Task
  document.getElementById('saveButton').addEventListener('click', saveTask);
  document.getElementById('save2Button').addEventListener('click', saveTask);

  // meeting
  document.getElementById('saveCreateMeetButton').addEventListener('click', saveMeet);

  // closes
  document.getElementById('cancelButton').addEventListener('click', closeModal);
  document.getElementById('cancel2Button').addEventListener('click', closeModal);
  document.getElementById('cancel3Button').addEventListener('click', closeModal);
  document.getElementById('cancelCreateMeetButton').addEventListener('click', closeModal);
  document.getElementById('closeButton').addEventListener('click', closeModal);

  // new
  document.getElementById('addButton').addEventListener('click', addTaskModal);
  document.getElementById('createEventButton').addEventListener('click', newTaskModal);
  document.getElementById('createMeetButton').addEventListener('click', newMeeting);

  // // Delete example
  // document.getElementById('deleteButton').addEventListener('click', deleteTask);

  // Manage Users button
  const manageBtn = document.getElementById('manageUsersButton');
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      window.location.href = 'manage_users.html';
    });
  }
}

function populateMeetingsList() {
  const meetListContainer = document.getElementById('meetingsListContainer');
  if (!meetListContainer) return;

  meetListContainer.innerHTML = ''; // clear old
  meetings.forEach(m => {
    const div = document.createElement('div');
    // If m.date is something like "2025-01-15T10:00:00"
    // parse it as a Date:
    const dt = new Date(m.date);
    const localTime = dt.toLocaleString(); // shows date + time in user’s locale
    div.textContent = `${m.summary} - ${localTime} (duration: ${m.duration || ''})`;
    div.classList.add('meeting');
    meetListContainer.appendChild(div);
  });
}

// Helper to unify date format
function dateMatches(dbDate, dayString) {
  // If dbDate is already "YYYY-MM-DD", just do: return dbDate.startsWith(dayString);
  // Otherwise parse:
  const dObj = new Date(dbDate);
  const y = dObj.getFullYear();
  const m = dObj.getMonth() + 1;
  const d = dObj.getDate();
  const iso = `${y}-${m}-${d}`;
  return iso === dayString;
}

initButtons();
// Load from DB by default, so data appears right away
loadDataFromServer();
