import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  HelpCircle,
  Copy,
  Check,
  Send,
  Lightbulb,
  RefreshCw,
  Volume2,
  Trash2,
  Lock,
  CheckCircle2,
  Edit3,
  SlidersHorizontal,
  ChevronRight,
  MessageSquareQuote
} from 'lucide-react';
import {
  ConversationAnalysis,
  AudioMetadata,
  ToneType,
  AIQuestionExchange,
  ScenarioType
} from '../types';

interface CompanionWindowProps {
  contactName: string;
  scenario: ScenarioType;
  analysis: ConversationAnalysis | null;
  isLoadingAnalysis: boolean;
  onRefreshAnalysis: () => void;
  onInsertResponseIntoWhatsApp: (text: string) => void;
  onAdjustTone: (tone: ToneType, customInstruction?: string) => Promise<string | undefined>;
  onAskAI: (question: string) => Promise<AIQuestionExchange | undefined>;
  recentAudio?: AudioMetadata | null;
  isAssistantActive: boolean;
  onToggleAssistant: () => void;
  isAuthorized: boolean;
  onToggleAuthorization: () => void;
  onClearHistory: () => void;
  activeStatusText: string;
}

export const CompanionWindow: React.FC<CompanionWindowProps> = ({
  contactName,
  scenario,
  analysis,
  isLoadingAnalysis,
  onRefreshAnalysis,
  onInsertResponseIntoWhatsApp,
  onAdjustTone,
  onAskAI,
  recentAudio,
  isAssistantActive,
  onToggleAssistant,
  isAuthorized,
  onToggleAuthorization,
  onClearHistory,
  activeStatusText,
}) => {
  const [activeTab, setActiveTab] = useState<'visaoGeral' | 'resposta' | 'perguntas' | 'audios' | 'privacidade'>('visaoGeral');
  const [editableResponse, setEditableResponse] = useState('');
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [isAdjustingTone, setIsAdjustingTone] = useState(false);
  const [customToneInput, setCustomToneInput] = useState('');
  const [showCustomToneField, setShowCustomToneField] = useState(false);

  // Pergunta à IA
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [qaHistory, setQaHistory] = useState<AIQuestionExchange[]>([]);

  React.useEffect(() => {
    if (analysis?.suggestedResponse) {
      setEditableResponse(analysis.suggestedResponse);
    }
  }, [analysis?.suggestedResponse]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleAdjustTone = async (tone: ToneType, custom?: string) => {
    setIsAdjustingTone(true);
    const adjusted = await onAdjustTone(tone, custom);
    if (adjusted) {
      setEditableResponse(adjusted);
    }
    setIsAdjustingTone(false);
  };

  const handleAsk = async (questionToAsk?: string) => {
    const q = questionToAsk || userQuestion;
    if (!q.trim()) return;

    setIsAskingAI(true);
    const result = await onAskAI(q);
    if (result) {
      setQaHistory((prev) => [result, ...prev]);
      setUserQuestion('');
    }
    setIsAskingAI(false);
  };

  const quickQuestions = [
    'O que essa pessoa pode estar querendo dizer?',
    'Como responder sem gerar atrito?',
    'Como ser firme sem parecer rude?',
    'Estou deixando passar algum detalhe?',
    'Quais as possíveis consequências dessa resposta?'
  ];

  const toneButtons: { key: ToneType; label: string }[] = [
    { key: 'mais_educada', label: 'Educada' },
    { key: 'mais_firme', label: 'Firme' },
    { key: 'mais_profissional', label: 'Profissional' },
    { key: 'mais_direta', label: 'Direta' },
    { key: 'mais_curta', label: 'Curta' },
    { key: 'mais_convincente', label: 'Convincente' },
    { key: 'mais_conciliadora', label: 'Conciliadora' },
    { key: 'mais_natural', label: 'Natural' }
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white text-slate-800 rounded-xl shadow-xs border border-slate-200/90 overflow-hidden font-sans">
      {/* 1. Barra de Título Minimalista estilo Windows / macOS */}
      <div className="flex h-11 items-center justify-between px-4 bg-slate-50/80 border-b border-slate-200/70 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-slate-900">
            Copiloto de Comunicação
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500 font-normal">
            Janela Auxiliar
          </span>
        </div>

        {/* Status e Ações */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleAssistant}
            className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-900 transition-colors"
            title="Alternar estado do assistente"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isAssistantActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <span className="font-medium">
              {isAssistantActive ? 'Ativo' : 'Pausado'}
            </span>
          </button>

          <button
            onClick={onRefreshAnalysis}
            title="Atualizar análise"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAnalysis ? 'animate-spin text-slate-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Barra de Contexto Limpa */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 text-xs text-slate-500 bg-white shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-medium text-slate-900 truncate">{contactName}</span>
          <span className="text-slate-300">·</span>
          <span className="capitalize text-slate-500">{scenario}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>{activeStatusText}</span>
          {isLoadingAnalysis && (
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* 3. Segmented Control Limpo para Abas */}
      <div className="px-4 pt-3 pb-2 bg-white shrink-0">
        <div className="flex items-center p-1 bg-slate-100/80 rounded-lg text-xs font-medium text-slate-600 gap-0.5">
          <button
            onClick={() => setActiveTab('visaoGeral')}
            className={`flex-1 py-1 px-2.5 rounded-md transition-all text-center ${
              activeTab === 'visaoGeral'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('resposta')}
            className={`flex-1 py-1 px-2.5 rounded-md transition-all text-center ${
              activeTab === 'resposta'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Resposta & Tons
          </button>
          <button
            onClick={() => setActiveTab('perguntas')}
            className={`flex-1 py-1 px-2.5 rounded-md transition-all text-center ${
              activeTab === 'perguntas'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Perguntar à IA
          </button>
          <button
            onClick={() => setActiveTab('audios')}
            className={`flex-1 py-1 px-2.5 rounded-md transition-all text-center ${
              activeTab === 'audios'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Áudios
          </button>
          <button
            onClick={() => setActiveTab('privacidade')}
            className={`flex-1 py-1 px-2.5 rounded-md transition-all text-center ${
              activeTab === 'privacidade'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Privacidade
          </button>
        </div>
      </div>

      {/* 4. Corpo Principal com Rolagem Suave */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Aviso de privacidade discreto */}
        {!isAuthorized && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Acompanhamento pausado para este contato por privacidade.</span>
            </div>
            <button
              onClick={onToggleAuthorization}
              className="text-xs font-semibold text-slate-900 hover:underline"
            >
              Autorizar
            </button>
          </div>
        )}

        {/* Loading state minimalista */}
        {isLoadingAnalysis && !analysis && (
          <div className="py-12 text-center space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-slate-400" />
            <p className="text-xs font-medium text-slate-600">
              Analisando conversa em tempo real...
            </p>
          </div>
        )}

        {/* ABA: VISÃO GERAL DAS 5 ÁREAS */}
        {activeTab === 'visaoGeral' && analysis && (
          <div className="space-y-4">
            {/* 3.1. ÁREA 1: ANÁLISE DA CONVERSA */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">01</span>
                  <h3 className="font-semibold text-xs tracking-tight text-slate-900 uppercase">
                    Análise da Conversa
                  </h3>
                </div>
                {/* Metadados limpos sem badges coloridos */}
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="font-medium text-slate-700">Tom: {analysis.detectedTone}</span>
                  <span aria-hidden="true">·</span>
                  <span>Urgência: {analysis.urgency}</span>
                </div>
              </div>

              {/* Assunto Principal */}
              <div>
                <p className="text-xs text-slate-900 font-semibold leading-relaxed">
                  {analysis.mainSubject}
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {analysis.context}
                </p>
              </div>

              {/* Solicitações e Cobranças em Lista Limpa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="rounded-lg bg-slate-50/70 p-3 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-700 block mb-1.5">
                    Dúvidas ou Solicitações
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {analysis.requestsOrQuestions?.map((req, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-slate-400">·</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-slate-50/70 p-3 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-700 block mb-1.5">
                    Cobranças ou Tensões
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {analysis.tensionsOrDemands?.map((ten, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-slate-400">·</span>
                        <span>{ten}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {analysis.keyPoints && analysis.keyPoints.length > 0 && (
                <div className="text-[11px] text-slate-500 pt-1">
                  <span className="font-medium text-slate-700">Pontos anteriores: </span>
                  {analysis.keyPoints.join(' · ')}
                </div>
              )}
            </section>

            {/* 3.2. ÁREA 2: COMO AGIR */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">02</span>
                <h3 className="font-semibold text-xs tracking-tight text-slate-900 uppercase">
                  Como Agir (Orientações Práticas)
                </h3>
              </div>

              <div className="space-y-2">
                {analysis.howToAct?.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg bg-slate-50/50 p-2.5 border border-slate-100 text-xs text-slate-700 leading-relaxed"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3.3. ÁREA 3: RESPOSTA SUGERIDA */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">03</span>
                  <h3 className="font-semibold text-xs tracking-tight text-slate-900 uppercase">
                    Resposta Sugerida
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Revisão antes do envio</span>
              </div>

              <textarea
                rows={4}
                value={editableResponse}
                onChange={(e) => setEditableResponse(e.target.value)}
                className="w-full rounded-lg bg-slate-50 p-3 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:border-slate-400 focus:outline-none leading-relaxed transition-colors font-sans"
              />

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    {copiedResponse ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onInsertResponseIntoWhatsApp(editableResponse)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 active:scale-95 transition-all shadow-2xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Usar no WhatsApp</span>
                  </button>
                </div>

                <button
                  onClick={onRefreshAnalysis}
                  className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Regenerar
                </button>
              </div>
            </section>

            {/* 3.4. ÁREA 4: AJUSTAR RESPOSTA */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">04</span>
                  <h3 className="font-semibold text-xs tracking-tight text-slate-900 uppercase">
                    Ajustar Tom
                  </h3>
                </div>
                {isAdjustingTone && (
                  <span className="text-[11px] text-slate-500 animate-pulse">
                    Ajustando...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {toneButtons.map((t) => (
                  <button
                    key={t.key}
                    disabled={isAdjustingTone}
                    onClick={() => handleAdjustTone(t.key)}
                    className="rounded-lg bg-slate-50 py-1.5 px-2 text-xs font-medium text-slate-700 border border-slate-200/70 hover:bg-white hover:border-slate-300 hover:text-slate-900 transition-all text-center disabled:opacity-50"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="pt-0.5">
                {!showCustomToneField ? (
                  <button
                    onClick={() => setShowCustomToneField(true)}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    + Personalizar tom com instrução livre
                  </button>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ex: Peça um prazo adicional com cordialidade..."
                      value={customToneInput}
                      onChange={(e) => setCustomToneInput(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-800 border border-slate-200 outline-none focus:bg-white focus:border-slate-400"
                    />
                    <button
                      onClick={() => {
                        if (customToneInput.trim()) {
                          handleAdjustTone('personalizada', customToneInput.trim());
                        }
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => setShowCustomToneField(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 3.5. ÁREA 5: FAZER UMA PERGUNTA À IA */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-[11px] font-mono text-slate-400 font-semibold">05</span>
                <h3 className="font-semibold text-xs tracking-tight text-slate-900 uppercase">
                  Perguntar à IA sobre a conversa
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    disabled={isAskingAI}
                    onClick={() => handleAsk(q)}
                    className="rounded-md bg-slate-50 px-2.5 py-1 text-xs text-slate-600 border border-slate-200/60 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Escreva sua pergunta específica sobre a conversa..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 outline-none focus:bg-white focus:border-slate-400 transition-colors"
                />
                <button
                  disabled={isAskingAI || !userQuestion.trim()}
                  onClick={() => handleAsk()}
                  className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isAskingAI ? 'Consultando...' : 'Perguntar'}
                </button>
              </div>

              {qaHistory.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  {qaHistory.map((qa) => (
                    <div
                      key={qa.id}
                      className="rounded-lg bg-slate-50/70 p-3 border border-slate-100 space-y-1.5 text-xs"
                    >
                      <div className="font-semibold text-slate-800">
                        "{qa.question}"
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {qa.answer}
                      </p>
                      {qa.suggestedActions && qa.suggestedActions.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[11px] font-medium text-slate-700 block mb-0.5">
                            Orientações recomendadas:
                          </span>
                          <ul className="space-y-0.5 text-[11px] text-slate-600">
                            {qa.suggestedActions.map((act, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span>·</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ABA: RESPOSTA & TONS */}
        {activeTab === 'resposta' && analysis && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
                Resposta Sugerida Atual
              </h4>
              <textarea
                rows={6}
                value={editableResponse}
                onChange={(e) => setEditableResponse(e.target.value)}
                className="w-full rounded-lg bg-slate-50 p-3 text-xs text-slate-800 border border-slate-200 focus:bg-white focus:border-slate-400 focus:outline-none leading-relaxed transition-colors"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleCopy}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50"
                >
                  {copiedResponse ? 'Copiado!' : 'Copiar Texto'}
                </button>
                <button
                  onClick={() => onInsertResponseIntoWhatsApp(editableResponse)}
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Usar no WhatsApp Web
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
                Selecione o Tom
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {toneButtons.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleAdjustTone(t.key)}
                    className="rounded-lg bg-slate-50 p-2 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-white hover:border-slate-300 transition-colors text-center"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA: PERGUNTAS À IA */}
        {activeTab === 'perguntas' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
                Perguntas sobre a conversa
              </h4>
              <p className="text-xs text-slate-500">
                Consulte o assistente para entender entrelinhas, evitar reações impulsivas ou formular estratégias.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escreva sua dúvida..."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800 border border-slate-200 outline-none focus:bg-white focus:border-slate-400"
                />
                <button
                  disabled={isAskingAI || !userQuestion.trim()}
                  onClick={() => handleAsk()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isAskingAI ? 'Consultando...' : 'Enviar'}
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAsk(q)}
                    className="rounded-md bg-slate-50 px-2.5 py-1 text-xs text-slate-600 border border-slate-200/60 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {qaHistory.map((qa) => (
                <div key={qa.id} className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-900">"{qa.question}"</div>
                  <p className="text-slate-600 leading-relaxed">{qa.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: ÁUDIOS DE VOZ */}
        {activeTab === 'audios' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
                Interpretação de Áudios de Voz
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Áudios acessíveis são transcritos e avaliados quanto ao ritmo da fala, intensidade e entonação.
              </p>

              {recentAudio ? (
                <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200/70 space-y-3">
                  <div>
                    <span className="text-[11px] font-medium text-slate-600 block mb-1">
                      Transcrição Recente
                    </span>
                    <p className="text-xs text-slate-900 italic bg-white p-2.5 rounded border border-slate-200">
                      "{recentAudio.transcription}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Ritmo</span>
                      <strong className="text-slate-800 capitalize">{recentAudio.speechPace || 'Normal'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Intensidade</span>
                      <strong className="text-slate-800 capitalize">{recentAudio.intensity || 'Normal'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Entonação</span>
                      <strong className="text-slate-800 capitalize">{recentAudio.intonation || 'Firme'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Tensão Estimada</span>
                      <strong className="text-slate-800 capitalize">{recentAudio.observedTension || 'Baixa'}</strong>
                    </div>
                  </div>

                  <div className="rounded bg-slate-100/70 p-2.5 text-[11px] text-slate-600 leading-relaxed border border-slate-200/60">
                    <strong>Nota ética:</strong> Características acústicas são estimativas complementares de apoio e não devem ser tratadas como prova absoluta de intenção deliberada.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500 border border-slate-200/60">
                  Nenhum áudio novo registrado nesta conversa.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: PRIVACIDADE */}
        {activeTab === 'privacidade' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-tight text-slate-900">
                Privacidade & Armazenamento Local
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Você mantém o controle total sobre quais conversas são monitoradas e processadas pelo assistente.
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-medium text-slate-800 block">
                      Autorizar Acompanhamento ({contactName})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Permite leitura e análise das mensagens deste contato
                    </span>
                  </div>
                  <button
                    onClick={onToggleAuthorization}
                    className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                      isAuthorized
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {isAuthorized ? 'Autorizado' : 'Bloqueado'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-medium text-slate-800 block">
                      Limpar Histórico Desta Conversa
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Remove o contexto em memória local
                    </span>
                  </div>
                  <button
                    onClick={onClearHistory}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Limpar</span>
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1 border border-slate-200/60">
                <div className="font-semibold text-slate-700">Garantias do Copiloto:</div>
                <div>· Mensagens nunca são enviadas de forma automática pelo assistente.</div>
                <div>· O histórico de cada contato permanece estritamente isolado.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Footer Limpo */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-t border-slate-200/70 text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Shield className="h-3.5 w-3.5 text-slate-400" />
          <span>Revisão humana obrigatória</span>
        </div>
        <button
          onClick={onRefreshAnalysis}
          className="text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          Reanalisar
        </button>
      </div>
    </div>
  );
};
