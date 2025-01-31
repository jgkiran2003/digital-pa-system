
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1) Path to data.db
const dbPath = path.join(__dirname, 'data.db');

// 2) Open the SQLite database (single global connection for simplicity).
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database:', dbPath);
  }
});

/************************************************
 *                  DELETE / REMOVE
 ************************************************/
/**
 * removeDB(tableID)
 *  - Drops the entire table if passcode matches "goodbye123".
 */
async function removeDB(tableID, passcode) {
  return new Promise((resolve, reject) => {
    if (passcode !== 'goodbye123') {
      return reject(new Error('Error: Wrong Passcode'));
    }

    console.log('Removing table:', tableID);
    db.run(`DROP TABLE IF EXISTS "${tableID}"`, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(`Removed table "${tableID}" successfully.`);
    });
  });
}

/**
 * removeEntry(tableID, genID)
 *  - Removes an entry from a table based on its primary key, plus related references in other tables.
 */
async function removeEntry(tableID, genID) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Determine the primary key column
      db.all(`PRAGMA table_info("${tableID}")`, (err, columns) => {
        if (err) return reject(err);
        if (!columns || columns.length === 0) {
          return reject(new Error(`Table "${tableID}" not found or has no columns.`));
        }

        const header = columns[0].name; // e.g. UID, taskID, meetingID

        // Delete from main table
        db.run(
          `DELETE FROM "${tableID}" WHERE "${header}" = ?`,
          [genID],
          function (errDel) {
            if (errDel) return reject(errDel);

            // Cascade delete
            if (header === 'UID') {
              db.run(`DELETE FROM taskUserRel WHERE UID = ?`, [genID]);
              db.run(`DELETE FROM meetingRel WHERE UID = ?`, [genID]);
              db.run(`DELETE FROM users WHERE UID = ?`, [genID]);
            } else if (header === 'taskID') {
              db.run(`DELETE FROM taskRel WHERE mainTaskID = ?`, [genID]);
              db.run(`DELETE FROM taskUserRel WHERE taskID = ?`, [genID]);
            } else if (header === 'meetingID') {
              db.run(`DELETE FROM meetings WHERE meetingID = ?`, [genID]);
              db.run(`DELETE FROM meetingRel WHERE meetingID = ?`, [genID]);
            }

            resolve(`Entry with ${header}=${genID} removed from "${tableID}".`);
          }
        );
      });
    });
  });
}

/************************************************
 *                  SHOW / READ
 ************************************************/
async function showAll(tableID) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM "${tableID}"`, (err, rows) => {
      if (err) {
        return reject(err);
      }
      console.log(`=== ${tableID} ===`);
      rows.forEach((row) => console.log(row));
      resolve(rows);
    });
  });
}

/************************************************
 *               CREATE TABLES
 ************************************************/
async function createUsers() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        UID INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        dept VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    db.run(sql, (err) => (err ? reject(err) : resolve('Created (or verified) "users" table.')));
  });
}

async function createTasks() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS tasks (
        taskID INTEGER PRIMARY KEY AUTOINCREMENT,
        taskName VARCHAR(100) NOT NULL,
        deadline DATETIME NOT NULL
      )
    `;
    db.run(sql, (err) => (err ? reject(err) : resolve('Created (or verified) "tasks" table.')));
  });
}

async function createTaskRel() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS taskRel (
        mainTaskID INTEGER NOT NULL,
        subTaskID INTEGER NOT NULL
      )
    `;
    db.run(sql, (err) => (err ? reject(err) : resolve('Created (or verified) "taskRel" table.')));
  });
}

async function createTaskUserRel() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS taskUserRel (
        taskID INTEGER NOT NULL,
        UID INTEGER NOT NULL
      )
    `;
    db.run(sql, (err) => (err ? reject(err) : resolve('Created (or verified) "taskUserRel" table.')));
  });
}

async function createMeeting() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS meetings (
        meetingID INTEGER PRIMARY KEY AUTOINCREMENT,
        meetingObj VARCHAR(255) NOT NULL,
        time DATETIME NOT NULL,
        duration INTEGER NOT NULL
      )
    `;
    db.run(sql, (err) => (err ? reject(err) : resolve('Created (or verified) "meetings" table.')));
  });
}

async function createMeetingUserRel() {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS meetingRel (
        meetingID INTEGER NOT NULL,
        UID INTEGER NOT NULL
      )
    `;
    db.run(sql, (err) => (err ? reject(err) : resolve('Created (or verified) "meetingRel" table.')));
  });
}

