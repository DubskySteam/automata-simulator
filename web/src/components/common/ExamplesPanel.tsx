import { useState } from 'react';
import { AUTOMATON_EXAMPLES, AutomatonExample } from '@/lib/automata/examples';
import { Modal } from './Modal';
import './ExamplesPanel.css';

interface ExamplesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExample: (example: AutomatonExample) => void;
}

export function ExamplesPanel({ isOpen, onClose, onLoadExample }: ExamplesPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'DFA' | 'NFA' | 'PDA'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | 'beginner' | 'intermediate' | 'advanced'
  >('all');

  const filteredExamples = AUTOMATON_EXAMPLES.filter((example) => {
    if (selectedCategory !== 'all' && example.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && example.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleLoadExample = (example: AutomatonExample) => {
    onLoadExample(example);
    onClose();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#4ade80';
      case 'intermediate':
        return '#fbbf24';
      case 'advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Example Automata">
      <div className="examples-panel">
        <div className="examples-filters">
          <div className="filter-group">
            <label>Category:</label>
            <div className="filter-buttons">
              <button
                className={selectedCategory === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </button>
              <button
                className={selectedCategory === 'DFA' ? 'active' : ''}
                onClick={() => setSelectedCategory('DFA')}
              >
                DFA
              </button>
              <button
                className={selectedCategory === 'NFA' ? 'active' : ''}
                onClick={() => setSelectedCategory('NFA')}
              >
                NFA
              </button>
              <button
                className={selectedCategory === 'PDA' ? 'active' : ''}
                onClick={() => setSelectedCategory('PDA')}
              >
                PDA
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Difficulty:</label>
            <div className="filter-buttons">
              <button
                className={selectedDifficulty === 'all' ? 'active' : ''}
                onClick={() => setSelectedDifficulty('all')}
              >
                All
              </button>
              <button
                className={selectedDifficulty === 'beginner' ? 'active' : ''}
                onClick={() => setSelectedDifficulty('beginner')}
              >
                Beginner
              </button>
              <button
                className={selectedDifficulty === 'intermediate' ? 'active' : ''}
                onClick={() => setSelectedDifficulty('intermediate')}
              >
                Intermediate
              </button>
              <button
                className={selectedDifficulty === 'advanced' ? 'active' : ''}
                onClick={() => setSelectedDifficulty('advanced')}
              >
                Advanced
              </button>
            </div>
          </div>
        </div>

        <div className="examples-list">
          {filteredExamples.length === 0 ? (
            <div className="no-examples">No examples found for the selected filters.</div>
          ) : (
            filteredExamples.map((example) => (
              <div key={example.id} className="example-card">
                <div className="example-header">
                  <h3>{example.name}</h3>
                  <div className="example-badges">
                    <span className="badge badge-category">{example.category}</span>
                    <span
                      className="badge badge-difficulty"
                      style={{ backgroundColor: getDifficultyColor(example.difficulty) }}
                    >
                      {example.difficulty}
                    </span>
                  </div>
                </div>
                <p className="example-description">{example.description}</p>
                <div className="example-stats">
                  <span>{example.automaton.states.length} states</span>
                  <span>•</span>
                  <span>{example.automaton.transitions.length} transitions</span>
                </div>
                <button
                  className="example-load-button"
                  onClick={() => handleLoadExample(example)}
                >
                  Load Example
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
