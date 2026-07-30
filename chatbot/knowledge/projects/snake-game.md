# 🐍 Snake Game

A classic Snake game with modern gameplay mechanics implemented using Python and Turtle graphics.

## 🎮 Overview
Control a growing snake to eat food and score points. Avoid collisions with walls and your own tail. A timeless arcade game brought to modern Python programming.

## 🌟 Key Features
- **Intuitive Controls**: Arrow keys for directional movement
- **Score Tracking**: Real-time score and high score tracking
- **Food System**: Randomly placed food for the snake to consume
- **Growth Mechanic**: Snake grows longer with each food item
- **Smooth Animation**: Fluid movement and responsive controls
- **High Score Persistence**: Scores saved between game sessions

## 🛠️ Technologies Used
- **Programming Language:** Python
- **Library:** Turtle (Python's built-in graphics library)
- **Key Modules:** `turtle`, `random`, `time`

## 📁 Project Structure
```
snake game/
├── main.py          # Main game logic
├── snake.py         # Snake class
├── food.py          # Food class
├── scoreboard.py    # Score display and high score
├── README.md        # This readme
└── assets/          # Optional: graphics files
```

## 🕹️ How to Play
1. Launch the game by running `main.py`
2. **Initial Appearance**: Snake starts with 3 segments in center
3. **Controls**: Use arrow keys to change direction
   - ✅ Up arrow: Move up
   - ✅ Down arrow: Move down  
   - ✅ Left arrow: Move left
   - ✅ Right arrow: Move right
4. **Goal**: Eat food to grow and increase your score
5. **Avoid**: Hitting walls or your own body

## 🎯 Game Logic
- **Movement**: Snake moves in 20-unit increments
- **Food Detection**: When snake head reaches food, score increases
- **Growth**: New segment added when food consumed
- **Collision Detection**: 
  - Wall collisions (screen boundaries)
  - Self-collisions (tail detection)
- **Game Over**: Triggers when collision occurs

## 💡 Key Components

### Main Game Loop (`main.py`)
- Initializes game screen and components
- Sets up keyboard listeners
- Maintains game loop with timed updates
- Handles game over conditions

### Snake Class (`snake.py`)
- Manages snake segments
- Handles movement mechanics
- Provides directional control
- Includes collision detection

### Food Class (`food.py`)
- Random position generation
- Visual representation
- Refresh mechanism for new food

### Scoreboard Class (`scoreboard.py`)
- Tracks current score
- Maintains high score
- Persists data to `high_score.txt`
- Displays game over message

## 🔧 Technical Details
- **Screen Size:** 720x700 pixels
- **Movement Speed:** 0.1 second intervals
- **Segment Movement:** Trail effect following previous positions
- **Collision Radius:** 15 units (head), 10 units (segments)
- **File Persistence:** High score stored in `high_score.txt`

## 🏆 Learning Outcomes
This project demonstrates:
- Object-oriented design patterns
- Path-following algorithms
- Event-driven programming
- File I/O operations
- Complex state management

## 📝 Future Enhancements
- Add power-ups (speed boosts, extra lives)
- Implement multiple difficulty levels
- Create a scoring system with multipliers
- Add visual effects (particle trails)
- Include a pause/reset feature

## ⚡ Performance Considerations
- Optimized movement algorithm (segments follow head)
- Timed updates for smooth animation
- Resource-efficient memory management

---
*Built with Python and Turtle graphics | Classic arcade game | Perfect for learning OOP concepts*