/************************************************
 *                INSERT (new*)
 ************************************************/
async function newUser(username, email, pw, role, dept) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (username, email, password, role, dept)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(sql, [username, email, pw, role, dept], function (err) {
      if (err) return reject(err);
      resolve(`New user inserted with UID=${this.lastID}`);
    });
  });
}

async function newTask(taskName, deadline, UIDs) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO tasks (taskName, deadline) VALUES (?, ?)`,
        [taskName, deadline],
        function (err) {
          if (err) return reject(err);

          const taskID = this.lastID;
          if (Array.isArray(UIDs)) {
            UIDs.forEach((uid) => {
              db.run(`INSERT INTO taskUserRel (taskID, UID) VALUES (?, ?)`, [taskID, uid]);
            });
          }
          resolve(`New task created with taskID=${taskID}`);
        }
      );
    });
  });
}

async function newSubTask(mainTaskID, taskName, deadline, UIDs) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO tasks (taskName, deadline) VALUES (?, ?)` ,
        [taskName, deadline],
        function (err) {
          if (err) return reject(err);

          const subTaskID = this.lastID;
          db.run(
            `INSERT INTO taskRel (mainTaskID, subTaskID) VALUES (?, ?)`,
            [mainTaskID, subTaskID],
            (errRel) => {
              if (errRel) return reject(errRel);

              if (Array.isArray(UIDs)) {
                UIDs.forEach((uid) => {
                  db.run(`INSERT INTO taskUserRel (taskID, UID) VALUES (?, ?)`, [subTaskID, uid]);
                });
              }
              resolve(`New subtask (ID=${subTaskID}) linked to mainTaskID=${mainTaskID}`);
            }
          );
        }
      );
    });
  });
}

async function newMeet(meetObj, time, duration, UIDs) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO meetings (meetingObj, time, duration) VALUES (?, ?, ?)`,
        [meetObj, time, duration],
        function (err) {
          if (err) return reject(err);

          const meetingID = this.lastID;
          if (Array.isArray(UIDs)) {
            UIDs.forEach((uid) => {
              db.run(`INSERT INTO meetingRel (meetingID, UID) VALUES (?, ?)`, [meetingID, uid]);
            });
          }
          resolve(`New meeting (ID=${meetingID}) created with UIDs: ${UIDs.join(',')}`);
        }
      );
    });
  });
}

/************************************************
 *                 EDIT FUNCTIONS
 ************************************************/
/**
 * editUser(UID, username, email, password, role, dept)
 * - Edits an existing user. Fields that are null remain unchanged.
 * - Takes 6 arguments: UID(Str), username(Str), email(Str), password(Str), role(Str), dept(Str).
 */
async function editUser(UID, username, email, pw, role, dept) {
  return new Promise((resolve, reject) => {
    // Build an array of "field = ?" updates only for non-null fields
    const updates = [];
    const values = [];

    if (username !== null) {
      updates.push(`username = ?`);
      values.push(username);
    }
    if (email !== null) {
      updates.push(`email = ?`);
      values.push(email);
    }
    if (pw !== null) {
      updates.push(`password = ?`);
      values.push(pw);
    }
    if (role !== null) {
      updates.push(`role = ?`);
      values.push(role);
    }
    if (dept !== null) {
      updates.push(`dept = ?`);
      values.push(dept);
    }

    if (updates.length === 0) {
      // No fields to update
      return reject(new Error('No fields provided to edit.'));
    }

    // The final query
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE UID = ?`;
    values.push(UID); // push the UID for the WHERE clause

    db.run(sql, values, function (err) {
      if (err) return reject(err);
      if (this.changes === 0) {
        return reject(new Error(`User with UID=${UID} not found.`));
      }
      resolve(`User with UID=${UID} updated.`);
    });
  });
}

/**
 * editTask(taskID, taskName, deadline, UIDs, subTaskID, mainTaskID)
 * - Edits existing entries in tasks, plus optionally updates taskRel or taskUserRel if subTaskID/mainTaskID or UIDs are provided.
 * - Fields that are null remain unchanged.
 * - If subTaskID or mainTaskID is provided, we attempt to update the existing record in taskRel for that task. If none exists, we throw an error.
 * - If UIDs is not null, we remove old references from taskUserRel and add new ones.
 */
