# Automata Simulator

An interactive web application for creating, editing, and simulating Deterministic and Nondeterministic Finite Automata (DFA/NFA). Features a visual drag-and-drop editor with real-time animation and automatic NFA→DFA conversion.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

[**Live Demo**](https://dubskysteam.github.io/automata-simulator) | [**Documentation**](./docs) | [**Examples**](./docs/examples.md)

![Screenshot](docs/images/screenshot.png)

---

## ✨ Features

### Visual Editor
- **Drag-and-drop interface** - Double-click to create states, shift-drag to create transitions
- **Interactive graph editing** - Move, rename, and delete states with intuitive controls
- **Automatic layout** - Force-directed graph layout for clean visualization
- **Multi-select** - Select and move multiple states at once
- **Undo/redo** - Full history support with Ctrl+Z/Ctrl+Y
- **Snap to grid** - Optional grid snapping for precise alignment

### Simulation & Testing
- **Step-by-step execution** - Watch automaton process input string one symbol at a time
- **Parallel state tracking** - Visual highlighting of all active states (NFA)
- **Execution timeline** - Replay and scrub through execution history
- **Batch testing** - Test multiple strings at once
- **Acceptance visualization** - Clear indication of accept/reject states

### Conversion & Optimization
- **NFA → DFA conversion** - Automatic subset construction with step-by-step visualization
- **DFA minimization** - Hopcroft's algorithm with state grouping animation
- **Epsilon closure** - Support for ε-transitions in NFAs
- **Side-by-side comparison** - Compare original and converted automata

### Import & Export
- **JSON format** - Save and load automata definitions
- **PNG export** - Export automata as high-quality images
- **Share via URL** - Encode automata in URL for easy sharing
- **Example library** - Pre-built automata for learning

---

## 🚀 Quick Start

### Online (No Installation)
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

---

## 🎨 Usage

### Creating a DFA

1. **Add states**: Double-click on the canvas
2. **Set initial state**: Right-click state → "Set as Initial"
3. **Set accept states**: Right-click state → "Toggle Accept State"
4. **Add transitions**: Shift+drag from source state to destination state
5. **Label transitions**: Click transition and type symbol(s)

### Testing Strings

1. Click "Test Input" button
2. Enter string to test (e.g., `010110`)
3. Click "Run" to see if string is accepted
4. Use "Step" button for step-by-step execution
5. Watch states highlight as automaton processes input

### Converting NFA to DFA

1. Create an NFA (including ε-transitions if desired)
2. Click "Convert to DFA" button
3. View subset construction table
4. See resulting DFA side-by-side with original NFA
5. Optionally minimize the resulting DFA

---

## 🎯 Examples

### Binary Strings Divisible by 3
DFA that accepts binary strings whose value is divisible by 3

```json
{
  "type": "DFA",
  "states": ["q0", "q1", "q2"],
  "alphabet": ["0", "1"],
  "transitions": {
    "q0": { "0": "q0", "1": "q1" },
    "q1": { "0": "q2", "1": "q0" },
    "q2": { "0": "q1", "1": "q2" }
  },
  "initialState": "q0",
  "acceptStates": ["q0"]
}
```

### Even Number of Zeros
NFA that accepts strings with an even number of 0s

```json
{
  "type": "NFA",
  "states": ["even", "odd"],
  "alphabet": ["0", "1"],
  "transitions": {
    "even": { "0": ["odd"], "1": ["even"] },
    "odd": { "0": ["even"], "1": ["odd"] }
  },
  "initialState": "even",
  "acceptStates": ["even"]
}
```

More examples available in the [examples documentation](./docs/examples.md).

---

## 📚 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Double-click** | Create new state |
| **Shift+drag** | Create transition |
| **Click + drag** | Move state |
| **Delete** / **Backspace** | Delete selected |
| **Ctrl+Z** / **Cmd+Z** | Undo |
| **Ctrl+Y** / **Cmd+Y** | Redo |
| **Ctrl+A** / **Cmd+A** | Select all |
| **F2** | Rename selected state |
| **Space** | Toggle simulation play/pause |
| **→** | Step forward |
| **←** | Step backward |

---

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript 5.6** - Type-safe development
- **Vite** - Build tool with HMR
- **Canvas API** - Graph rendering and animations
- **Zustand** - State management
- **TailwindCSS** - Styling

---

## 📦 Project Structure

```
src/
├── components/         # React components
│   ├── editor/         # Visual editor (canvas, nodes, transitions)
│   ├── simulator/      # Simulation controls
│   └── converter/      # NFA→DFA conversion UI
├── lib/
│   ├── automata/       # Core automata logic (DFA, NFA, conversion)
│   ├── graph/          # Graph algorithms (layout, rendering)
│   └── storage/        # Save/load functionality
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 📖 Documentation

- [**Theory Guide**](./docs/theory.md) - DFA/NFA fundamentals
- [**User Guide**](./docs/guide.md) - How to use the visualizer
- [**Examples**](./docs/examples.md) - Pre-built automata

---

## 🗺️ Roadmap

### Phase 1 (Current)
- [ ] Visual editor with drag-and-drop
- [ ] DFA simulation
- [ ] NFA simulation with ε-transitions
- [ ] NFA → DFA conversion visualization
- [ ] DFA minimization

### Phase 2 (Next)
- [ ] Regex to NFA conversion (Thompson's construction)
- [ ] More layout algorithms (circular, hierarchical)
- [ ] Animated tutorials
- [ ] Mobile-responsive design

### Phase 3 (Future)
- [ ] Collaborative editing
- [ ] Export to LaTeX/TikZ
- [ ] Animation export (GIF/MP4)
- [ ] Educational quiz mode

---

## 📄 License

AGPLv3 License - see [LICENSE](LICENSE) file.