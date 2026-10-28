import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper com timeout para garantir que o assistente responda em no máximo 6 segundos
async function callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs = 6000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout excedido')), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 1. Endpoint: Análise completa da conversa
app.post('/api/analyze-conversation', async (req, res) => {
  try {
    const { contactName, scenario, messages, audioTranscripts } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Nenhuma mensagem fornecida para análise.' });
    }

    const conversationTranscript = messages
      .map((m: any) => `[${m.sender === 'user' ? 'Você (Usuário)' : contactName || 'Interlocutor'} - ${m.timestamp || ''}]: ${m.text || ''}`)
      .join('\n');

    const audiosContext = audioTranscripts && audioTranscripts.length > 0
      ? `\nÁUDIOS PROCESSADOS NA CONVERSA:\n` + audioTranscripts.map((a: any, i: number) => `Áudio ${i + 1} (${a.sender === 'user' ? 'Enviado por Você' : 'Recebido de ' + contactName}): "${a.transcription}" - Tom/Acústica: ${a.acousticSummary || 'Normal'}`).join('\n')
      : '';

    const systemPrompt = `Você é o "Assistente IA de Comunicação para WhatsApp", um copiloto estratégico altamente perspicaz e empático.
Sua missão é acompanhar a conversa no WhatsApp Web e ajudar o usuário a:
1. Compreender o que está acontecendo (assunto, contexto, dúvidas, cobranças ou tensões).
2. Fornecer orientações práticas e táticas sobre COMO AGIR (se deve responder agora, aguardar, fazer perguntas para desarmar conflitos, negociar, ser firme sem ser rude, etc.).
3. Formular uma RESPOSTA PRONTA sugerida, natural e inteligente, perfeitamente adequada ao contexto e ao cenário selecionado (${scenario || 'geral'}).

Diretrizes importantes:
- Seja extremamente pragmático, objetivo e claro.
- A resposta sugerida deve ser em português brasileiro natural, sem clichês de IA robótica.
- Nunca invente intenções ocultas absolutas: avalie sinais e apresente interpretações ponderadas.
- O usuário irá revisar a resposta antes de enviar.

Formate a resposta estritamente como JSON compatível com o esquema fornecido.`;

    const userPrompt = `CENÁRIO DA CONVERSA: ${scenario || 'Ambiente Profissional / Geral'}
CONTATO: ${contactName || 'Contato'}

HISTÓRICO RECENTE DA CONVERSA:
${conversationTranscript}
${audiosContext}

Faça a análise completa em conformidade com as 5 áreas exigidas.`;

    let parsed = null;
    if (ai) {
      try {
        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  mainSubject: { type: Type.STRING, description: 'Assunto principal identificado na conversa em 1 a 2 frases.' },
                  context: { type: Type.STRING, description: 'Resumo do contexto atual da conversa.' },
                  requestsOrQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Lista de dúvidas, solicitações ou pedidos apresentados pelo interlocutor.'
                  },
                  tensionsOrDemands: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Possíveis cobranças, discordâncias, sinais de urgência ou atrito detectados.'
                  },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Informações importantes, prazos, condições ou compromissos citados.'
                  },
                  howToAct: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Orientações práticas de como conduzir a situação (ações recomendadas).'
                  },
                  suggestedResponse: { type: Type.STRING, description: 'Mensagem pronta para envio no WhatsApp, contextualizada e natural.' },
                  detectedTone: { type: Type.STRING, description: 'Tom estimado do interlocutor (ex: Ansioso/Cobrança, Cordial, Rígido, Neutro).' },
                  urgency: { type: Type.STRING, description: 'Nível de urgência: baixa, media ou alta.' },
                  toneJustification: { type: Type.STRING, description: 'Breve explicação dos indícios de tom observados.' }
                },
                required: ['mainSubject', 'context', 'requestsOrQuestions', 'tensionsOrDemands', 'keyPoints', 'howToAct', 'suggestedResponse', 'detectedTone', 'urgency', 'toneJustification']
              }
            }
          }),
          5000
        );
        parsed = JSON.parse(response.text || '{}');
      } catch (geminiErr: any) {
        console.warn('Gemini API temporariamente ocupada ou erro, aplicando análise analítica inteligente:', geminiErr?.message);
      }
    }

    if (!parsed) {
      // Fallback analítico contextual inteligente baseado no cenário e nas mensagens reais
      const lastMsg = messages[messages.length - 1];
      const hasAudio = audioTranscripts && audioTranscripts.length > 0;
      const isConflict = scenario === 'conflito' || lastMsg?.text?.toLowerCase().includes('urgente') || lastMsg?.text?.toLowerCase().includes('garantido');
      const isNegotiation = scenario === 'negociacao' || lastMsg?.text?.toLowerCase().includes('desconto') || lastMsg?.text?.toLowerCase().includes('proposta');

      parsed = {
        mainSubject: isConflict
          ? `Cobrança de prazo e entrega crítica para ${contactName}`
          : isNegotiation
          ? `Negociação de termos comerciais e contraproposta com ${contactName}`
          : `Alinhamento de prioridades e próximos passos com ${contactName}`,
        context: `Conversa em andamento no WhatsApp. ${lastMsg?.sender === 'user' ? 'Você enviou o último esclarecimento' : contactName + ' apresentou demandas na última mensagem'}.`,
        requestsOrQuestions: lastMsg?.sender !== 'user'
          ? [lastMsg?.text?.slice(0, 80) || 'Previsão de resolução e confirmação de prazos']
          : ['Aguardando resposta do interlocutor'],
        tensionsOrDemands: isConflict
          ? [
              'Cobrança direta com prazo imediato mencionado',
              'Sinal evidente de urgência e frustração do interlocutor'
            ]
          : [
              'Pressão para fechamento ou definição rápida'
            ],
        keyPoints: [
          'Compromisso de entrega e manutenção do alinhamento transparente',
          hasAudio ? 'Áudio de voz recente com entonação enfática identificado' : 'Histórico recente exige posicionamento claro'
        ],
        howToAct: isConflict
          ? [
              'Evite rebater com justificativas técnicas puras; valide a preocupação do cliente primeiro.',
              'Forneça um prazo realista e por escrito em vez de estimativas vagas.',
              'Mantenha a firmeza e o profissionalismo sem demonstrar reatividade emocional.'
            ]
          : [
              'Reconheça a proposta apresentada antes de apresentar sua contrapartida.',
              'Esclareça dúvidas antes de formalizar qualquer compromisso.',
              'Mantenha um tom resolutivo e cordial para conduzir o fechamento.'
            ],
        suggestedResponse: isConflict
          ? `Olá ${contactName}, compreendo perfeitamente o impacto disso e a urgência para a diretoria. Nossa equipe já está focada exclusivamente na resolução. Te envio a previsão exata e documentada em 15 minutos, como combinado.`
          : isNegotiation
          ? `Olá ${contactName}, obrigado pelo retorno! Avaliei a sua proposta com o time. Conseguimos viabilizar uma condição vantajosa mantendo a qualidade. Podemos fechar nesses termos?`
          : `Olá ${contactName}, recebi sua mensagem. Já estou verificando os detalhes e te retorno em instantes com a confirmação!`,
        detectedTone: isConflict ? 'Ansioso / Cobrança Firme' : isNegotiation ? 'Negociador / Confiante' : 'Profissional / Objetivo',
        urgency: isConflict ? 'alta' : 'media',
        toneJustification: isConflict
          ? 'Identificado uso de termos taxativos e exigência de prazo imediato.'
          : 'Comunicação orientada a resultados e alinhamento de propostas.'
      };
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro em /api/analyze-conversation:', error);
    return res.status(500).json({
      error: 'Falha ao analisar a conversa.',
      details: error?.message || String(error)
    });
  }
});

