import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import { GoogleGenAI, Type } from '@google/genai';
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
  let apiKey = '';
  
  // If Vite replaced process.env.GEMINI_API_KEY at build time, it will be a string literal here.
  // We assign it directly. If it wasn't replaced, it will evaluate process.env.GEMINI_API_KEY at runtime.
  try {
    const injectedKey = process.env.GEMINI_API_KEY;
    if (injectedKey && typeof injectedKey === 'string') {
      apiKey = injectedKey;
    }
  } catch (e) {
    // If process is not defined and Vite didn't replace it, it will throw a ReferenceError.
    console.warn("Could not read GEMINI_API_KEY from environment.");
  }

  if (!apiKey) {
    throw new Error("A chave da API do Gemini não foi encontrada. Se você publicou o app, certifique-se de que a chave (GEMINI_API_KEY) está configurada nas configurações (Settings) do projeto publicado.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
  Você é um designer de jogos educacionais. Analise o seguinte texto extraído de uma lista de exercícios em PDF e transforme-o em missões (fases) de um jogo 16-bits.
  
  Regras:
  1. O PDF apresenta as atividades divididas em blocos de "Missão Diária" ou dias. Você DEVE dividir o conteúdo do jogo exatamente nesses mesmos blocos diários. Cada "Fase" (Level) do jogo corresponderá a um dia/bloco de missão do PDF.
  2. O título de cada fase deve refletir o dia ou a missão diária correspondente (ex: "Missão Diária 1", "Dia 2 - Aventura Matemática", etc).
  3. Identifique as questões e classifique-as em dois tipos:
     - "multiple_choice" (Múltipla Escolha): Questões que podem ser respondidas com alternativas. Se o texto não tiver alternativas, crie 4 alternativas plausíveis baseadas no contexto, sendo apenas 1 correta. Forneça uma dica curta e encorajadora para caso a criança erre.
     - "notebook" (Caderno): Questões dissertativas, de desenho ou que exigem escrita física.
  4. Muitas questões possuem um texto introdutório ou de apoio (ex: um poema, um trecho de livro, uma explicação). NÃO suprima esse texto. Coloque-o no campo 'contextText'.
  5. Retorne APENAS um JSON válido seguindo estritamente este schema.

  Texto do PDF:
  ${text.substring(0, 15000)} // Limit text to avoid token limits if too large
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "ID único da fase, ex: 'level-1'" },
            title: { type: Type.STRING, description: "Título divertido da fase" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "ID único da questão" },
                  type: { type: Type.STRING, description: "'multiple_choice' ou 'notebook'" },
                  contextText: { type: Type.STRING, description: "Texto introdutório ou de apoio da questão, se houver" },
                  text: { type: Type.STRING, description: "O enunciado da questão" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array de 4 strings com as alternativas (apenas para multiple_choice)"
                  },
                  correctAnswer: { type: Type.STRING, description: "A alternativa correta exata (apenas para multiple_choice)" },
                  hint: { type: Type.STRING, description: "Dica curta caso erre (apenas para multiple_choice)" }
                },
                required: ["id", "type", "text"]
              }
            }
          },
          required: ["id", "title", "questions"]
        }
      }
    }
  });

  const jsonStr = response.text?.trim() || '[]';
  try {
    const parsed = JSON.parse(jsonStr);
    // Add default game state fields
    return parsed.map((level: any) => ({
      ...level,
      completed: false,
      questions: level.questions.map((q: any) => ({
        ...q,
        // Ensure options exist for multiple choice
        options: q.type === 'multiple_choice' && (!q.options || q.options.length === 0) 
          ? ['A', 'B', 'C', 'D'] // Fallback
          : q.options
      }))
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}
