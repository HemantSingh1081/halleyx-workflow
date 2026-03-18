Halleyx Workflow Engine
A powerful workflow automation engine built with React and Node.js.


Demo Video

[▶️ Watch Demo Video](https://youtu.be/E3h8XaFTbC0)

Features

 Drag-drop workflow editor
 Custom rule engine with REJECT status
 Real-time execution logs
 Optimized performance

Tech Stack

Frontend: React, React Flow
Backend: Node.js, Express 
Authentication: JWT, Bcrypt

Quick Start
Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on http://localhost:5000

Fronted
```bash
cd frontend
npm start
```
Frontend runs on http://localhost:3000

Steps:
Submit Expense (Task)

Manager Approval (Approval)

Finance Notification (Notification)

Done (Task)

Rules:
If amount > 10000 → REJECT

If amount <= 10000 → Finance Notification






