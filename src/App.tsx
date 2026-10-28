import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Bot,
  Sparkles,
  Chrome,
  Shield,
  Layers,
  Layout,
  Maximize2,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Monitor
} from 'lucide-react';
import { INITIAL_CONVERSATIONS } from './data/mockConversations';
import {
  ContactConversation,
  ChatMessage,
  ConversationAnalysis,
  AudioMetadata,
  ToneType,
  AIQuestionExchange,
  ScenarioType
} from './types';
import { WhatsAppWebSimulator } from './components/WhatsAppWebSimulator';
import { CompanionWindow } from './components/CompanionWindow';
import { ChromeExtensionModal } from './components/ChromeExtensionModal';
import { AudioRecorderModal } from './components/AudioRecorderModal';

export default function App() {
  const [conversations, setConversations] = useState<ContactConversation[]>(INITIAL_CONVERSATIONS);
  const [activeContactId, setActiveContactId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [isAssistantActive, setIsAssistantActive] = useState(true);
  const [analysisMap, setAnalysisMap] = useState<Record<string, ConversationAnalysis>>({});
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [statusText, setStatusText] = useState('Assistente pronto');
  const [insertedTextForWhatsApp, setInsertedTextForWhatsApp] = useState<string>('');
  const [recentAudioMap, setRecentAudioMap] = useState<Record<string, AudioMetadata | null>>({});

  // Modais e Modos de Visualização
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [viewLayout, setViewLayout] = useState<'split' | 'whatsapp' | 'companion'>('split');
  const [selectedScenarioFilter, setSelectedScenarioFilter] = useState<ScenarioType | 'todos'>('todos');

  const activeContact = conversations.find((c) => c.id === activeContactId) || conversations[0];

  // Função principal de análise com a API do servidor (Gemini 3.8 Flash)
  const triggerAnalysis = useCallback(async (contactId: string, customMessages?: ChatMessage[]) => {
    const contact = conversations.find((c) => c.id === contactId);
    if (!contact || !contact.authorizedForAnalysis || !isAssistantActive) return;

    const msgs = customMessages || contact.messages;
    setIsLoadingAnalysis(true);
    setStatusText('Analisando mensagens com IA...');

    try {
      const audioTranscripts = msgs
        .filter((m) => m.type === 'audio' && m.audio)
        .map((m) => ({
          sender: m.sender,
          transcription: m.audio?.transcription,
          acousticSummary: `Pace: ${m.audio?.speechPace || 'Normal'}, Tensão: ${m.audio?.observedTension || 'Baixa'}`
        }));

      const res = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contact.name,
          scenario: contact.scenario,
          messages: msgs.slice(-10), // últimas mensagens relevantes
          audioTranscripts
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ConversationAnalysis = await res.json();
      setAnalysisMap((prev) => ({ ...prev, [contactId]: data }));
      setStatusText('Sugestão pronta para revisão');
    } catch (err: any) {
      console.error('Erro ao acionar análise:', err);
      setStatusText('Falha na análise. Verifique conexão.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [conversations, isAssistantActive]);

  // Executa a primeira análise ao abrir ou mudar de contato se ainda não houver
  useEffect(() => {
    if (activeContact && !analysisMap[activeContact.id] && isAssistantActive) {
      triggerAnalysis(activeContact.id);
    }
    // Carrega áudio recente se houver
    const lastAudio = [...activeContact.messages].reverse().find((m) => m.type === 'audio')?.audio;
    if (lastAudio) {
      setRecentAudioMap((prev) => ({ ...prev, [activeContact.id]: lastAudio }));
    }
  }, [activeContactId, isAssistantActive]);

  // Enviar mensagem pelo usuário
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      senderName: 'Você',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      status: 'sent'
    };

    const updated = conversations.map((c) => {
      if (c.id === activeContactId) {
        return {
          ...c,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setConversations(updated);
    setInsertedTextForWhatsApp('');

    // Atualiza análise após envio
    const currentMsgs = updated.find((c) => c.id === activeContactId)?.messages;
    if (currentMsgs && isAssistantActive) {
      setTimeout(() => triggerAnalysis(activeContactId, currentMsgs), 800);
    }
  };

  // Simulação de resposta recebida do contato para testar o fluxo contínuo
  const handleSimulateIncomingReply = () => {
    const repliesMap: Record<ScenarioType, string[]> = {
      conflito: [
        'Preciso saber se vou ter esse módulo funcionando antes do almoço. Posso confiar ou preciso acionar o jurídico?',
        'O diretor acabou de passar aqui na mesa me cobrando novamente. Tem como me ligar agora?',
        'Compreendo que houve imprevisto na API, mas o impacto no nosso caixa é imediato. Qual a previsão real?'
      ],
      negociacao: [
        'Conversei com a diretoria aqui. Se você puder nos dar 8% de desconto no plano anual, batemos o martelo hoje mesmo.',
        'Podemos incluir o treinamento da equipe nesse valor negociado?',
        'Agradeço o retorno! Vocês emitem nota fiscal para faturamento em 30 dias?'
      ],
      profissional: [
        'Excelente iniciativa. Vou reservar a sala de reuniões para amanhã às 15h. Traga as métricas do Júnior.',
        'Você acha prudente já apresentar esse plano para o conselho na próxima semana?',
        'Combinado então. Qualquer dúvida me avise.'
      ],
      pessoal: [
        'Tudo bem amor, só tenta não se estressar demais no trabalho. Te espero com carinho!',
        'A minha mãe perguntou se você quer que guarde a sobremesa para mais tarde.',
        'Me avisa quando estiver saindo para eu colocar a mesa.'
      ],
      informal: [
        'Fechado então! Vou levar o carvão e as bebidas, você cuida da carne.',
        'O Pedrinho disse que também vai colar no churrasco. Vai ser show!'
      ]
    };

    const pool = repliesMap[activeContact.scenario] || repliesMap.profissional;
    const randomReply = pool[Math.floor(Math.random() * pool.length)];

    const newMsg: ChatMessage = {
      id: 'msg-inc-' + Date.now(),
      sender: 'other',
      senderName: activeContact.name,
      text: randomReply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      status: 'delivered'
    };

    const updated = conversations.map((c) => {
      if (c.id === activeContactId) {
        return {
          ...c,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setConversations(updated);

    // Reanalisa automaticamente com o novo contexto recebido
    if (isAssistantActive) {
      setTimeout(() => {
        triggerAnalysis(activeContactId, [...activeContact.messages, newMsg]);
      }, 600);
    }
  };

  // Adicionar áudio processado na conversa
  const handleAudioReady = (audio: AudioMetadata) => {
    const newMsg: ChatMessage = {
      id: 'msg-audio-' + Date.now(),
      sender: 'other',
      senderName: activeContact.name,
      text: `Mensagem de voz (${audio.durationSeconds}s)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'audio',
      audio: audio,
      status: 'read'
    };

    const updated = conversations.map((c) => {
      if (c.id === activeContactId) {
        return {
          ...c,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setConversations(updated);
    setRecentAudioMap((prev) => ({ ...prev, [activeContactId]: audio }));

    if (isAssistantActive) {
      setTimeout(() => {
        triggerAnalysis(activeContactId, [...activeContact.messages, newMsg]);
      }, 500);
    }
  };

  // Ajustar tom da resposta via API
  const handleAdjustTone = async (tone: ToneType, customInstruction?: string) => {
    const currentAnalysis = analysisMap[activeContactId];
    if (!currentAnalysis) return undefined;

    setStatusText(`Ajustando tom: ${tone}...`);
    try {
      const res = await fetch('/api/adjust-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalResponse: currentAnalysis.suggestedResponse,
          targetTone: tone,
          customInstruction,
          contextSummary: currentAnalysis.context,
          scenario: activeContact.scenario
        })
      });

      if (!res.ok) throw new Error('Falha ao ajustar tom');
      const data = await res.json();

      // Atualiza a sugestão no estado
      setAnalysisMap((prev) => ({
        ...prev,
        [activeContactId]: {
          ...prev[activeContactId],
          suggestedResponse: data.adjustedText
        }
      }));

      setStatusText(`Tom ajustado para ${tone}`);
      return data.adjustedText;
    } catch (err) {
      console.error(err);
      setStatusText('Erro ao ajustar tom');
      return undefined;
    }
  };

  // Fazer pergunta estratégica à IA via API
  const handleAskAI = async (question: string): Promise<AIQuestionExchange | undefined> => {
    setStatusText('Processando pergunta com IA...');
    try {
      const res = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          conversationHistory: activeContact.messages.slice(-8),
          contactName: activeContact.name,
          scenario: activeContact.scenario
        })
      });

      if (!res.ok) throw new Error('Falha na resposta do copiloto');
      const data = await res.json();

      setStatusText('Orientação gerada com sucesso');
      return {
        id: 'qa-' + Date.now(),
        question,
        answer: data.answer,
        suggestedActions: data.suggestedActions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (err) {
      console.error(err);
      setStatusText('Erro ao consultar IA');
      return undefined;
    }
  };

  // Inserir no WhatsApp Web
  const handleInsertResponseIntoWhatsApp = (text: string) => {
    setInsertedTextForWhatsApp(text);
    setStatusText('Resposta sugerida inserida no chat');
  };

  // Limpar histórico local
  const handleClearHistory = () => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeContactId) {
          return {
            ...c,
            messages: []
          };
        }
        return c;
      })
    );
    setAnalysisMap((prev) => {
      const copy = { ...prev };
      delete copy[activeContactId];
      return copy;
    });
    setStatusText('Histórico local da conversa apagado');
  };

  // Toggle autorização de análise
  const handleToggleAuthorization = () => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeContactId) {
          const nextAuth = !c.authorizedForAnalysis;
          return { ...c, authorizedForAnalysis: nextAuth };
        }
        return c;
      })
    );
  };

  // Ouvinte de mensagens da extensão real do Chrome via window.postMessage
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data?.source === 'WHATSAPP_ASSISTANT_EXTENSION' && event.data?.type === 'NEW_CHAT_MESSAGE') {
        const payload = event.data.payload;
        console.log('[App] Mensagem detectada via extensão Chrome:', payload);
        // Pode atualizar o chat em tempo real se o contato coincidir
      }
    };
    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  const filteredConversations = selectedScenarioFilter === 'todos'
    ? conversations
    : conversations.filter((c) => c.scenario === selectedScenarioFilter);

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100/60 text-slate-800 font-sans overflow-hidden">
      {/* Barra Superior Limpa e Elegante */}
      <header className="flex h-13 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-semibold tracking-tight text-slate-900">
                Assistente IA para WhatsApp
              </h1>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Copiloto em tempo real
              </span>
            </div>
          </div>
        </div>

        {/* Controles de Cenário e Visualização */}
        <div className="flex items-center gap-2">
          {/* Segmented Control de Cenários */}
          <div className="hidden md:flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 gap-0.5">
            {(['todos', 'conflito', 'negociacao', 'profissional', 'pessoal', 'informal'] as const).map((scen) => (
              <button
                key={scen}
                onClick={() => setSelectedScenarioFilter(scen)}
                className={`px-2.5 py-1 rounded-md capitalize text-xs transition-all ${
                  selectedScenarioFilter === scen
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {scen}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Botão Extensão Chrome */}
          <button
            onClick={() => setIsExtensionModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Código da extensão para Google Chrome"
          >
            <Chrome className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Extensão</span>
          </button>

          {/* Alternador de Layout */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-slate-600 gap-0.5">
            <button
              onClick={() => setViewLayout('split')}
              title="Dividido"
              className={`p-1 rounded-md transition-colors ${
                viewLayout === 'split' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('whatsapp')}
              title="Apenas WhatsApp"
              className={`p-1 rounded-md transition-colors ${
                viewLayout === 'whatsapp' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('companion')}
              title="Apenas Copiloto"
              className={`p-1 rounded-md transition-colors ${
                viewLayout === 'companion' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Área Principal de Trabalho */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3 bg-slate-100/60">
        {/* Painel Esquerdo: Simulador do WhatsApp Web */}
        {(viewLayout === 'split' || viewLayout === 'whatsapp') && (
          <div
            className={`h-full transition-all duration-200 ${
              viewLayout === 'split' ? 'w-full lg:w-7/12 xl:w-3/5' : 'w-full'
            }`}
          >
            <WhatsAppWebSimulator
              conversations={filteredConversations}
              activeContactId={activeContactId}
              onSelectContact={(id) => setActiveContactId(id)}
              onSendMessage={handleSendMessage}
              onSimulateIncomingReply={handleSimulateIncomingReply}
              onOpenAudioModal={() => setIsAudioModalOpen(true)}
              onAnalyzeAudio={(audio) => {
                setRecentAudioMap((prev) => ({ ...prev, [activeContactId]: audio }));
                triggerAnalysis(activeContactId);
              }}
              insertedTextFromAI={insertedTextForWhatsApp}
              onClearInsertedText={() => setInsertedTextForWhatsApp('')}
              isAssistantActive={isAssistantActive}
            />
          </div>
        )}

        {/* Painel Direito: Janela Auxiliar de Sugestões (Windows Assistant Window) */}
        {(viewLayout === 'split' || viewLayout === 'companion') && (
          <div
            className={`h-full transition-all duration-200 ${
              viewLayout === 'split' ? 'w-full lg:w-5/12 xl:w-2/5' : 'w-full'
            }`}
          >
            <CompanionWindow
              contactName={activeContact.name}
              scenario={activeContact.scenario}
              analysis={analysisMap[activeContactId] || null}
              isLoadingAnalysis={isLoadingAnalysis}
              onRefreshAnalysis={() => triggerAnalysis(activeContactId)}
              onInsertResponseIntoWhatsApp={handleInsertResponseIntoWhatsApp}
              onAdjustTone={handleAdjustTone}
              onAskAI={handleAskAI}
              recentAudio={recentAudioMap[activeContactId]}
              isAssistantActive={isAssistantActive}
              onToggleAssistant={() => setIsAssistantActive(!isAssistantActive)}
              isAuthorized={activeContact.authorizedForAnalysis}
              onToggleAuthorization={handleToggleAuthorization}
              onClearHistory={handleClearHistory}
              activeStatusText={statusText}
            />
          </div>
        )}
      </main>

      {/* Modal da Extensão Chrome */}
      <ChromeExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
      />

      {/* Modal de Gravação / Transcrição de Áudio de Voz */}
      <AudioRecorderModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onAudioReady={handleAudioReady}
        senderName={activeContact.name}
      />
    </div>
  );
}