async function editTask(taskID, taskName, deadline, UIDs, subTaskID, mainTaskID) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1) Update tasks table if taskName or deadline are non-null
      const updates = [];
      const values = [];

      if (taskName !== null) {
        updates.push(`taskName = ?`);
        values.push(taskName);
      }
      if (deadline !== null) {
        updates.push(`deadline = ?`);
        values.push(deadline);
      }

      function doTaskUpdate(next) {
        if (updates.length === 0) {
          return next(); // no updates to tasks, skip directly
        }
        const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE taskID = ?`;
        values.push(taskID);

        db.run(sql, values, function (err) {
          if (err) return reject(err);
          if (this.changes === 0) {
            return reject(new Error(`Task with taskID=${taskID} not found.`));
          }
          next();
        });
      }

      // 2) Update taskRel if subTaskID or mainTaskID is provided
      //    We assume there's an existing record in taskRel where mainTaskID=taskID or subTaskID=taskID
      //    If none is found, we throw an error (as per doc).
      function doTaskRelUpdate(next) {
        if (subTaskID === null && mainTaskID === null) {
          return next(); // no update needed
        }

        // We need to check if this task is currently a "main task" or "sub task" in taskRel
        // So let's see if there's a row in taskRel where mainTaskID=taskID or subTaskID=taskID
        db.all(
          `SELECT * FROM taskRel
           WHERE mainTaskID = ? OR subTaskID = ?`,
          [taskID, taskID],
          (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) {
              // No existing relationship
              return reject(new Error(`No existing taskRel entry for taskID=${taskID}. Cannot edit.`));
            }

            // If the current task is the "mainTaskID", we can update subTaskID
            // If the current task is the "subTaskID", we can update mainTaskID
            // For simplicity, let's just handle one row. (If multiple, pick first?)
            const row = rows[0];

            const isMain = row.mainTaskID === parseInt(taskID);
            const isSub = row.subTaskID === parseInt(taskID);

            if (isMain && subTaskID !== null) {
              // update subTaskID
              db.run(
                `UPDATE taskRel SET subTaskID = ? WHERE mainTaskID = ?`,
                [subTaskID, taskID],
                function (err2) {
                  if (err2) return reject(err2);
                  if (this.changes === 0) {
                    return reject(
                      new Error(`Failed to update taskRel for mainTaskID=${taskID}.`)
                    );
                  }
                  next();
                }
              );
            } else if (isSub && mainTaskID !== null) {
              // update mainTaskID
              db.run(
                `UPDATE taskRel SET mainTaskID = ? WHERE subTaskID = ?`,
                [mainTaskID, taskID],
                function (err3) {
                  if (err3) return reject(err3);
                  if (this.changes === 0) {
                    return reject(
                      new Error(`Failed to update taskRel for subTaskID=${taskID}.`)
                    );
                  }
                  next();
                }
              );
            } else {
              // Mismatch: perhaps the user provided subTaskID but it's actually a subTask in the DB
              // or vice versa. We'll consider that an error scenario.
              return reject(
                new Error(
                  `Could not update taskRel. Possibly you're passing subTaskID when this is a subtask, or vice versa.`
                )
              );
            }
          }
        );
      }

      // 3) If UIDs is provided, remove old references from taskUserRel and add new ones
      function doTaskUserRelUpdate(next) {
        if (!UIDs || !Array.isArray(UIDs)) {
          return next(); // no update needed
        }
        // Remove existing references
        db.run(`DELETE FROM taskUserRel WHERE taskID = ?`, [taskID], (err) => {
          if (err) return reject(err);
          // Insert new references
          UIDs.forEach((uid) => {
            db.run(`INSERT INTO taskUserRel (taskID, UID) VALUES (?, ?)`, [taskID, uid]);
          });
          next();
        });
      }

      // Execution flow in serialize
      doTaskUpdate(() => {
        doTaskRelUpdate(() => {
          doTaskUserRelUpdate(() => {
            resolve(`Task with taskID=${taskID} edited successfully.`);
          });
        });
      });
    });
  });
}

