import React, { useState } from 'react';
import { GameState, Level, AnswerRecord } from './types';
import { extractTextFromPdf, generateLevelsFromText } from './services/pdfService';
import { MapScreen } from './components/MapScreen';
import { LevelScreen } from './components/LevelScreen';
import { LevelClearScreen } from './components/LevelClearScreen';
import { HeroPanel } from './components/HeroPanel';
import { CorrectionScreen } from './components/CorrectionScreen';
import { ProfessorArea } from './components/ProfessorArea';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    xp: 0,
    levels: [],
    currentLevelId: null,
    status: 'map',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [lastGrade, setLastGrade] = useState('');

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const text = await extractTextFromPdf(file);
      
      // Simple hash function to identify the content
      const hash = text.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0).toString();

      const cacheKey = `pixelquest_cache_${hash}`;
      const cachedData = localStorage.getItem(cacheKey);

      let levels;
      if (cachedData) {
        console.log("Loading levels from cache...");
        levels = JSON.parse(cachedData);
      } else {
        console.log("Generating new levels via API...");
        levels = await generateLevelsFromText(text);
        if (levels && levels.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(levels));
        }
      }

      if (!levels || levels.length === 0) {
        throw new Error("Não foi possível gerar as fases a partir do texto.");
      }
      setGameState(prev => ({
        ...prev,
        levels,
        status: 'map',
      }));
    } catch (error: any) {
      console.error("Error processing PDF:", error);
      alert(`Erro ao processar o PDF: ${error.message || 'Erro desconhecido'}. Tente novamente.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartGame = () => {
    setHasUploaded(true);
  };

  const handleSelectLevel = (levelId: string) => {
    setGameState(prev => ({
      ...prev,
      currentLevelId: levelId,
      status: 'playing',
    }));
  };

  const handleLevelComplete = (xpEarned: number, grade: string, answers: AnswerRecord[]) => {
    setLastXpEarned(xpEarned);
    setLastGrade(grade);
    
    setGameState(prev => {
      const updatedLevels = prev.levels.map(l => 
        l.id === prev.currentLevelId 
          ? { ...l, completed: true, grade, score: xpEarned, answers } 
          : l
      );
      
      return {
        ...prev,
        xp: prev.xp + xpEarned,
        levels: updatedLevels,
        status: 'level_clear',
      };
    });
  };

  const handleContinueFromClear = () => {
    setGameState(prev => ({
      ...prev,
      currentLevelId: null,
      status: 'map',
    }));
  };

  const handleBackToMap = () => {
    setGameState(prev => ({
      ...prev,
      currentLevelId: null,
      status: 'map',
    }));
  };

  const handleOpenCorrection = (levelId: string) => {
    setGameState(prev => ({
      ...prev,
      currentLevelId: levelId,
      status: 'correction',
    }));
  };

  const handleOpenProfessorArea = () => {
    setGameState(prev => ({ ...prev, status: 'professor_area' }));
  };

  const handleSaveProfessorLevels = (levels: Level[]) => {
    const totalXp = levels.reduce((sum, l) => sum + (l.score || 0), 0);
    setGameState(prev => ({
      ...prev,
      levels,
      xp: totalXp,
      status: 'map'
    }));
    setHasUploaded(true);
  };

  const currentLevel = gameState.levels.find(l => l.id === gameState.currentLevelId);

  return (
    <div className="min-h-screen bg-[var(--color-rpg-bg)] font-sans">
      <HeroPanel xp={gameState.xp} levels={gameState.levels} />
      
      {gameState.status === 'map' && (
        <MapScreen 
          levels={gameState.levels} 
          onSelectLevel={handleSelectLevel} 
          onUpload={handleUpload}
          isUploading={isUploading}
          hasUploaded={hasUploaded}
          onStartGame={handleStartGame}
          onOpenCorrection={handleOpenCorrection}
          onOpenProfessorArea={handleOpenProfessorArea}
        />
      )}
      
      {gameState.status === 'playing' && currentLevel && (
        <LevelScreen 
          level={currentLevel} 
          onComplete={handleLevelComplete} 
          onBack={handleBackToMap}
        />
      )}
      
      {gameState.status === 'level_clear' && (
        <LevelClearScreen 
          xpEarned={lastXpEarned} 
          grade={lastGrade} 
          onContinue={handleContinueFromClear} 
        />
      )}

      {gameState.status === 'correction' && currentLevel && (
        <CorrectionScreen 
          level={currentLevel} 
          onBack={handleBackToMap}
        />
      )}

      {gameState.status === 'professor_area' && (
        <ProfessorArea 
          initialLevels={gameState.levels}
          onSave={handleSaveProfessorLevels}
          onCancel={handleBackToMap}
        />
      )}
    </div>
  );
}
