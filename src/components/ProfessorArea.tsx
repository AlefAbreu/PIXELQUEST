import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Level, Question } from '../types';
import { Plus, Trash2, Save, X, BookOpen, ListChecks, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProfessorAreaProps {
  initialLevels?: Level[];
  onSave: (levels: Level[]) => void;
  onCancel: () => void;
}

export function ProfessorArea({ initialLevels = [], onSave, onCancel }: ProfessorAreaProps) {
  const [levels, setLevels] = useState<Level[]>(initialLevels);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'correct'>('build');

  const addLevel = () => {
    const newLevel: Level = {
      id: `level-${Date.now()}`,
      title: `Nova Missão Diária ${levels.length + 1}`,
      questions: [],
      completed: false
    };
    setLevels([...levels, newLevel]);
    setExpandedLevel(newLevel.id);
  };

  const removeLevel = (id: string) => {
    setLevels(levels.filter(l => l.id !== id));
  };

  const updateLevelTitle = (id: string, title: string) => {
    setLevels(levels.map(l => l.id === id ? { ...l, title } : l));
  };

  const addQuestion = (levelId: string, type: 'multiple_choice' | 'notebook') => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      text: '',
      contextText: '',
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      correctAnswer: type === 'multiple_choice' ? '' : undefined,
      hint: type === 'multiple_choice' ? 'Tente novamente!' : undefined
    };

    setLevels(levels.map(l => {
      if (l.id === levelId) {
        return { ...l, questions: [...l.questions, newQuestion] };
      }
      return l;
    }));
  };

  const removeQuestion = (levelId: string, qId: string) => {
    setLevels(levels.map(l => {
      if (l.id === levelId) {
        return { ...l, questions: l.questions.filter(q => q.id !== qId) };
      }
      return l;
    }));
  };

  const updateQuestion = (levelId: string, qId: string, updates: Partial<Question>) => {
    setLevels(levels.map(l => {
      if (l.id === levelId) {
        return {
          ...l,
          questions: l.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
        };
      }
      return l;
    }));
  };

  const handleGradeNotebook = (levelId: string, questionId: string, grade: number) => {
    setLevels(levels.map(l => {
      if (l.id === levelId && l.answers) {
        return {
          ...l,
          answers: l.answers.map(a => 
            a.questionId === questionId 
              ? { ...a, notebookGrade: grade, xpEarned: grade } 
              : a
          )
        };
      }
      return l;
    }));
  };

  const finalizeCorrection = (levelId: string) => {
    setLevels(levels.map(l => {
      if (l.id === levelId && l.answers) {
        const totalXp = l.answers.reduce((sum, a) => sum + a.xpEarned, 0);
        const maxPossibleXp = l.questions.length * 3;
        let grade = 'C';
        if (maxPossibleXp === 0) {
          grade = 'A+';
        } else {
          const percentage = totalXp / maxPossibleXp;
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
        return { ...l, score: totalXp, grade, teacherCorrected: true };
      }
      return l;
    }));
    setExpandedLevel(null);
  };

  const completedLevels = levels.filter(l => l.completed);

  return (
    <div className="min-h-screen bg-[var(--color-rpg-bg)] p-4 md:p-8 pt-24 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-pixel text-2xl text-yellow-400 mb-2">Área do Professor</h1>
            <p className="text-gray-400 font-sans">Gerencie missões e corrija as atividades.</p>
          </div>
          <button onClick={onCancel} className="pixel-button btn-ghost p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-4 mb-8 border-b-2 border-[#0f3460] pb-4">
          <button 
            onClick={() => setActiveTab('build')} 
            className={`pixel-button px-6 py-3 text-[10px] md:text-xs ${activeTab === 'build' ? 'btn-primary' : 'btn-ghost'}`}
          >
            CRIAR MISSÕES
          </button>
          <button 
            onClick={() => setActiveTab('correct')} 
            className={`pixel-button px-6 py-3 text-[10px] md:text-xs ${activeTab === 'correct' ? 'btn-primary' : 'btn-ghost relative'}`}
          >
            CORRIGIR ATIVIDADES
            {completedLevels.some(l => !l.teacherCorrected) && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        {activeTab === 'build' && (
          <div className="space-y-6">
            {levels.map((level, lIdx) => (
              <div key={level.id} className="rpg-panel overflow-hidden">
                <div 
                  className="p-4 bg-[#0f3460]/50 flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="font-pixel text-blue-400 text-xs">{lIdx + 1}</span>
                    <input 
                      type="text" 
                      value={level.title}
                      onChange={(e) => updateLevelTitle(level.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent border-b border-blue-500/30 font-pixel text-sm text-white focus:outline-none focus:border-blue-400 w-full max-w-md"
                      placeholder="Título da Missão Diária"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeLevel(level.id); }}
                      className="p-2 text-red-400 hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {expandedLevel === level.id ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {expandedLevel === level.id && (
                  <div className="p-6 space-y-8 bg-[#16213e]/30">
                    {level.questions.map((q, qIdx) => (
                      <div key={q.id} className="relative pl-8 border-l-2 border-blue-500/20 space-y-4">
                        <div className="absolute -left-[11px] top-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center font-pixel text-[8px]">
                          {qIdx + 1}
                        </div>
                        
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded font-pixel text-[8px] flex items-center gap-1 border ${q.type === 'multiple_choice' ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-purple-900/50 text-purple-300 border-purple-700'}`}>
                              {q.type === 'multiple_choice' ? <ListChecks className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                              {q.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Caderno'}
                            </span>
                          </div>
                          <button onClick={() => removeQuestion(level.id, q.id)} className="text-gray-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block font-pixel text-[8px] text-gray-400 mb-2 uppercase">Texto de Apoio (Opcional)</label>
                            <textarea 
                              value={q.contextText || ''}
                              onChange={(e) => updateQuestion(level.id, q.id, { contextText: e.target.value })}
                              className="w-full bg-black/20 border border-blue-900/50 rounded p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                              placeholder="Ex: Um poema ou texto para leitura..."
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block font-pixel text-[8px] text-gray-400 mb-2 uppercase">Enunciado da Questão</label>
                            <textarea 
                              value={q.text}
                              onChange={(e) => updateQuestion(level.id, q.id, { text: e.target.value })}
                              className="w-full bg-black/20 border border-blue-900/50 rounded p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                              placeholder="Qual a pergunta?"
                              rows={2}
                            />
                          </div>

                          {q.type === 'multiple_choice' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {q.options?.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <span className="font-pixel text-[10px] text-yellow-500 w-4">{['A', 'B', 'C', 'D'][oIdx]}</span>
                                  <input 
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...(q.options || [])];
                                      newOpts[oIdx] = e.target.value;
                                      updateQuestion(level.id, q.id, { options: newOpts });
                                    }}
                                    className="flex-1 bg-black/20 border border-blue-900/50 rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                                    placeholder={`Alternativa ${oIdx + 1}`}
                                  />
                                  <input 
                                    type="radio" 
                                    name={`correct-${q.id}`}
                                    checked={q.correctAnswer === opt && opt !== ''}
                                    onChange={() => updateQuestion(level.id, q.id, { correctAnswer: opt })}
                                    className="w-4 h-4 accent-green-500"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-4 pt-4 border-t border-blue-900/30">
                      <button 
                        onClick={() => addQuestion(level.id, 'multiple_choice')}
                        className="flex-1 py-3 border-2 border-dashed border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/10 flex items-center justify-center gap-2 font-pixel text-[10px]"
                      >
                        <Plus className="w-4 h-4" /> + Múltipla Escolha
                      </button>
                      <button 
                        onClick={() => addQuestion(level.id, 'notebook')}
                        className="flex-1 py-3 border-2 border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/10 flex items-center justify-center gap-2 font-pixel text-[10px]"
                      >
                        <Plus className="w-4 h-4" /> + Caderno
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button 
              onClick={addLevel}
              className="w-full py-8 border-4 border-dashed border-yellow-500/20 rounded-xl text-yellow-500/50 hover:text-yellow-500 hover:bg-yellow-500/5 hover:border-yellow-500/50 transition-all flex flex-col items-center justify-center gap-4"
            >
              <Plus className="w-12 h-12" />
              <span className="font-pixel text-sm">Adicionar Nova Missão Diária</span>
            </button>
          </div>
        )}

        {activeTab === 'correct' && (
          <div className="space-y-6">
            {completedLevels.length === 0 ? (
              <div className="text-center py-12 rpg-panel">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="font-sans text-gray-400">Nenhuma missão foi concluída pelo aluno ainda.</p>
              </div>
            ) : (
              completedLevels.map((level, lIdx) => (
                <div key={level.id} className={`rpg-panel overflow-hidden border-2 ${level.teacherCorrected ? 'border-green-500/50' : 'border-orange-500/50'}`}>
                  <div 
                    className="p-4 bg-[#0f3460]/50 flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedLevel(expandedLevel === level.id ? null : level.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-pixel text-blue-400 text-xs">{lIdx + 1}</span>
                      <h3 className="font-pixel text-sm text-white">{level.title}</h3>
                      {level.teacherCorrected ? (
                        <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded font-pixel text-[8px] flex items-center gap-1 border border-green-700">
                          <CheckCircle2 className="w-3 h-3" /> CORRIGIDO
                        </span>
                      ) : (
                        <span className="bg-orange-900/50 text-orange-400 px-2 py-1 rounded font-pixel text-[8px] flex items-center gap-1 border border-orange-700">
                          <AlertCircle className="w-3 h-3" /> PENDENTE
                        </span>
                      )}
                    </div>
                    {expandedLevel === level.id ? <ChevronUp /> : <ChevronDown />}
                  </div>

                  {expandedLevel === level.id && (
                    <div className="p-6 space-y-8 bg-[#16213e]/30">
                      {level.answers?.map((answer, aIdx) => (
                        <div key={answer.questionId} className="relative pl-8 border-l-2 border-blue-500/20 space-y-4">
                          <div className="absolute -left-[11px] top-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center font-pixel text-[8px]">
                            {aIdx + 1}
                          </div>
                          
                          <div className="flex justify-between items-start">
                            <span className={`px-2 py-1 rounded font-pixel text-[8px] flex items-center gap-1 border ${answer.type === 'multiple_choice' ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-purple-900/50 text-purple-300 border-purple-700'}`}>
                              {answer.type === 'multiple_choice' ? <ListChecks className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                              {answer.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Caderno'}
                            </span>
                          </div>

                          <p className="font-sans text-sm text-white">{answer.questionText}</p>

                          {answer.type === 'multiple_choice' ? (
                            <div className="bg-black/20 p-4 rounded border border-blue-900/50">
                              <p className="font-sans text-sm text-gray-300 mb-2">
                                Resposta do Aluno: <span className={answer.isCorrect ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{answer.userAnswer}</span>
                              </p>
                              {!answer.isCorrect && (
                                <p className="font-sans text-sm text-gray-400">
                                  Resposta Correta: <span className="text-green-400">{answer.correctAnswer}</span>
                                </p>
                              )}
                              <p className="font-pixel text-[10px] text-yellow-500 mt-2">XP Obtido: {answer.xpEarned}</p>
                            </div>
                          ) : (
                            <div className="bg-[#0f3460]/30 p-4 rounded border border-purple-900/50">
                              <p className="font-sans text-sm text-gray-300 mb-4">
                                Verifique o caderno do aluno e atribua uma nota (1 a 3):
                              </p>
                              <div className="flex gap-3">
                                {[1, 2, 3].map(score => (
                                  <button
                                    key={score}
                                    onClick={() => handleGradeNotebook(level.id, answer.questionId, score)}
                                    className={`pixel-button w-12 h-12 flex items-center justify-center font-pixel text-xl
                                      ${answer.notebookGrade === score ? 'btn-primary' : 'btn-secondary'}
                                    `}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="pt-6 border-t border-blue-900/30 flex justify-end">
                        <button 
                          onClick={() => finalizeCorrection(level.id)}
                          className="pixel-button btn-primary px-6 py-3 text-xs flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          FINALIZAR CORREÇÃO
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f3460]/90 backdrop-blur-md border-t-4 border-blue-500 z-50 flex justify-center">
        <div className="w-full max-w-4xl flex gap-4">
          <button 
            onClick={onCancel}
            className="pixel-button btn-ghost px-8 py-4 flex-1"
          >
            VOLTAR AO MAPA
          </button>
          <button 
            onClick={() => onSave(levels)}
            disabled={levels.length === 0}
            className="pixel-button btn-primary px-8 py-4 flex-[2] flex items-center justify-center gap-3"
          >
            <Save className="w-6 h-6" />
            SALVAR ALTERAÇÕES
          </button>
        </div>
      </div>
    </div>
  );
}