/**
 * editMeeting(meetingID, meetingObj, time, duration, UIDs)
 * - Edits an existing meeting. If UIDs is provided, remove old references from meetingRel and add new ones.
 * - Fields that are null remain unchanged.
 */
async function editMeeting(meetingID, meetingObj, newTime, newDuration, UIDs) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1) Update the meetings table if meetingObj, time, or duration are not null
      const updates = [];
      const values = [];

      if (meetingObj !== null) {
        updates.push(`meetingObj = ?`);
        values.push(meetingObj);
      }
      if (newTime !== null) {
        updates.push(`time = ?`);
        values.push(newTime);
      }
      if (newDuration !== null) {
        updates.push(`duration = ?`);
        values.push(newDuration);
      }

      function doMeetingUpdate(next) {
        if (updates.length === 0) {
          return next(); // no changes, skip
        }
        const sql = `UPDATE meetings SET ${updates.join(', ')} WHERE meetingID = ?`;
        values.push(meetingID);

        db.run(sql, values, function (err) {
          if (err) return reject(err);
          if (this.changes === 0) {
            return reject(new Error(`Meeting with meetingID=${meetingID} not found.`));
          }
          next();
        });
      }

      // 2) If UIDs is provided, remove old references in meetingRel and add new ones
      function doMeetingRelUpdate() {
        if (!UIDs || !Array.isArray(UIDs)) {
          return resolve(`Meeting with meetingID=${meetingID} edited (no new UIDs).`);
        }
        // Remove old references
        db.run(`DELETE FROM meetingRel WHERE meetingID = ?`, [meetingID], (err) => {
          if (err) return reject(err);

          // Insert new references
          UIDs.forEach((uid) => {
            db.run(`INSERT INTO meetingRel (meetingID, UID) VALUES (?, ?)`, [meetingID, uid]);
          });
          resolve(`Meeting with meetingID=${meetingID} edited, new UIDs set: ${UIDs.join(', ')}`);
        });
      }

      doMeetingUpdate(doMeetingRelUpdate);
    });
  });
}

/************************************************
 *       1) EDIT USERS INVOLVED IN TASK/MEETING
 ************************************************/

/**
 * editTaskUsers(taskID, newUIDs)
 * - Overwrites the list of users for the given taskID.
 * - Removes all existing entries in taskUserRel for that task, then inserts newUIDs.
 */
async function editTaskUsers(taskID, newUIDs) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1) Check if the task actually exists
      db.get(`SELECT * FROM tasks WHERE taskID = ?`, [taskID], (err, row) => {
        if (err) return reject(err);
        if (!row) {
          return reject(new Error(`Task with ID ${taskID} does not exist.`));
        }

        // 2) Remove old user references
        db.run(`DELETE FROM taskUserRel WHERE taskID = ?`, [taskID], (errDel) => {
          if (errDel) return reject(errDel);

          // 3) Insert new user references
          if (Array.isArray(newUIDs)) {
            newUIDs.forEach((uid) => {
              db.run(`INSERT INTO taskUserRel (taskID, UID) VALUES (?, ?)`, [taskID, uid]);
            });
          }
          resolve(`Task ID=${taskID} updated with new user list.`);
        });
      });
    });
  });
}

/**
 * editMeetingUsers(meetingID, newUIDs)
 * - Overwrites the list of users for the given meetingID.
 * - Removes all existing entries in meetingRel for that meeting, then inserts newUIDs.
 */
async function editMeetingUsers(meetingID, newUIDs) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1) Check if the meeting actually exists
      db.get(`SELECT * FROM meetings WHERE meetingID = ?`, [meetingID], (err, row) => {
        if (err) return reject(err);
        if (!row) {
          return reject(new Error(`Meeting with ID ${meetingID} does not exist.`));
        }

        // 2) Remove old user references
        db.run(`DELETE FROM meetingRel WHERE meetingID = ?`, [meetingID], (errDel) => {
          if (errDel) return reject(errDel);

          // 3) Insert new references
          if (Array.isArray(newUIDs)) {
            newUIDs.forEach((uid) => {
              db.run(`INSERT INTO meetingRel (meetingID, UID) VALUES (?, ?)`, [meetingID, uid]);
            });
          }
          resolve(`Meeting ID=${meetingID} updated with new user list.`);
        });
      });
    });
  });
}

