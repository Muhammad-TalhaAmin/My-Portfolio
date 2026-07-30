# 🎯 Pong Game

A classic Pong game built with Python using the Turtle graphics library.

## 🎮 Overview
This is a two-player Pong game where players control paddles to hit a bouncing ball and score points. The game follows the classic Pong mechanics with arcade-style gameplay.

## 🌟 Key Features
- **Dual Player Controls**: One player uses arrow keys (Up/Down), the other uses W/S
- **Score Tracking**: Scores are displayed on both sides of the screen
- **Speed Progression**: Ball speed increases with each score
- **Visual Feedback**: The ball bounces off paddles and walls
- **Clean Game Over**: Displays "GAME OVER" when a player reaches 7 points

## 🛠️ Technologies Used
- **Programming Language:** Python
- **Library:** Turtle (Python's built-in graphics library)
- **Key Modules:** `turtle`, `time`, `random`

## 📁 Project Structure
```
pong/
├── main.py          # Main game logic
├── paddle.py        # Paddle class
├── ball.py          # Ball class  
├── score.py         # Score display
├── README.md        # This readme
└── assets/          # Optional: graphics files
```

## 🚀 How to Play
1. Launch the game by running `main.py`
2. **Player 1**: Press `Up` and `Down` arrows to move
3. **Player 2**: Press `W` and `S` to move
4. First to reach **7 points** wins!

## 🎯 Game Logic
- The ball moves diagonally and bounces off walls and paddles
- Paddle collision detection ensures ball reflection
- Scoring occurs when the ball passes a paddle
- Ball resets to center with increased speed on each score
- Game ends when any player reaches the winning score

## 💡 Key Components

### Main Game Loop (`main.py`)
- Initializes the game screen and components
- Handles user input for paddle control
- Manages game state and ball movement
- Detects collisions and scoring events

### Paddle Class (`paddle.py`)
- Controlled by keyboard input
- Moves vertically within screen bounds
- Smooth movement animations

### Ball Class (`ball.py`)
- Handles ball physics (movement, bouncing)
- Speed control and difficulty progression
- Ball reset mechanism after scoring

### Score Class (`score.py`)
- Tracks and displays scores
- Updates score display in real-time
- Provides game over notification

## 🔧 Technical Details
- **Screen Size:** 1000x600 pixels
- **Game Speed:** Adjustable (increases with scoring)
- **Collision Detection:** Distance-based for accurate ball-paddle interaction
- **Game State:** Simple boolean flag for game on/off

## 🏆 Learning Outcomes
This project demonstrates:
- Object-oriented programming concepts
- Event-driven programming with Turtle
- Game physics implementation
- Collision detection algorithms
- Basic game loop structure

## 📝 Future Enhancements
- Add power-ups or special abilities
- Implement multiplayer options
- Include sound effects and music
- Add visual particle effects
- Create a menu system

---
*Built with Python and Turtle graphics | Perfect for learning game development concepts*
