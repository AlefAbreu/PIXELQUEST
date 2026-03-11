import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import { Level, Question } from '../types';

// Set worker path using Vite's ?worker import
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfWorker();

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  if (!fullText || fullText.trim() === '') {
    throw new Error("O PDF não contém texto legível ou é apenas uma imagem.");
  }
  
  return fullText;
}

export async function generateLevelsFromText(text: string): Promise<Level[]> {
  const levels: Level[] = [];
  
  // Split by "DIA " or "Dia "
  const hasDays = /DIA \d+|Dia \d+/i.test(text);
  const blocks = hasDays ? text.split(/(?=DIA \d+|Dia \d+)/i) : [text];
  
  let levelIdCounter = 1;
  let questionIdCounter = 1;

  for (const block of blocks) {
    if (!block.trim()) continue;
    
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) continue;
    
    let title = hasDays ? lines[0] : "Missão de Estudo";
    
    const level: Level = {
      id: `level-${levelIdCounter++}`,
      title: title.length > 60 ? title.substring(0, 60) + '...' : title,
      completed: false,
      questions: []
    };
    
    let currentContext = "";
    let currentQuestion: any = null;
    
    for (let i = hasDays ? 1 : 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match "1. ", "2) ", etc.
      const questionMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
      // Match "a) ", "b) ", "○ a) ", etc.
      const optionMatch = line.match(/^(?:[○o\-\*]\s*)?([a-e])[\.\)]\s+(.*)/i);
      
      if (questionMatch) {
        if (currentQuestion) {
          if (currentQuestion.options && currentQuestion.options.length > 0) {
            currentQuestion.type = 'multiple_choice';
          }
          level.questions.push(currentQuestion);
        }
        
        currentQuestion = {
          id: `q-${questionIdCounter++}`,
          type: 'notebook',
          contextText: currentContext.trim(),
          text: questionMatch[2],
          options: [],
          correctAnswer: '',
          hint: 'Leia com atenção e tente novamente!'
        };
        currentContext = ""; // Reset context
      } else if (optionMatch && currentQuestion) {
        const optText = optionMatch[2];
        currentQuestion.options.push(optText);
        // Set the first option as correct answer by default (since we don't have AI to know the real answer)
        if (currentQuestion.options.length === 1) {
          currentQuestion.correctAnswer = optText;
        }
      } else {
        if (currentQuestion && currentQuestion.options.length === 0) {
          // Append to question text
          currentQuestion.text += '\n' + line;
        } else if (currentQuestion && currentQuestion.options.length > 0) {
          // Append to last option
          currentQuestion.options[currentQuestion.options.length - 1] += ' ' + line;
        } else {
          // Append to context
          currentContext += line + '\n';
        }
      }
    }
    
    if (currentQuestion) {
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        currentQuestion.type = 'multiple_choice';
      }
      level.questions.push(currentQuestion);
    }
    
    if (level.questions.length > 0) {
      levels.push(level);
    }
  }
  
  // If no questions were parsed, create a generic notebook question
  if (levels.length === 0 || levels.every(l => l.questions.length === 0)) {
    return [{
      id: 'level-1',
      title: 'Missão de Estudo',
      completed: false,
      questions: [{
        id: 'q-1',
        type: 'notebook',
        contextText: '',
        text: 'Leia o documento e faça um resumo no seu caderno.',
        options: [],
        correctAnswer: '',
        hint: ''
      }]
    }];
  }
  
  return levels;
}
