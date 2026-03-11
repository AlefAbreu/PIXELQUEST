import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Level } from '../types';
import { Play, Upload, CheckCircle, Lock, ClipboardCheck } from 'lucide-react';

interface MapScreenProps {
  levels: Level[];
  onSelectLevel: (levelId: string) => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
  hasUploaded: boolean;
  onStartGame: () => void;
  onOpenCorrection: (levelId: string) => void;
  onOpenProfessorArea: () => void;
  isAdmin: boolean;
}

export function MapScreen({ levels, onSelectLevel, onUpload, isUploading, hasUploaded, onStartGame, onOpenCorrection, onOpenProfessorArea, isAdmin }: MapScreenProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-rpg-bg)] relative overflow-hidden flex flex-col items-center justify-center p-8 pt-24">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      </div>

      {/* Professor Area Button (Top Right) */}
      <div className="absolute top-20 right-4 z-20">
        <button 
          onClick={onOpenProfessorArea}
          className="pixel-button btn-ghost px-4 py-2 text-[8px] md:text-[10px] flex items-center gap-2"
        >
          <ClipboardCheck className="w-4 h-4" />
          ÁREA DO PROFESSOR
        </button>
      </div>

      {/* Glowing orbs instead of clouds */}
      <motion.div 
        animate={{ x: [0, 50, 0], y: [0, 20, 0], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ x: [0, -50, 0], y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-20 w-80 h-80 bg-purple-600 rounded-full blur-[120px]"
      />

      {/* Title */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 text-center relative z-10"
      >
        <h1 className="font-pixel text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_4px_12px_rgba(255,215,0,0.3)] mb-4">
          PixelQuest
        </h1>
        <p className="font-sans font-bold text-xl text-blue-300 tracking-widest uppercase">
          Aventura Educacional
        </p>
      </motion.div>

      {/* Upload Button */}
      {levels.length === 0 && !hasUploaded && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <label className="pixel-button btn-secondary px-8 py-6 flex items-center gap-4 cursor-pointer">
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                <span className="font-pixel text-sm">Gerando Mundo...</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <span className="font-pixel text-sm md:text-base">Upload PDF</span>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </>
            )}
          </label>
          <p className="mt-6 text-center font-sans font-medium text-gray-400 max-w-md">
            Envie uma lista de exercícios para gerar as fases!
          </p>
        </motion.div>
      )}

      {/* Start Button (After Upload) */}
      {levels.length > 0 && !hasUploaded && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <button 
            onClick={onStartGame}
            className="pixel-button btn-primary px-12 py-6 flex items-center gap-4 cursor-pointer"
          >
            <Play className="w-8 h-8 fill-white" />
            <span className="font-pixel text-xl md:text-2xl">START</span>
          </button>
          <p className="mt-6 text-center font-sans font-medium text-green-400 drop-shadow-md">
            Mundo gerado! Pressione START para iniciar a aventura!
          </p>
        </motion.div>
      )}

      {/* Map Levels */}
      {levels.length > 0 && hasUploaded && (
        <div className="relative z-10 w-full max-w-4xl mt-8">
          {/* Path connecting levels */}
          <div className="absolute top-1/2 left-0 w-full h-2 bg-blue-900/50 -translate-y-1/2 z-0 hidden md:block rounded-full"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-around gap-12 md:gap-4 relative z-10">
            {levels.map((level, index) => {
              const isLocked = index > 0 && !levels[index - 1].completed;
              
              return (
                <motion.div 
                  key={level.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex flex-col items-center relative"
                >
                  {/* Grade Trophy */}
                  {level.completed && level.grade && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: [0, -10, 0], opacity: 1 }}
                      transition={{ y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                      className={`absolute -top-16 bg-[var(--color-rpg-panel)] border-2 rounded-full w-12 h-12 flex items-center justify-center z-20 ${level.grade === 'Pendente' ? 'border-gray-500 shadow-[0_0_15px_rgba(156,163,175,0.5)]' : 'border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.5)]'}`}
                    >
                      <span className={`font-pixel text-[8px] md:text-sm ${level.grade === 'Pendente' ? 'text-gray-400' : 'text-yellow-400'}`}>
                        {level.grade === 'Pendente' ? '...' : level.grade}
                      </span>
                    </motion.div>
                  )}

                  {/* Level Node */}
                  <button
                    onClick={() => !isLocked && onSelectLevel(level.id)}
                    disabled={isLocked}
                    className={`
                      w-24 h-24 rounded-full flex items-center justify-center relative transition-all duration-300
                      ${isLocked 
                        ? 'bg-gray-800 border-4 border-gray-600 cursor-not-allowed opacity-70' 
                        : level.completed 
                          ? 'bg-green-600 border-4 border-green-400 hover:bg-green-500 hover:scale-105 shadow-[0_0_20px_rgba(76,175,80,0.6)]' 
                          : 'bg-blue-600 border-4 border-blue-400 hover:bg-blue-500 hover:scale-105 shadow-[0_0_20px_rgba(33,150,243,0.6)]'}
                    `}
                  >
                    {isLocked ? (
                      <Lock className="w-10 h-10 text-gray-500" />
                    ) : level.completed ? (
                      <CheckCircle className="w-12 h-12 text-white" />
                    ) : (
                      <span className="font-pixel text-3xl text-white drop-shadow-md">{index + 1}</span>
                    )}
                  </button>
                  
                  {/* Level Title */}
                  <div className="mt-6 rpg-panel-sm px-4 py-2 text-center max-w-[200px]">
                    <h3 className="font-pixel text-[10px] leading-tight text-gray-200">{level.title}</h3>
                  </div>

                  {/* Correction Button */}
                  {level.completed && (isAdmin || level.teacherCorrected) && (
                    <button
                      onClick={() => onOpenCorrection(level.id)}
                      className="mt-4 pixel-button btn-secondary px-3 py-1 text-[8px] flex items-center gap-1"
                    >
                      <ClipboardCheck className="w-3 h-3" />
                      {isAdmin ? 'CORRIGIR' : 'VER CORREÇÃO'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
