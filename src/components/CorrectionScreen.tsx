import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Level, AnswerRecord } from '../types';
import { CheckCircle, XCircle, BookOpen, Save } from 'lucide-react';

interface CorrectionScreenProps {
  level: Level;
  onBack: () => void;
  onGrade: (updatedAnswers: AnswerRecord[], newXp: number, newGrade: string) => void;
  isAdmin: boolean;
}

export function CorrectionScreen({ level, onBack, onGrade, isAdmin }: CorrectionScreenProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(() => {
    const initialAnswers: Record<string, AnswerRecord> = {};
    level.answers?.forEach(a => {
      initialAnswers[a.questionId] = { ...a };
    });
    return initialAnswers;
  });

  const handleToggleMultipleChoice = (questionId: string, isCorrect: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isCorrect,
        xpEarned: isCorrect ? 10 : 0,
        status: 'corrected'
      }
    }));
  };

  const handleNotebookGrade = (questionId: string, grade: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        notebookGrade: grade,
        xpEarned: grade * 5, // e.g., 3 stars = 15 XP
        status: 'corrected'
      }
    }));
  };

  const handleSave = () => {
    const updatedAnswersList = Object.values(answers) as AnswerRecord[];
    
    // Calculate total XP
    const totalXp = updatedAnswersList.reduce((sum, a) => sum + (a.xpEarned || 0), 0);
    
    // Calculate grade (A, B, C, D) based on percentage of max possible XP
    let maxPossibleXp = 0;
    level.questions.forEach(q => {
      if (q.type === 'multiple_choice') maxPossibleXp += 10;
      else if (q.type === 'notebook') maxPossibleXp += 15; // 3 stars * 5
    });

    const percentage = maxPossibleXp > 0 ? (totalXp / maxPossibleXp) * 100 : 0;
    let newGrade = 'D';
    if (percentage >= 90) newGrade = 'S';
    else if (percentage >= 80) newGrade = 'A';
    else if (percentage >= 60) newGrade = 'B';
    else if (percentage >= 40) newGrade = 'C';

    onGrade(updatedAnswersList, totalXp, newGrade);
    onBack();
  };

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
        className="w-full max-w-3xl relative z-10 mt-8 pb-24"
      >
        <div className="text-center mb-8">
          <h1 className="font-pixel text-2xl md:text-4xl text-yellow-400 drop-shadow-md mb-2">
            Correção: {level.title}
          </h1>
          <p className="font-sans text-gray-300">
            Avalie as respostas do aluno.
          </p>
        </div>

        <div className="space-y-6">
          {level.questions.map((question, index) => {
            const answer = answers[question.id];
            
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
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Resposta:</span>
                    <div className={`flex items-center gap-2 font-sans font-medium ${!isAdmin && answer?.status === 'corrected' ? (answer.isCorrect ? 'text-green-400' : 'text-red-400') : 'text-blue-300'}`}>
                      {!isAdmin && answer?.status === 'corrected' && (
                        answer.isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                      )}
                      <span>{answer?.userAnswer || 'Não respondida'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Gabarito:</span>
                    <div className="flex items-center gap-2 font-sans font-medium text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>{question.correctAnswer}</span>
                    </div>
                  </div>

                  {answer && isAdmin && (
                    <div className="mt-4 pt-4 border-t border-[#0f3460] flex gap-4">
                      <button
                        onClick={() => handleToggleMultipleChoice(question.id, true)}
                        className={`flex-1 py-2 rounded font-pixel text-[10px] flex items-center justify-center gap-2 transition-colors ${answer.isCorrect === true ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        CORRETO
                      </button>
                      <button
                        onClick={() => handleToggleMultipleChoice(question.id, false)}
                        className={`flex-1 py-2 rounded font-pixel text-[10px] flex items-center justify-center gap-2 transition-colors ${answer.isCorrect === false ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        <XCircle className="w-4 h-4" />
                        INCORRETO
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="font-pixel text-[10px] text-gray-400 mt-1 w-24 shrink-0">Tipo:</span>
                    <div className="flex items-center gap-2 font-sans text-purple-300">
                      <BookOpen className="w-5 h-5" />
                      <span>Atividade no Caderno</span>
                    </div>
                  </div>
                  
                  {answer && isAdmin && (
                    <div className="mt-4 pt-4 border-t border-[#0f3460]">
                      <span className="font-pixel text-[10px] text-gray-400 block mb-2">Avaliação (0-3 Estrelas):</span>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map(grade => (
                          <button
                            key={grade}
                            onClick={() => handleNotebookGrade(question.id, grade)}
                            className={`w-10 h-10 rounded flex items-center justify-center font-pixel text-sm transition-colors ${answer.notebookGrade === grade ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {answer && !isAdmin && (
                    <div className="mt-4 pt-4 border-t border-[#0f3460]">
                      <span className="font-pixel text-[10px] text-gray-400 block mb-2">Avaliação do Professor:</span>
                      <span className="font-sans text-yellow-400 font-bold">{answer.notebookGrade || 0} / 3 Estrelas</span>
                    </div>
                  )}
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

      {level.answers && level.answers.length > 0 && isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-rpg-panel)] border-t-4 border-[#0f3460] flex justify-center z-30">
          <button
            onClick={handleSave}
            className="pixel-button btn-primary px-8 py-3 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            SALVAR CORREÇÃO
          </button>
        </div>
      )}
    </div>
  );
}