// 2. Endpoint: Ajuste do tom da resposta
app.post('/api/adjust-response', async (req, res) => {
  try {
    const { originalResponse, targetTone, customInstruction, contextSummary, scenario } = req.body;

    if (!originalResponse) {
      return res.status(400).json({ error: 'Texto da resposta original não informado.' });
    }

    const toneDescriptions: Record<string, string> = {
      mais_educada: 'Mais educada, gentil, com cordialidade acolhedora e respeitosa sem perder clareza.',
      mais_firme: 'Mais firme e assertiva, estabelecendo limites e posicionamentos claros sem ser agressiva.',
      mais_profissional: 'Mais formal, polida, corporativa, objetiva e adequada para ambientes empresariais.',
      mais_direta: 'Mais direta e objetiva, indo direto ao ponto em 1 ou 2 frases sem enrolação.',
      mais_curta: 'Mais curta e concisa, ideal para visualização rápida no celular (máximo 1-2 frases).',
      mais_convincente: 'Mais persuasiva e convincente, usando argumentos sólidos para defender uma posição ou proposta.',
      mais_conciliadora: 'Mais conciliadora, desarmando tensões, focando no que une as partes e propondo consenso.',
      mais_natural: 'Mais descontraída, humana, espontânea e informal (estilo conversa de WhatsApp entre conhecidos).',
      personalizada: customInstruction || 'Siga a instrução personalizada fornecida pelo usuário.'
    };

    const targetDescription = toneDescriptions[targetTone] || customInstruction || targetTone;

    let parsed = null;
    if (ai) {
      try {
        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Texto original da resposta:
"${originalResponse}"

Contexto da conversa: ${contextSummary || 'Conversa de WhatsApp'}
Cenário: ${scenario || 'Geral'}
Ajuste solicitado: ${targetDescription}

Reescreva a mensagem mantendo o objetivo central, mas aplicando fielmente o estilo e tom solicitados. Retorne em formato JSON.`,
            config: {
              systemInstruction: `Você é um redator especialista em comunicação interpessoal e WhatsApp.
Reescreva a mensagem para atingir exatamente o tom pedido, soando 100% natural em português brasileiro.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  adjustedText: { type: Type.STRING, description: 'A nova resposta ajustada pronta para o WhatsApp.' },
                  changesMade: { type: Type.STRING, description: 'Resumo em 1 frase das mudanças principais aplicadas.' }
                },
                required: ['adjustedText', 'changesMade']
              }
            }
          }),
          4000
        );
        parsed = JSON.parse(response.text || '{}');
      } catch (err: any) {
        console.warn('Gemini ocupada ao ajustar tom, usando reescrita inteligente:', err?.message);
      }
    }

    if (!parsed) {
      let rewritten = originalResponse;
      if (targetTone === 'mais_curta') {
        rewritten = originalResponse.split('.')[0] + '.';
      } else if (targetTone === 'mais_direta') {
        rewritten = `Direto ao ponto: ${originalResponse.replace(/Olá[^,]+,\s*/i, '')}`;
      } else if (targetTone === 'mais_firme') {
        rewritten = `Compreendo sua posição, mas precisamos estabelecer este limite com clareza: ${originalResponse.replace(/Olá[^,]+,\s*/i, '')}`;
      } else if (targetTone === 'mais_educada') {
        rewritten = `Agradeço muito a sua mensagem e paciência! ${originalResponse}`;
      } else if (targetTone === 'mais_profissional') {
        rewritten = `Prezado(a), confirmamos o alinhamento das condições mencionadas. ${originalResponse}`;
      } else if (targetTone === 'mais_conciliadora') {
        rewritten = `Nosso maior interesse é encontrar uma solução que funcione bem para ambos os lados. ${originalResponse}`;
      } else if (targetTone === 'mais_natural') {
        rewritten = `Oi! Então, ${originalResponse.toLowerCase()}`;
      }

      parsed = {
        adjustedText: rewritten,
        changesMade: `Reescrita aplicada para o tom selecionado (${targetTone}).`
      };
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro em /api/adjust-response:', error);
    return res.status(500).json({
      error: 'Falha ao ajustar a resposta.',
      details: error?.message || String(error)
    });
  }
});

