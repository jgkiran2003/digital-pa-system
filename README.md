# Digital Personal Assistant System

- [Digital Personal Assistant System](#digital-personal-assistant-system)
  - [Introduction](#introduction)
  - [How to run this project](#how-to-run-this-project)
  - [Javascript Details](#javascript-details)
    - [testing.js](#testingjs)
    - [~/src/index.js](#srcindexjs)
    - [package.json (root folder)](#packagejson-root-folder)
    - [~/clients/package.json](#clientspackagejson)
    - [queries.js](#queriesjs)
  - [References:](#references)

## Introduction

Welcome to our Personal Assistant System where we aim to implement a cost-effective yet efficient software that aims to arrange and schedule meetings.

## How to run this project

A few ways to launch:  

1) Enter terminal, navigate to the project directory.
2) Run `$ npm install` to install relevant node_modules.
3) Run `$ node index.js` to run website on local host.

## Javascript Details

### testing.js

This file is specifically for altering the database directly. It's not necessary to use this file.  

### ~/src/index.js

The index.js file is the main javascript file that serves as the entry point of the application when launched. It is the first file that runs when the app is first launched, and it orchestrates the setup and operation of the application. It does these things:

1) Server Initialisation
2) Application Initialisation
3) Central Hub for Importing of Modules
4) Routing to API Endpoints
5) Centralised Error Handling

### package.json (root folder)

This file manages backend dependencies and overall project scripts. It includes tools that specific to server-side functionality. It may also include scripts for combined backend/frontend workflows

`name`: Name of the entire project.  
`version`: Version of the project.  
`description`: Short description of what we are doing.  
`private`: Prevents accidental publishing to npm registry.  
`main`: Entry point for the backend server.  
\
`scripts`: Scripts for managing the project.  
`start`: File to start the backend server.  
`dev`: File to start the backend server in development mode.  
`client`: Start React/Vue client app.  
`client:build`: Build the client app for production.  
`test`: Run tests for the backend.  
`all:dev`: Run both backend and frontend.  
`all:build`: Build the frontend app.  
\
`dependencies`: Shared backend dependencies. Feel free to add more packages, ones you think you would need. Examples below:  
`dotenv`: Environment variable management.  
`express`: Web server framework.  
`mysql2`: MySQL database client.  
`axios`: HTTP client for backend request.  
\
`devDependencies`: Shared development tools.  
`nodemon`: auto-restart server which is in development.  
`jest`: Backend testing framework.  
`concurrently`: Run multiple commands concurrently (e.g. client and server).  
\
`workspace`: Workspace setup for managing multiple folders.  
`client`: Frontend folder.  
\
`keywords`: Optional array used to describe the project.  
\
`author`: Who wrote all this code.  
`license`: Type of License for this project regarding distribution, modification and copyright.  

### ~/clients/package.json

This file is used to manage dependencies specific to the frontend framework or tools. Often unrelated to backend and contains scripts for frontend-specific tasks like starting the development server, building the frontend, or testing the UI components.

### queries.js

**remove**  
`removeDB`: Takes in an SQLite Table name as argument and deletes the entire table after entering the passcode.  
`removeEntry`: Takes in an SQLite Table name and general ID as argument then deletes the entry from that table and any related entries from all other tables. For e.g. if you remove ID 1 from users table, then all other entries in every table that contains a UID 1 will also be removed.
  
**show**  
`showAll`: Takes in a table name as an argument and displays the whole table in the console.  
  
**create**  
`createUsers`: Nullary function that creates the users table. Should be called on running the program, before any other functions are called.  
`createTasks`: Nullary function that creates the tasks table. Should be called on running the program, before any other functions are called.  
`createTaskRel`: Nullary function that creates the taskRel table. Should be called on running the program, before any other functions are called.  
`createTaskUserRel`: Nullary function that creates the taskUserRel table. Should be called on running the program, before any other functions are called.  
`createMeeting`: Nullary function that creates the meeting table. Should be called on running the program, before any other functions are called.  
`createMeetingUserRel`: Nullary function that creates the meetingUserRel table. Should be called on running the program, before any other functions are called.  
  
**new**  
`newUser`: Creates an entry in the users table. Requires 5 arguments: username(Str), email(Str), password(Str), role(Str), dept(Str)  
`newTask`: Creates an entry in tasks and taskUserRel tables. Requires 3 arguments: taskName(Str), deadline(datetime), UIDs(Str array)  
`newSubTask`: Creates an entry in tasks, taskUserRel and taskRel tables. Requires 4 arguments: mainTaskID(Str), taskName(Str), deadline(Str), UIDs(Str array)  
`newMeet`: Creates an entry in meetings and meetingRel tables. Requires 4 arguments: meetObj(Str), time(datetime), duration(Str), UIDs(Str array)  
  
**edit**  
`editUser`: Edits existing entries in the users table. Entries that are not edited should use Null as a placeholder. Takes in 6 arguments: UID(Str), username(Str), email(Str), password(Str), role(Str), dept(Str)  
`editTask`: Edits existing entries in the tasks, taskRel and taskUserRel table. Entries that should not be edited should use Null as a placeholder. Takes in 6 arguments: taskID(Str), taskName(Str), deadline(datetime), UIDs(Str array), subTaskID(Str), mainTaskID(Str).  
Filling the subTaskID or mainTaskID field will edit the taskRel table if the taskID has a respective subTaskID or mainTaskID related to it and throw and error otherwise.  
`editMeeting`: Edits existing entries in the meetings and meetingRel tables. Entries that should not be edied should use Null as a placeholder. Takes in 5 arguments: meetingID(Str), meetingObj(Str), time(datetime), duration(Str), UIDs(Str array). meetingRel table will only be edited if the UIDs field is filled.  

## References:

1) [VanillaCalendar](https://github.com/portexe/VanillaCalendar) is used in the framework for our calendar system.  
