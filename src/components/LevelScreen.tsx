import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Level, Question, AnswerRecord } from '../types';
import { Heart, Coins, AlertCircle, BookOpen, Check, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelScreenProps {
  level: Level;
  onComplete: (xpEarned: number, grade: string, answers: AnswerRecord[]) => void;
  onBack: () => void;
}

export function LevelScreen({ level, onComplete, onBack }: LevelScreenProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<'success' | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});

  const question = level.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === level.questions.length - 1;
  const currentAnswer = answers[question.id];
  const isAnswered = !!currentAnswer;

  useEffect(() => {
    setFeedback(null);
  }, [currentQuestionIndex]);

  const handleAnswer = (selectedOption: string) => {
    if (isAnswered) return;

    setFeedback('success');
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        questionText: question.text,
        type: question.type,
        userAnswer: selectedOption,
        correctAnswer: question.correctAnswer,
        attempts: 1,
        xpEarned: 0, // XP will be awarded by the teacher
        status: 'pending_correction'
      }
    }));

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#4CAF50', '#8BC34A']
    });

    setTimeout(() => {
      handleNextQuestion();
    }, 1200);
  };

  const handleNotebookGrade = () => {
    if (isAnswered) return;

    setFeedback('success');
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        questionText: question.text,
        type: question.type,
        attempts: 1,
        xpEarned: 0,
        status: 'pending_correction'
      }
    }));
    
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#9C27B0', '#E040FB']
    });
    
    setTimeout(() => {
      handleNextQuestion();
    }, 1200);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      finishLevel();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishLevel = () => {
    const answerList = Object.values(answers) as AnswerRecord[];
    // XP and Grade are 0/Pending until teacher corrects
    onComplete(0, 'Pendente', answerList);
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[var(--color-rpg-bg)] flex flex-col items-center justify-center p-4 md:p-8 pt-24 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#e94560 1px, transparent 1px), linear-gradient(90deg, #e94560 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Top Bar */}
      <div className="absolute top-20 left-4 right-4 flex justify-between items-center z-20">
        <div className="flex gap-2">
          <button 
            onClick={onBack}
            className="pixel-button btn-ghost px-2 md:px-4 py-2 text-[8px] md:text-[10px]"
          >
            &lt; MAPA
          </button>
          {currentQuestionIndex > 0 && (
            <button 
              onClick={handlePrevQuestion}
              className="pixel-button btn-secondary px-2 md:px-4 py-2 text-[8px] md:text-[10px]"
            >
              &lt; VOLTAR
            </button>
          )}
        </div>
        
        <div className="rpg-panel-sm px-2 md:px-4 py-2 flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 md:gap-2">
            <Target className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
            <span className="font-pixel text-[8px] md:text-[10px] text-gray-400">PROGRESSO:</span>
            <span className="font-pixel text-xs md:text-sm text-blue-400">{answeredCount}/{level.questions.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div 
        key={currentQuestionIndex}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        className="w-full max-w-2xl rpg-panel p-6 md:p-8 relative z-10 mt-8"
      >
        {/* Question Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-[#0f3460] pb-4">
          <h2 className="font-pixel text-sm md:text-base text-yellow-400">
            Missão {currentQuestionIndex + 1} / {level.questions.length}
          </h2>
          {question.type === 'multiple_choice' ? (
            <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded font-pixel text-[8px] flex items-center gap-1 border border-blue-700">
              <Coins className="w-3 h-3" /> MÚLTIPLA ESCOLHA
            </span>
          ) : (
            <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded font-pixel text-[8px] flex items-center gap-1 border border-purple-700">
              <BookOpen className="w-3 h-3" /> MANUAL
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="mb-6">
          {question.contextText && (
            <div className="mb-4 bg-[#0f3460]/30 p-3 rounded border border-[#0f3460] text-gray-300 font-sans text-sm whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
              {question.contextText}
            </div>
          )}
          <p className="font-sans text-base md:text-lg font-medium text-white leading-relaxed">
            {question.text}
          </p>
        </div>

        {/* Interactive Area */}
        {question.type === 'multiple_choice' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options?.map((option, index) => {
              const isSelected = currentAnswer?.userAnswer === option;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  className={`
                    p-3 text-left font-sans text-sm md:text-base font-semibold rounded border-2
                    transition-all duration-200 relative overflow-hidden flex items-center
                    ${isSelected ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(33,150,243,0.5)]' : 
                      'bg-[#0f3460]/50 text-gray-200 border-[#0f3460] hover:bg-[#0f3460] hover:border-blue-400'}
                  `}
                >
                  <span className="shrink-0 inline-block w-6 h-6 bg-black/30 text-center leading-6 rounded mr-3 font-pixel text-[10px] text-yellow-400">
                    {['A', 'B', 'C', 'D'][index]}
                  </span>
                  <span className="flex-1">{option}</span>
                  
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0f3460]/30 p-4 rounded border border-[#0f3460] flex flex-col items-center text-center">
            <BookOpen className="w-8 h-8 text-purple-400 mb-2" />
            <h3 className="font-pixel text-xs text-purple-300 mb-1">Hora do Inventário!</h3>
            <p className="font-sans text-sm text-gray-300 mb-4">
              Pegue seu lápis e papel. Resolva esta missão no seu caderno e depois clique no botão abaixo. O professor irá corrigir depois!
            </p>
            
            <button
              onClick={() => handleNotebookGrade()}
              disabled={isAnswered}
              className={`pixel-button px-6 py-3 font-pixel text-sm ${isAnswered ? 'btn-ghost text-green-400' : 'btn-secondary'}`}
            >
              {isAnswered ? 'REGISTRADO!' : 'CONCLUÍ NO CADERNO!'}
            </button>
          </div>
        )}

        {/* Navigation for already answered questions */}
        {isAnswered && !isLastQuestion && feedback !== 'success' && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleNextQuestion}
              className="pixel-button btn-primary px-6 py-2 text-[10px]"
            >
              Próxima Missão &gt;
            </button>
          </div>
        )}
        {isAnswered && isLastQuestion && feedback !== 'success' && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={finishLevel}
              className="pixel-button btn-primary px-6 py-2 text-[10px]"
            >
              Concluir Fase &gt;
            </button>
          </div>
        )}

        {/* Feedback Area */}
        <AnimatePresence>
          {feedback === 'success' && !isAnswered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-[var(--color-rpg-bg)]/80 backdrop-blur-sm z-50 rounded-lg"
            >
              <div className="rpg-panel px-8 py-6 text-center border-blue-500 shadow-[0_0_30px_rgba(33,150,243,0.5)]">
                <h2 className="font-pixel text-xl mb-2 text-blue-400">REGISTRADO!</h2>
                <p className="font-pixel text-[10px] text-gray-300">
                  Aguardando correção do professor.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