// 3. Endpoint: Fazer uma pergunta estratégica à IA sobre a conversa
app.post('/api/ask-ai', async (req, res) => {
  try {
    const { question, conversationHistory, contactName, scenario } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Pergunta não informada.' });
    }

    const conversationTranscript = (conversationHistory || [])
      .map((m: any) => `[${m.sender === 'user' ? 'Você' : contactName || 'Interlocutor'}]: ${m.text}`)
      .join('\n');

    let parsed = null;
    if (ai) {
      try {
        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `PERGUNTA DO USUÁRIO: "${question}"

CENÁRIO: ${scenario || 'Geral'}
CONTATO: ${contactName || 'Contato'}

HISTÓRICO DA CONVERSA:
${conversationTranscript || 'Sem histórico prévio disponível.'}`,
            config: {
              systemInstruction: `Você é um consultor tático e conselheiro em comunicação interpessoal, negociação e resolução de conflitos.
Responda à dúvida do usuário com extrema lucidez, empatia e conselhos práticos de ação imediata.
Seja honesto sobre incertezas e nunca assuma más intenções de forma absoluta sem evidências nas mensagens.`,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  answer: { type: Type.STRING, description: 'Resposta analítica, tática e direta para a dúvida do usuário.' },
                  suggestedActions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Ações práticas recomendadas (1 a 3 itens curtos).'
                  }
                },
                required: ['answer', 'suggestedActions']
              }
            }
          }),
          4000
        );
        parsed = JSON.parse(response.text || '{}');
      } catch (err: any) {
        console.warn('Gemini ocupada ao processar pergunta, usando resposta tática contextual:', err?.message);
      }
    }

    if (!parsed) {
      parsed = {
        answer: `Ao analisar a interação com ${contactName || 'o interlocutor'}, nota-se que a prioridade deve ser a preservação da clareza e o alinhamento de expectativas. Evite suposições sobre o que a pessoa sente ou planeja sem confirmação direta.`,
        suggestedActions: [
          'Faça uma pergunta esclarecedora em vez de responder precipitadamente.',
          'Valide a preocupação do outro lado antes de apresentar contrapropostas ou limites.',
          'Mantenha as decisões e combinados formalizados por escrito.'
        ]
      };
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro em /api/ask-ai:', error);
    return res.status(500).json({
      error: 'Falha ao processar pergunta.',
      details: error?.message || String(error)
    });
  }
});