/************************************************
 *       2) TASK PROMOTION & DEMOTION
 ************************************************/

/**
 * promoteTask(taskID)
 * - If taskID is currently a subtask (i.e., subTaskID = taskID in taskRel),
 *   remove that row from taskRel so it is no longer a subtask.
 * - If it isn't a subtask, do nothing (or return an error if you prefer).
 */
async function promoteTask(taskID) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if taskID is in taskRel as a subTaskID
      db.get(`SELECT * FROM taskRel WHERE subTaskID = ?`, [taskID], (err, row) => {
        if (err) return reject(err);

        if (!row) {
          // Not currently a subtask
          return resolve(`Task ID=${taskID} is already a main task or doesn't exist in taskRel.`);
        }

        // Remove row from taskRel
        db.run(`DELETE FROM taskRel WHERE subTaskID = ?`, [taskID], function (errDel) {
          if (errDel) return reject(errDel);
          if (this.changes === 0) {
            return reject(new Error(`Failed to promote task ID=${taskID}.`));
          }
          resolve(`Task ID=${taskID} promoted to a main task (removed from taskRel).`);
        });
      });
    });
  });
}

/**
 * demoteTask(taskID, newMainTaskID)
 * - Makes taskID a subtask under newMainTaskID.
 * - If there's already a row in taskRel for subTaskID=taskID, we update mainTaskID.
 *   Otherwise, we create a new row.
 * - Throws an error if mainTaskID doesn't exist in tasks, or if the subtask is the same as the main (cycle).
 */
async function demoteTask(taskID, newMainTaskID) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1) Confirm both tasks exist
      db.get(`SELECT * FROM tasks WHERE taskID = ?`, [taskID], (err1, subTaskRow) => {
        if (err1) return reject(err1);
        if (!subTaskRow) {
          return reject(new Error(`Task ID=${taskID} does not exist, cannot demote.`));
        }

        db.get(`SELECT * FROM tasks WHERE taskID = ?`, [newMainTaskID], (err2, mainTaskRow) => {
          if (err2) return reject(err2);
          if (!mainTaskRow) {
            return reject(new Error(`Task ID=${newMainTaskID} does not exist, cannot set as main.`));
          }

          if (taskID === newMainTaskID) {
            return reject(new Error('Cannot set a task as a subtask of itself.'));
          }

          // 2) Check if there's already an entry in taskRel for subTaskID = taskID
          db.get(`SELECT * FROM taskRel WHERE subTaskID = ?`, [taskID], (err3, existingRow) => {
            if (err3) return reject(err3);

            if (existingRow) {
              // Update the row
              db.run(
                `UPDATE taskRel SET mainTaskID = ? WHERE subTaskID = ?`,
                [newMainTaskID, taskID],
                function (errUpd) {
                  if (errUpd) return reject(errUpd);
                  if (this.changes === 0) {
                    return reject(new Error(`Failed to demote task ID=${taskID}.`));
                  }
                  resolve(`Task ID=${taskID} demoted under mainTaskID=${newMainTaskID}.`);
                }
              );
            } else {
              // Create a new row in taskRel
              db.run(
                `INSERT INTO taskRel (mainTaskID, subTaskID) VALUES (?, ?)`,
                [newMainTaskID, taskID],
                function (errIns) {
                  if (errIns) return reject(errIns);
                  resolve(`Task ID=${taskID} is now a subtask of mainTaskID=${newMainTaskID}.`);
                }
              );
            }
          });
        });
      });
    });
  });
}
/*
function dateMatches(dbDate, dayString) {
  // Convert dbDate string -> Date object
  const dObj = new Date(dbDate);
  // Rebuild "YYYY-M-D"
  const y = dObj.getFullYear();
  const m = dObj.getMonth()+1;
  const d = dObj.getDate();
  const iso = `${y}-${m}-${d}`;
  return iso === dayString;
}
*/

/************************************************
 *                 EXPORT
 ************************************************/
module.exports = {
  // remove / delete
  removeDB,
  removeEntry,

  // show / read
  showAll,

  // create tables
  createUsers,
  createTasks,
  createTaskRel,
  createTaskUserRel,
  createMeeting,
  createMeetingUserRel,

  // insert new data
  newUser,
  newTask,
  newSubTask,
  newMeet,

  // edit existing data
  editUser,
  editTask,
  editMeeting,
};
