# Newton — Productivity Web App

A clean, functional productivity platform with a weekly task view and change tracking.

## Features

- **Weekly View**: Days displayed in columns with day name and full date
- **Task Management**: Add, edit, complete, delete tasks per day
- **Task Descriptions**: Add and edit task descriptions
- **Change Log**: Every action (add, edit, complete, uncomplete, delete, reschedule) is logged with timestamp and user
- **Persistence**: Tasks and change log persist across page reloads via LocalStorage

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State**: React Context + useReducer
- **Persistence**: LocalStorage (MVP) — can be swapped for REST API or Firebase

## Architecture

- `TaskContext`: Central state; every mutation logs to ChangeLog
- `DayColumn`: Renders a day with its tasks and Add input
- `Task`: Single task with checkbox, title, description, actions
- `ChangeLog`: Progress panel grouped by date

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Future Backend Options

- **REST API**: Replace `storage.js` with fetch calls to Node + Express + SQLite
- **Firebase**: Use Firestore for tasks and change log
- **Supabase**: Postgres-backed, real-time subscriptions