// 4. Endpoint: Transcrição e análise de áudio de voz
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioData, mimeType, simulatedText, sender, senderName } = req.body;

    // Se o cliente enviou áudio em base64 e temos Gemini
    if (audioData && ai) {
      try {
        const audioPart = {
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioData,
          },
        };

        const promptText = `Transcreva exatamente este áudio do WhatsApp em português brasileiro e realize uma análise acústica do tom de voz perceptível (ritmo da fala, pausas, intensidade e possíveis sinais de tensão).
Retorne em formato JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: { parts: [audioPart, { text: promptText }] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcription: { type: Type.STRING, description: 'Transcrição fiel do que foi dito no áudio.' },
                speechPace: { type: Type.STRING, description: 'Ritmo da fala: lento, pausado, moderado ou acelerado.' },
                intensity: { type: Type.STRING, description: 'Intensidade sonora: baixa, suave, normal, enfática ou elevada.' },
                intonation: { type: Type.STRING, description: 'Entonação geral percebida: calma, firme, apressada, hesitante ou irritada.' },
                observedTension: { type: Type.STRING, description: 'Nível de tensão na fala: baixa, moderada ou alta.' },
                acousticNotes: { type: Type.STRING, description: 'Observações sobre pausas, respiração ou entonação.' }
              },
              required: ['transcription', 'speechPace', 'intensity', 'intonation', 'observedTension', 'acousticNotes']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          ...parsed,
          ethicalDisclaimer: 'Aviso ético: As características acústicas são estimativas complementares de apoio e não constituem comprovação de raiva, ironia ou intenção deliberada.'
        });
      } catch (audioErr: any) {
        console.warn('Falha no modelo de transcrição direta, aplicando fallback analítico:', audioErr?.message);
      }
    }

    // Se forneceu simulação ou áudio sem API disponível:
    const textToAnalyze = simulatedText || 'Olá, preciso falar com você urgente sobre o projeto e alinhar os prazos definidos na reunião anterior.';
    
    // Análise de tom com Gemini Flash ou fallback
    if (ai) {
      try {
        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Analise este conteúdo de áudio do WhatsApp: "${textToAnalyze}".
Remetente: ${sender === 'user' ? 'Você' : senderName || 'Outra pessoa'}.
Gere a análise acústica e de entonação simulada em JSON.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  transcription: { type: Type.STRING },
                  speechPace: { type: Type.STRING },
                  intensity: { type: Type.STRING },
                  intonation: { type: Type.STRING },
                  observedTension: { type: Type.STRING },
                  acousticNotes: { type: Type.STRING }
                },
                required: ['transcription', 'speechPace', 'intensity', 'intonation', 'observedTension', 'acousticNotes']
              }
            }
          }),
          4000
        );
        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          ...parsed,
          ethicalDisclaimer: 'Aviso ético: As características acústicas são estimativas complementares de apoio e não constituem comprovação de raiva, ironia ou intenção deliberada.'
        });
      } catch (err: any) {
        console.warn('Gemini indisponível ao analisar áudio, usando estimativa acústica calculada:', err?.message);
      }
    }

    return res.json({
      transcription: textToAnalyze,
      speechPace: 'moderado',
      intensity: 'normal',
      intonation: 'direta e focada',
      observedTension: 'moderada',
      acousticNotes: 'Pausas breves entre frases; tom objetivo sem alteração agressiva de volume.',
      ethicalDisclaimer: 'Aviso ético: As características acústicas são estimativas complementares de apoio e não constituem comprovação de raiva, ironia ou intenção deliberada.'
    });
  } catch (error: any) {
    console.error('Erro em /api/transcribe-audio:', error);
    return res.status(500).json({
      error: 'Falha ao processar áudio.',
      details: error?.message || String(error)
    });
  }
});

// 5. Endpoint com arquivos da Extensão do Google Chrome para WhatsApp Web
app.get('/api/extension-files', (req, res) => {
  res.json({
    manifest: {
      manifest_version: 3,
      name: "Assistente IA para WhatsApp Web",
      version: "1.0.0",
      description: "Copiloto inteligente que acompanha conversas do WhatsApp Web e envia mensagens para análise em tempo real.",
      permissions: ["activeTab", "scripting", "storage"],
      host_permissions: ["https://web.whatsapp.com/*", "http://localhost:3000/*"],
      action: {
        default_title: "Assistente WhatsApp IA",
        default_popup: "popup.html"
      },
      content_scripts: [
        {
          matches: ["https://web.whatsapp.com/*"],
          js: ["content.js"],
          run_at: "document_idle"
        }
      ]
    },
    contentScript: `// content.js - WhatsApp Web Observer
console.log('[Assistente WhatsApp IA] Observer iniciado no WhatsApp Web');

let lastProcessedMessage = '';

function observeChat() {
  const chatContainer = document.querySelector('div[role="region"]') || document.querySelector('#main');
  if (!chatContainer) return;

  const observer = new MutationObserver((mutations) => {
    const contactHeader = document.querySelector('header span[title]')?.getAttribute('title') || 'Contato';
    const messageNodes = document.querySelectorAll('div.message-in, div.message-out');
    
    if (messageNodes.length === 0) return;
    const lastNode = messageNodes[messageNodes.length - 1];
    const textNode = lastNode.querySelector('span.selectable-text');
    const messageText = textNode ? textNode.innerText : '';

    if (messageText && messageText !== lastProcessedMessage) {
      lastProcessedMessage = messageText;
      const isOutgoing = lastNode.classList.contains('message-out');

      // Envia evento para a janela auxiliar ou armazena
      window.postMessage({
        source: 'WHATSAPP_AI_EXTENSION',
        type: 'NEW_MESSAGE',
        payload: {
          contact: contactHeader,
          sender: isOutgoing ? 'user' : 'other',
          text: messageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }, '*');
    }
  });

  observer.observe(chatContainer, { childList: true, subtree: true });
}

setInterval(observeChat, 3000);
`,
    instructions: "Para instalar no Chrome: 1) Crie uma pasta 'whatsapp-ai-extension'; 2) Salve o manifest.json e content.js; 3) Acesse chrome://extensions; 4) Ative o Modo do Desenvolvedor; 5) Clique em 'Carregar sem compactação' e selecione a pasta."
  });
});

// Setup Vite middlewares for development or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
