import React, { useState } from 'react';
import { Key } from 'lucide-react';

export default function PuzzleChallenge({ onSolve, puzzleType = 'caesar' }) {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const puzzles = {
    caesar: {
      title: 'Decryption Required',
      desc: 'Decode the message: QEB NRFZH YOLTK CLU GRJMP LSBO QEB IXWV ALD (Hint: Caesar Shift -3)',
      correctFunc: (ans) => ans.toLowerCase().replace(/[^a-z]/g, '') === 'thequickbrownfoxjumpsoverthelazydog'
    },
    frequency: {
      title: 'Frequency Match',
      desc: 'Set the slider to the optimal resonance frequency (75Hz) to bypass the lock.',
      isSlider: true,
      correctFunc: (ans) => parseInt(ans) >= 73 && parseInt(ans) <= 77
    }
  };

  const puzzle = puzzles[puzzleType] || puzzles['caesar'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (puzzle.correctFunc(answer)) {
      onSolve();
    } else {
      setError('Incorrect. Security system locked momentarily.');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
      <div className="w-full max-w-sm glass-dark p-8 rounded-3xl text-center shadow-2xl border border-blue-500/30">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Key size={32} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">{puzzle.title}</h2>
        <p className="text-blue-300/80 mb-8 font-mono text-sm leading-relaxed">
          {puzzle.desc}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {puzzle.isSlider ? (
            <input 
              type="range" 
              min="0" max="100" 
              value={answer || 50} 
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          ) : (
            <input
              type="text"
              className="w-full px-4 py-3 bg-black/50 border border-blue-500/30 rounded-xl text-center text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter decoded phrase..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}

          {error && <p className="text-red-400 text-sm font-bold animate-pulse">{error}</p>}
          
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl uppercase tracking-widest transition-all">
            Bypass Lock
          </button>
        </form>
      </div>
    </div>
  );
}
