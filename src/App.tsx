import React, { useState, useEffect } from 'react';
import { GameState, Level, AnswerRecord } from './types';
import { extractTextFromPdf, generateLevelsFromText } from './services/pdfService';
import { MapScreen } from './components/MapScreen';
import { LevelScreen } from './components/LevelScreen';
import { LevelClearScreen } from './components/LevelClearScreen';
import { HeroPanel } from './components/HeroPanel';
import { CorrectionScreen } from './components/CorrectionScreen';
import { ProfessorArea } from './components/ProfessorArea';
import { auth, db, loginAnonymously, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, getDoc, writeBatch } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          // Ensure user document exists
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              role: 'student',
              xp: 0
            });
          }
          setIsAuthReady(true);
        } else {
          // Auto login anonymously if not logged in
          await loginAnonymously();
        }
      } catch (error: any) {
        console.error("Auth error:", error);
        if (error?.code === 'auth/operation-not-allowed') {
          setAuthError("A Autenticação Anônima não está ativada no seu projeto Firebase.");
        } else {
          setAuthError(error.message || "Erro desconhecido ao conectar com o banco de dados.");
        }
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    // Listen to levels
    const unsubscribeLevels = onSnapshot(collection(db, 'levels'), (snapshot) => {
      const loadedLevels: Level[] = [];
      snapshot.forEach((doc) => {
        loadedLevels.push({ id: doc.id, ...doc.data() } as Level);
      });
      
      // Sort levels by creation time if available, or just keep them stable
      loadedLevels.sort((a, b) => a.id.localeCompare(b.id));

      setGameState(prev => {
        const totalXp = loadedLevels.reduce((sum, l) => sum + (l.score || 0), 0);
        return {
          ...prev,
          levels: loadedLevels,
          xp: totalXp,
        };
      });
      
      if (loadedLevels.length > 0) {
        setHasUploaded(true);
      }
    }, (error) => {
      console.error("Error fetching levels:", error);
    });

    return () => unsubscribeLevels();
  }, [isAuthReady, user]);

  const handleUpload = async (file: File) => {
    // Keeping this for legacy/fallback, but ideally professor uses ProfessorArea
    setIsUploading(true);
    try {
      const text = await extractTextFromPdf(file);
      const levels = await generateLevelsFromText(text);
      if (!levels || levels.length === 0) {
        throw new Error("Não foi possível gerar as fases a partir do texto.");
      }
      
      // Save to Firestore
      const batch = writeBatch(db);
      levels.forEach(level => {
        const levelRef = doc(db, 'levels', level.id);
        batch.set(levelRef, { ...level, createdAt: new Date().toISOString() });
      });
      await batch.commit();

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

  const handleLevelComplete = async (xpEarned: number, grade: string, answers: AnswerRecord[]) => {
    setLastXpEarned(xpEarned);
    setLastGrade(grade);
    
    if (gameState.currentLevelId) {
      const levelRef = doc(db, 'levels', gameState.currentLevelId);
      try {
        await setDoc(levelRef, {
          completed: true,
          grade,
          score: xpEarned,
          answers
        }, { merge: true });
      } catch (error) {
        console.error("Error saving level completion:", error);
      }
    }

    setGameState(prev => ({
      ...prev,
      status: 'level_clear',
    }));
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

  const handleSaveProfessorLevels = async (levels: Level[]) => {
    try {
      const batch = writeBatch(db);
      
      // Find levels that were deleted
      const currentLevelIds = new Set<string>(gameState.levels.map(l => l.id));
      const newLevelIds = new Set<string>(levels.map(l => l.id));
      
      const deletedLevelIds = Array.from(currentLevelIds).filter(id => !newLevelIds.has(id));
      
      // Delete removed levels
      deletedLevelIds.forEach(id => {
        const levelRef = doc(db, 'levels', id);
        batch.delete(levelRef);
      });

      // Upsert remaining levels
      levels.forEach(level => {
        const levelRef = doc(db, 'levels', level.id);
        batch.set(levelRef, { 
          ...level, 
          createdAt: level.createdAt || new Date().toISOString() 
        }, { merge: true });
      });
      
      await batch.commit();
      
      setGameState(prev => ({
        ...prev,
        status: 'map'
      }));
    } catch (error) {
      console.error("Error saving professor levels:", error);
      alert("Erro ao salvar as missões. Verifique sua conexão.");
    }
  };

  const handleUnlockProfessor = () => {
    const pin = prompt('Digite o PIN do professor (Padrão: 1234):');
    if (pin === '1234') {
      setIsAdmin(true);
      alert('Área do Professor desbloqueada!');
    } else if (pin !== null) {
      alert('PIN incorreto!');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[var(--color-rpg-bg)] flex items-center justify-center">
        <div className="font-pixel text-yellow-400 animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[var(--color-rpg-bg)] flex flex-col items-center justify-center p-4">
        <div className="rpg-panel p-8 max-w-md w-full text-center border-2 border-red-500/50">
          <h1 className="font-pixel text-xl text-red-400 mb-4">Erro de Conexão</h1>
          <p className="font-sans text-gray-300 mb-6">{authError}</p>
          <p className="font-sans text-sm text-gray-400">
            Para usar o login invisível, você precisa ativar o provedor "Anônimo" no console do Firebase.
          </p>
        </div>
      </div>
    );
  }

  const currentLevel = gameState.levels.find(l => l.id === gameState.currentLevelId);

  return (
    <div className="min-h-screen bg-[var(--color-rpg-bg)] font-sans">
      <HeroPanel xp={gameState.xp} levels={gameState.levels} />
      
      {!isAdmin && gameState.status === 'map' && (
        <button 
          onClick={handleUnlockProfessor}
          className="fixed bottom-4 right-4 z-50 pixel-button btn-ghost px-3 py-2 text-[10px] text-gray-500 hover:text-white"
        >
          PROFESSOR
        </button>
      )}
      
      {gameState.status === 'map' && (
        <MapScreen 
          levels={gameState.levels} 
          onSelectLevel={handleSelectLevel} 
          onUpload={handleUpload}
          isUploading={isUploading}
          hasUploaded={hasUploaded}
          onStartGame={handleStartGame}
          onOpenCorrection={handleOpenCorrection}
          onOpenProfessorArea={isAdmin ? handleOpenProfessorArea : undefined}
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

      {gameState.status === 'professor_area' && isAdmin && (
        <ProfessorArea 
          initialLevels={gameState.levels}
          onSave={handleSaveProfessorLevels}
          onCancel={handleBackToMap}
        />
      )}
    </div>
  );
}
