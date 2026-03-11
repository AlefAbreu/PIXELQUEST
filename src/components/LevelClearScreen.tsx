import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Star, ArrowRight } from 'lucide-react';

interface LevelClearScreenProps {
  xpEarned: number;
  grade: string;
  onContinue: () => void;
}

export function LevelClearScreen({ xpEarned, grade, onContinue }: LevelClearScreenProps) {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-rpg-bg)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Sunburst background */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute w-[200vw] h-[200vw] -z-10 opacity-10"
        style={{
          background: 'conic-gradient(from 0deg, #e94560 0deg 15deg, transparent 15deg 30deg, #e94560 30deg 45deg, transparent 45deg 60deg, #e94560 60deg 75deg, transparent 75deg 90deg, #e94560 90deg 105deg, transparent 105deg 120deg, #e94560 120deg 135deg, transparent 135deg 150deg, #e94560 150deg 165deg, transparent 165deg 180deg, #e94560 180deg 195deg, transparent 195deg 210deg, #e94560 210deg 225deg, transparent 225deg 240deg, #e94560 240deg 255deg, transparent 255deg 270deg, #e94560 270deg 285deg, transparent 285deg 300deg, #e94560 300deg 315deg, transparent 315deg 330deg, #e94560 330deg 345deg, transparent 345deg 360deg)'
        }}
      />

      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="rpg-panel p-8 md:p-12 flex flex-col items-center max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(233,69,96,0.3)]"
      >
        <Trophy className="w-24 h-24 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
        
        <h1 className="font-pixel text-3xl md:text-4xl text-center text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 drop-shadow-sm">
          {grade === 'Pendente' ? 'MISSÃO CONCLUÍDA!' : 'LEVEL CLEAR!'}
        </h1>
        
        <div className="w-full h-1 bg-[#0f3460] my-6"></div>

        <div className="flex flex-col items-center gap-4 w-full">
          <div className="bg-[#0f3460]/50 p-4 rounded border border-[#0f3460] w-full flex justify-between items-center">
            <span className="font-pixel text-[10px] text-gray-400">XP GANHO</span>
            <div className="flex items-center gap-2">
              <Star className={`w-5 h-5 ${grade === 'Pendente' ? 'text-gray-500 fill-gray-500' : 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]'}`} />
              <span className={`font-pixel text-xl ${grade === 'Pendente' ? 'text-gray-400 text-sm' : 'text-green-400'}`}>
                {grade === 'Pendente' ? 'Em breve' : `+${xpEarned}`}
              </span>
            </div>
          </div>

          <div className="bg-[#0f3460]/50 p-4 rounded border border-[#0f3460] w-full flex justify-between items-center">
            <span className="font-pixel text-[10px] text-gray-400">NOTA FINAL</span>
            <motion.span 
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className={`font-pixel ${grade === 'Pendente' ? 'text-sm text-gray-400' : 'text-4xl text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]'}`}
            >
              {grade}
            </motion.span>
          </div>
        </div>

        <button 
          onClick={onContinue}
          className="mt-8 pixel-button btn-primary px-8 py-4 w-full flex items-center justify-center gap-3"
        >
          <span className="font-pixel text-sm md:text-base">CONTINUAR</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
  );
}
