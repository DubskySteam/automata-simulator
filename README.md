# Automata Visualizer

An interactive web application for creating, editing, and simulating Deterministic and Nondeterministic Finite Automata (DFA/NFA). Features a modern visual editor with real-time simulation, validation, and automatic save.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

[**Live Demo**](https://dubskysteam.github.io/automata-simulator) | [**Report Bug**](https://github.com/dubskysteam/automata-simulator/issues) | [**Request Feature**](https://github.com/dubskysteam/automata-simulator/issues)

---

## ✨ Features

### 🎨 Visual Editor
- **Intuitive canvas** - Double-click to create states, click to create transitions
- **Interactive editing** - Drag states, edit labels, customize properties via context menu
- **Real-time validation** - Instant feedback on DFA/NFA correctness
- **Grid with zoom & pan** - Smooth navigation with mouse wheel and drag
- **Auto-save** - Work is automatically saved to localStorage
- **Dark/Light themes** - Modern UI with theme switching

### 🎯 Simulation & Testing
- **Step-by-step execution** - Watch how the automaton processes input strings
- **Visual state highlighting** - Active states pulse with breathing animation
- **Parallel state tracking** - See all active states simultaneously in NFAs
- **Play/Pause controls** - Auto-play with adjustable speed or manual stepping
- **Acceptance visualization** - Clear accept/reject indication with color coding

### 🔍 Validation
- **DFA determinism checking** - Detects multiple transitions per symbol
- **ε-transition warnings** - Flags epsilon transitions in DFA mode
- **Missing states detection** - Validates initial and accept states
- **Real-time error display** - See validation errors in simulation panel

### 📚 Example Library
- **Pre-built automata** - 8+ example DFAs and NFAs
- **Difficulty levels** - Beginner to advanced examples
- **Category filtering** - Browse by type (DFA/NFA/PDA)
- **One-click loading** - Load examples instantly

### 💾 Import & Export
- **JSON format** - Save and load complete automaton definitions
- **PNG export** - Export canvas as high-quality image
- **Auto-restore** - Automatically restore previous session on reload
- **Clear workspace** - Quick reset to default state

### ⚙️ Settings
- **Theme selection** - Dark, Light, or System preference
- **Animation toggle** - Enable/disable visual animations
- **Grid display** - Show/hide background grid
- **Persistent settings** - Settings saved between sessions

---

## 🚀 Quick Start

### Online (Recommended)
Visit [automata-simulator.github.io](https://dubskysteam.github.io/automata-simulator)

### Local Development

```bash
# Clone repository
git clone https://github.com/dubskysteam/automata-simulator.git
cd automata-simulator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 🎨 Usage

### Creating an Automaton

1. **Choose type**: Select DFA or NFA from the toolbar
2. **Add states**: Double-click on the canvas to create states
3. **Set initial state**: Right-click state → "Set as Initial State"
4. **Set accept states**: Right-click state → "Set as Accept State"
5. **Add transitions**: 
   - Click "Add Transition" tool in toolbar
   - Click source state, then destination state
   - Enter transition symbols in the modal

### Testing Strings

1. Open the simulation panel (right side)
2. Enter an input string (e.g., `0110`)
3. Click the **▶** button to start simulation
4. Use controls to step through:
   - **⏮** Step backward
   - **▶️** Auto-play
   - **⏸** Pause
   - **⏭** Step forward
5. Watch states highlight as input is processed
6. See final result: **✓ Accepted** or **✗ Rejected**

### Loading Examples

1. Click **Examples** button in toolbar
2. Filter by category (DFA/NFA) or difficulty
3. Click **Load Example** on any automaton
4. The example loads and you can modify it freely

---

## 📚 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Double-click** | Create new state |
| **Delete** / **Backspace** | Delete selected state(s) |
| **Ctrl+A** / **Cmd+A** | Select all states |
| **Mouse wheel** | Zoom in/out |
| **Right-click** | Open context menu |
| **Escape** | Close modals/deselect |

---

## 📦 Project Structure

```
src/
├── components/          # React components
│   ├── common/          # Reusable UI (Modal, ContextMenu, Settings)
│   ├── editor/          # Canvas, Toolbar, Modals
│   └── simulation/      # SimulationPanel
├── lib/
│   ├── automata/        # Example automata definitions
│   ├── canvas/          # Rendering engine, constants, utilities
│   ├── simulation/      # Simulation engine & validation
│   └── storage/         # localStorage utilities & settings
├── hooks/               # Custom React hooks
│   ├── useAutomaton.ts
│   ├── useCanvas.ts
│   └── useKeyboardShortcuts.ts
├── types/               # TypeScript type definitions
│   ├── index.ts         # Core types (Automaton, State, Transition)
│   └── simulation.ts    # Simulation types
└── styles/              # Global styles and themes
```

---

## 🎯 Examples

The application includes 8 built-in examples:

### DFA Examples
- **Even number of 0s** (Beginner) - Basic two-state DFA
- **Contains substring "01"** (Beginner) - Pattern matching
- **Binary divisible by 3** (Intermediate) - Arithmetic DFA

### NFA Examples
- **Ends with "01"** (Beginner) - Simple NFA
- **Third symbol from end is 1** (Intermediate) - Look-behind
- **NFA with ε-transitions** (Intermediate) - Demonstrates epsilon closure

### Advanced
- **Starts and ends with same symbol** (Advanced) - Complex 5-state DFA

All examples can be loaded via the **Examples** panel in the toolbar.

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Visual drag-and-drop editor
- [x] DFA simulation with step-by-step execution
- [x] NFA simulation with ε-transitions
- [x] Real-time validation
- [x] Auto-save to localStorage
- [x] JSON import/export
- [x] PNG export
- [x] Example library with 8+ automata
- [x] Dark/Light theme support
- [x] Settings panel

### 🚧 In Progress
- [ ] Undo/Redo system
- [ ] Enhanced validation with visual indicators
- [ ] Quick-fix suggestions

### 📋 Planned
- [ ] NFA → DFA conversion (subset construction)
- [ ] DFA minimization (Hopcroft's algorithm)
- [ ] Regex to NFA conversion (Thompson's construction)
- [ ] LaTeX/TikZ export
- [ ] PDA (Pushdown Automata) support
- [ ] Turing Machine support
- [ ] Mobile/touch support
- [ ] Collaborative editing

## 📄 License

AGPL-3.0 License - see [LICENSE](LICENSE) file for details