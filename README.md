# Newton — Productivity Web App

A clean, functional productivity platform with a weekly task view and change tracking.

## Project Roadmap

*(6–8 hours/week; Thu = busiest; more time Tue/Sat/Sun)*

| **Issue** | **Due date** | **Link** |
|-----------|--------------|----------|
| Task creation | February 12th | [Link](https://github.com/osimmov/junior-independent-study/issues/1) |
| Task status | February 15th | [Link](https://github.com/osimmov/junior-independent-study/issues/2) |
| Edit/delete tasks | February 16th | [Link](https://github.com/osimmov/junior-independent-study/issues/3) |
| Infinite scroll | February 18th | [Link](https://github.com/osimmov/junior-independent-study/issues/4) |
| Description window | February 22nd | [Link](https://github.com/osimmov/junior-independent-study/issues/5) |
| Data saving | February 22nd | [Link](https://github.com/osimmov/junior-independent-study/issues/6) |
| Progress Panel | February 25th | [Link](https://github.com/osimmov/junior-independent-study/issues/7) |
| Today Button | February 25th | [Link](https://github.com/osimmov/junior-independent-study/issues/8) |
| Weekly Reflection Page | March 1st | [Link](https://github.com/osimmov/junior-independent-study/issues/9) |
| AI model | March 8th | [Link](https://github.com/osimmov/junior-independent-study/issues/10) |
| (Stretch Goal) Task classification | if time permits | [Link](https://github.com/osimmov/junior-independent-study/issues/11) |
| (Stretch Goal) Task completion streak | if time permits | [Link](https://github.com/osimmov/junior-independent-study/issues/12) |
| (Stretch Goal) Productivity metrics dashboard | if time permits | [Link](https://github.com/osimmov/junior-independent-study/issues/13) |
| User Feedback | — | [Link](https://github.com/osimmov/junior-independent-study/issues/14) |

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
