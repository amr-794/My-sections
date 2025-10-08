# Fullstack Schedule App v2 (React + Node) — Timetable Enhanced

This project contains:
- server/: Node.js + Express backend (simple backup endpoints)
- client/: React (Vite) frontend with an animated, neon-green timetable view

Features:
- Add schedules with minute precision.
- Prevent adding an item that starts exactly at the same minute as another on same day.
- Overlapping events are laid out side-by-side (no visual overlap).
- Export/Import JSON backups.
- Timetable shows 24 hours vertically (1px per minute) with animated event blocks.
- PWA-ready structure; can be converted to native via Capacitor.

How to run:
1. unzip and open folder in VS Code.
2. from project root:
   npm install
   npm run dev

Server => http://localhost:4000
Client => http://localhost:5173

To convert to Android with Capacitor, follow README steps in original project.
