import React from 'react';
import { motion } from 'motion/react';
import { Level } from '../types';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface CorrectionScreenProps {
  level: Level;
  onBack: () => void;
}

export function CorrectionScreen({ level, onBack }: CorrectionScreenProps) {
  return (
    <div className="min-h-screen bg-[var(--color-rpg-bg)] flex flex-col items-center p-4 md:p-8 pt-24 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#e94560 1px, transparent 1px), linear-gradient(90deg, #e94560 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="absolute top-20 left-4 z-20">
        <button 
          onClick={onBack}
          className="pixel-button btn-ghost px-4 py-2 text-[10px]"
        >
          &lt; VOLTAR
        </button>
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-3xl relative z-10 mt-8"
      >
        <div className="text-center mb-8">
          <h1 className="font-pixel text-2xl md:text-4xl text-yellow-400 drop-shadow-md mb-2">
            Correção: {level.title}
          </h1>
          <p className="font-sans text-gray-300">
            Verifique as respostas assinaladas pela criança.
          </p>
        </div>

        <div className="space-y-6">
          {level.questions.map((question, index) => {
            const answer = level.answers?.find(a => a.questionId === question.id);
            
            return (
            <div key={question.id} className="rpg-panel p-6">
              <div className="flex justify-between items-start mb-4 border-b border-[#0f3460] pb-4">
                <h3 className="font-pixel text-sm text-blue-300">Missão {index + 1}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[10px] text-gray-400">XP:</span>
                  <span className="font-pixel text-sm text-green-400">+{answer?.xpEarned || 0}</span>
                </div>
              </div>
              
              <p className="font-sans text-lg text-white mb-4">{question.text}</p>
              
              {question.type === 'multiple_choice' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Resposta:</span>
                    <div className={`flex items-center gap-2 font-sans font-medium ${answer?.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {answer?.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      <span>{answer?.userAnswer || 'Não respondida'}</span>
                    </div>
                  </div>
                  
                  {!answer?.isCorrect && (
                    <div className="flex items-start gap-3">
                      <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Correta:</span>
                      <div className="flex items-center gap-2 font-sans font-medium text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>{question.correctAnswer}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Tentativas:</span>
                    <span className="font-sans text-gray-300">{answer?.attempts || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Tipo:</span>
                    <div className="flex items-center gap-2 font-sans text-purple-300">
                      <BookOpen className="w-5 h-5" />
                      <span>Atividade no Caderno</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Avaliação:</span>
                    <span className="font-sans text-yellow-400 font-bold">{answer?.notebookGrade || 0} / 3</span>
                  </div>
                </div>
              )}
            </div>
          )})}
          
          {(!level.answers || level.answers.length === 0) && (
            <div className="text-center p-8 text-gray-400 font-sans">
              Nenhuma resposta registrada para esta fase ainda.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
