import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Level, Question, AnswerRecord } from '../types';
import { Heart, Coins, AlertCircle, BookOpen, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelScreenProps {
  level: Level;
  onComplete: (xpEarned: number, grade: string, answers: AnswerRecord[]) => void;
  onBack: () => void;
}

export function LevelScreen({ level, onComplete, onBack }: LevelScreenProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});

  const question = level.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === level.questions.length - 1;
  const currentAnswer = answers[question.id];
  const isGameOver = currentAnswer?.attempts >= 2 && !currentAnswer?.isCorrect;
  const isAnswered = !!currentAnswer;

  useEffect(() => {
    // Reset local state when question changes, but keep the stored answer state
    setAttempts(currentAnswer ? currentAnswer.attempts : 0);
    setShowHint(false);
    setFeedback(currentAnswer?.isCorrect ? 'success' : null);
  }, [currentQuestionIndex, currentAnswer]);

  const handleAnswer = (selectedOption: string) => {
    if (isGameOver || currentAnswer?.isCorrect) return;

    const newAttempts = attempts + 1;
    const isCorrect = selectedOption === question.correctAnswer;

    if (isCorrect) {
      setFeedback('success');
      
      let earned = 0;
      if (newAttempts === 1) earned = 3;
      else if (newAttempts === 2) earned = 2;
      else earned = 1;
      
      setAnswers(prev => ({
        ...prev,
        [question.id]: {
          questionId: question.id,
          questionText: question.text,
          type: question.type,
          userAnswer: selectedOption,
          correctAnswer: question.correctAnswer,
          isCorrect: true,
          attempts: newAttempts,
          xpEarned: earned
        }
      }));

      if (newAttempts === 1) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500']
        });
      }

      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
      
    } else {
      setFeedback('error');
      setAttempts(newAttempts);
      
      if (newAttempts >= 2) {
        // Game Over for this question
        setAnswers(prev => ({
          ...prev,
          [question.id]: {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            userAnswer: selectedOption,
            correctAnswer: question.correctAnswer,
            isCorrect: false,
            attempts: newAttempts,
            xpEarned: 0
          }
        }));
        setShowHint(false);
      } else {
        setShowHint(true);
      }
      
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  const handleNotebookGrade = (score: number) => {
    if (currentAnswer?.isCorrect) return;

    setFeedback('success');
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        questionText: question.text,
        type: question.type,
        isCorrect: true,
        attempts: 1,
        xpEarned: score,
        notebookGrade: score
      }
    }));
    
    if (score === 3) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500']
      });
    }
    
    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
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
    const answerList = Object.values(answers);
    const totalXpEarned = answerList.reduce((sum, ans) => sum + ans.xpEarned, 0);
    const maxPossibleXp = level.questions.length * 3;
    
    let grade = 'C';
    if (maxPossibleXp === 0) {
      grade = 'A+';
    } else {
      const percentage = totalXpEarned / maxPossibleXp;
      if (percentage >= 0.95) grade = 'A+';
      else if (percentage >= 0.90) grade = 'A';
      else if (percentage >= 0.85) grade = 'A-';
      else if (percentage >= 0.80) grade = 'B+';
      else if (percentage >= 0.75) grade = 'B';
      else if (percentage >= 0.70) grade = 'B-';
      else if (percentage >= 0.60) grade = 'C+';
      else if (percentage >= 0.50) grade = 'C';
      else grade = 'D';
    }

    onComplete(totalXpEarned, grade, answerList);
  };

  const totalXpEarned = Object.values(answers).reduce((sum, ans) => sum + ans.xpEarned, 0);

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
            <span className="font-pixel text-[8px] md:text-[10px] text-gray-400">XP FASE:</span>
            <span className="font-pixel text-xs md:text-sm text-green-400">+{totalXpEarned}</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-3 h-3 md:w-4 md:h-4 ${i < (3 - attempts) ? 'text-red-500 fill-red-500' : 'text-gray-600 fill-gray-600'}`} 
              />
            ))}
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
              <Coins className="w-3 h-3" /> AUTO
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
              const isCorrect = option === question.correctAnswer;
              const isRevealed = (isGameOver && isCorrect) || (currentAnswer?.isCorrect && isCorrect);
              const isSelected = currentAnswer?.userAnswer === option;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={isGameOver || currentAnswer?.isCorrect}
                  className={`
                    p-3 text-left font-sans text-sm md:text-base font-semibold rounded border-2
                    transition-all duration-200 relative overflow-hidden flex items-center
                    ${isRevealed ? 'bg-green-600 text-white border-green-400 shadow-[0_0_15px_rgba(76,175,80,0.5)]' : 
                      isSelected && !isCorrect ? 'bg-red-900/50 text-gray-400 border-red-500' :
                      'bg-[#0f3460]/50 text-gray-200 border-[#0f3460] hover:bg-[#0f3460] hover:border-blue-400'}
                    ${feedback === 'error' && isSelected ? 'animate-shake border-red-500 bg-red-900/30' : ''}
                  `}
                >
                  <span className="shrink-0 inline-block w-6 h-6 bg-black/30 text-center leading-6 rounded mr-3 font-pixel text-[10px] text-yellow-400">
                    {['A', 'B', 'C', 'D'][index]}
                  </span>
                  <span className="flex-1">{option}</span>
                  
                  {isRevealed && (
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
              onClick={() => handleNotebookGrade(0)}
              disabled={currentAnswer !== undefined}
              className={`pixel-button px-6 py-3 font-pixel text-sm ${currentAnswer ? 'btn-ghost text-green-400' : 'btn-secondary'}`}
            >
              {currentAnswer ? 'REGISTRADO!' : 'CONCLUÍ NO CADERNO!'}
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
          {showHint && !isGameOver && !currentAnswer?.isCorrect && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 bg-orange-900/40 border-l-4 border-orange-500 p-4 flex items-start gap-3 rounded-r"
            >
              <AlertCircle className="w-6 h-6 text-orange-400 shrink-0" />
              <div>
                <p className="font-pixel text-[10px] text-orange-300 mb-1">Dano Recebido! (-1 XP)</p>
                <p className="font-sans text-sm text-gray-200">{question.hint}</p>
              </div>
            </motion.div>
          )}

          {isGameOver && !currentAnswer?.isCorrect && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-6 bg-red-900/40 border border-red-500 p-4 text-center rounded"
            >
              <h3 className="font-pixel text-red-400 mb-2">Game Over na Questão</h3>
              <p className="font-sans text-gray-300 mb-4">Você esgotou suas tentativas (0 XP).</p>
              <p className="font-sans font-bold text-gray-200">A resposta correta era: <span className="text-green-400">{question.correctAnswer}</span></p>
              <button 
                onClick={handleNextQuestion}
                className="mt-4 pixel-button btn-primary px-6 py-2 text-[10px]"
              >
                {isLastQuestion ? 'Concluir Fase >' : 'Próxima Missão >'}
              </button>
            </motion.div>
          )}
          
          {feedback === 'success' && !isAnswered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-[var(--color-rpg-bg)]/80 backdrop-blur-sm z-50 rounded-lg"
            >
              <div className="rpg-panel px-8 py-6 text-center border-green-500 shadow-[0_0_30px_rgba(76,175,80,0.5)]">
                <h2 className="font-pixel text-2xl mb-2 text-green-400">CRÍTICO!</h2>
                <p className="font-pixel text-sm text-yellow-400">
                  +{question.type === 'multiple_choice' 
                    ? (attempts === 1 ? 3 : attempts === 2 ? 2 : 1) 
                    : currentAnswer?.notebookGrade} XP
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
