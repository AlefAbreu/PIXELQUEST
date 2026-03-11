import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, ScrollText } from 'lucide-react';
import { Level } from '../types';

interface HeroPanelProps {
  xp: number;
  levels: Level[];
}

export function HeroPanel({ xp, levels }: HeroPanelProps) {
  const [showBoletim, setShowBoletim] = useState(false);

  return (
    <>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={() => setShowBoletim(true)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rpg-panel p-2 md:p-3 flex items-center gap-3 shadow-[0_4px_15px_rgba(0,0,0,0.5)] bg-[var(--color-rpg-bg)] cursor-pointer hover:scale-105 transition-transform"
      >
        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#0f3460] border-2 border-[#e94560] rounded flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Hero&backgroundColor=0f3460" alt="Hero Avatar" className="w-6 h-6 md:w-8 md:h-8" referrerPolicy="no-referrer" />
        </div>
        <div className="flex flex-col">
          <span className="font-pixel text-[8px] md:text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
            Herói <ScrollText className="w-3 h-3 text-blue-400" />
          </span>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" />
            <motion.span 
              key={xp}
              initial={{ scale: 1.5, color: '#4CAF50' }}
              animate={{ scale: 1, color: '#e0e0e0' }}
              className="font-pixel text-xs md:text-sm text-gray-200"
            >
              {xp} XP
            </motion.span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showBoletim && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl rpg-panel p-6 relative"
            >
              <button 
                onClick={() => setShowBoletim(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <h2 className="font-pixel text-2xl text-yellow-400 mb-2">Boletim Escolar</h2>
                <p className="font-sans text-gray-300">Resumo das suas aventuras e notas.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#0f3460]">
                      <th className="p-3 font-pixel text-[10px] text-blue-300">Missão</th>
                      <th className="p-3 font-pixel text-[10px] text-blue-300 text-center">XP</th>
                      <th className="p-3 font-pixel text-[10px] text-blue-300 text-center">Nota</th>
                      <th className="p-3 font-pixel text-[10px] text-blue-300 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level, index) => {
                      const hasNotebook = level.questions.some(q => q.type === 'notebook');
                      const isPending = level.completed && hasNotebook && !level.teacherCorrected;

                      return (
                        <tr key={level.id} className="border-b border-[#0f3460]/50 hover:bg-[#0f3460]/20 transition-colors">
                          <td className="p-3 font-sans font-medium text-gray-200">
                            {index + 1}. {level.title}
                          </td>
                          <td className="p-3 font-pixel text-xs text-green-400 text-center">
                            {level.completed ? `+${level.score || 0}` : '-'}
                          </td>
                          <td className="p-3 font-pixel text-xs text-yellow-400 text-center">
                            {level.completed ? (isPending ? '?' : level.grade) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            {!level.completed ? (
                              <span className="font-pixel text-[8px] text-gray-500">Não Iniciada</span>
                            ) : isPending ? (
                              <span className="font-pixel text-[8px] text-orange-400">Aguardando Correção</span>
                            ) : (
                              <span className="font-pixel text-[8px] text-green-400">Corrigida</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {levels.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center font-sans text-gray-500">
                          Nenhuma missão disponível ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 pt-4 border-t-2 border-[#0f3460] flex justify-between items-center">
                <span className="font-pixel text-[10px] text-gray-400">XP TOTAL:</span>
                <span className="font-pixel text-xl text-green-400">{xp}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
