# TypeArena – Real-Time Typing Battle

TypeArena is a real-time multiplayer typing game where players compete in live typing races. It focuses on speed, accuracy, and synchronized gameplay using WebSockets.

The application supports both competitive multiplayer matches and individual practice, making it useful for improving typing performance as well as demonstrating real-time system design.



## Live Demo

https://typearena-game.vercel.app/


## Features

* Real-time multiplayer typing races
* Invite-based room system
* Lobby with player readiness synchronization
* 60-second timed typing challenge
* Live progress updates for all players
* Accuracy and WPM-based scoring
* Practice mode for solo typing
* Firebase-based authentication


## How It Works

### Multiplayer Mode

1. A user creates a game room
2. An invite link is generated and shared
3. Players join the lobby
4. Each player marks themselves as ready
5. The server synchronizes all players and starts the countdown
6. Players type the given text within 60 seconds
7. Results are calculated based on speed and accuracy


### Practice Mode

* No lobby required
* Instant start
* Focus on improving typing speed and consistency


## Tech Stack

### Frontend

* React
* React Router
* CSS
* Vite

### Backend

* Node.js
* Express.js
* Socket.IO

### Services

* Firebase (Authentication and user management)

### Tools

* Git
* GitHub


## Project Structure

typing-battle/

├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── engine/
│   │   ├── socket/
│   │   ├── auth/
│   │   ├── styles/
│   │   ├── assets/
│   │   ├── firebase.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json

├── backend/
│   ├── server.js
│   ├── socketHandler.js
│   ├── package.json
│   └── node_modules/

└── README.md


## Architecture Overview
TypeArena follows a client-server architecture:

* The frontend handles UI, user interaction, and typing logic
* The backend manages game rooms, player synchronization, and real-time events
* Communication is handled via Socket.IO for low-latency updates
* Firebase is used for authentication and user data management


## Future Improvements

* Global leaderboard system
* Match history tracking
* Ranked matchmaking
* Custom difficulty levels


## Author

Sakshi Prabhu
IT Student
