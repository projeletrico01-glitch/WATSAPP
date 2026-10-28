import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Paperclip,
  Smile,
  Mic,
  Send,
  CheckCheck,
  RotateCcw,
  Volume2,
  FileText
} from 'lucide-react';
import { ContactConversation, ChatMessage, AudioMetadata } from '../types';
import { AudioPlayerWaveform } from './AudioPlayerWaveform';

interface WhatsAppWebSimulatorProps {
  conversations: ContactConversation[];
  activeContactId: string;
  onSelectContact: (id: string) => void;
  onSendMessage: (text: string) => void;
  onSimulateIncomingReply: () => void;
  onOpenAudioModal: () => void;
  onAnalyzeAudio: (audio: AudioMetadata) => void;
  insertedTextFromAI?: string;
  onClearInsertedText?: () => void;
  isAssistantActive: boolean;
}

export const WhatsAppWebSimulator: React.FC<WhatsAppWebSimulatorProps> = ({
  conversations,
  activeContactId,
  onSelectContact,
  onSendMessage,
  onSimulateIncomingReply,
  onOpenAudioModal,
  onAnalyzeAudio,
  insertedTextFromAI,
  onClearInsertedText,
  isAssistantActive,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [showInsertionNotice, setShowInsertionNotice] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = conversations.find((c) => c.id === activeContactId) || conversations[0];

  useEffect(() => {
    if (insertedTextFromAI) {
      setInputText(insertedTextFromAI);
      setShowInsertionNotice(true);
      const timer = setTimeout(() => setShowInsertionNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [insertedTextFromAI]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact?.messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (onClearInsertedText) onClearInsertedText();
    setShowInsertionNotice(false);
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.roleDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-[#f0f2f5] overflow-hidden rounded-xl border border-slate-200/90 shadow-xs">
      {/* Coluna Esquerda: Lista de Conversas do WhatsApp Web */}
      <div className="w-72 sm:w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        {/* Header do WhatsApp */}
        <div className="flex h-12 items-center justify-between bg-[#f0f2f5] px-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                alt="Seu Perfil"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-xs font-semibold text-slate-800">WhatsApp Web</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowImportModal(true)}
              title="Importar conversa"
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-200/70 transition-colors"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barra de Busca de Conversas */}
        <div className="p-2 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 rounded-lg bg-[#f0f2f5] px-3 py-1.5 text-xs text-slate-600">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar conversa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-slate-400 text-xs"
            />
          </div>
        </div>

        {/* Lista de Contatos com tipografia limpa (sem pílulas coloridas) */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.map((contact) => {
            const isSelected = contact.id === activeContactId;
            const lastMsg = contact.messages[contact.messages.length - 1];

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact.id)}
                className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  {contact.authorizedForAnalysis && isAssistantActive && (
                    <span
                      title="Assistente ativo neste contato"
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-slate-900 text-xs truncate">
                      {contact.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {lastMsg ? lastMsg.timestamp : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate pr-2">
                      {lastMsg?.type === 'audio' ? (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Volume2 className="h-3 w-3 text-slate-400" />
                          Mensagem de voz
                        </span>
                      ) : (
                        lastMsg?.text || 'Sem mensagens'
                      )}
                    </p>
                    {contact.unreadCount > 0 && (
                      <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#00a884] text-[10px] font-semibold text-white flex items-center justify-center">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Metadados limpos e despoluídos */}
                  <div className="mt-0.5 text-[11px] text-slate-400 truncate flex items-center gap-1">
                    <span className="capitalize font-medium text-slate-500">{contact.scenario}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{contact.roleDescription}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coluna Direita: Janela do Chat Ativo */}
      <div className="flex flex-1 flex-col bg-[#efeae2] relative min-w-0">
        {/* Header do Chat Ativo */}
        <div className="flex h-12 items-center justify-between bg-[#f0f2f5] px-4 border-b border-slate-200/80 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <img
              src={activeContact.avatar}
              alt={activeContact.name}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900 text-xs">
                  {activeContact.name}
                </h4>
                <span className="text-[11px] text-slate-400 font-normal">
                  · {activeContact.roleDescription}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                online
              </p>
            </div>
          </div>

          {/* Ações do Chat */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateIncomingReply}
              title="Simular recebimento de nova resposta"
              className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3 text-slate-500" />
              <span>Simular Mensagem</span>
            </button>

            <button
              onClick={onOpenAudioModal}
              title="Gravar ou enviar áudio de voz"
              className="flex items-center gap-1 rounded-md bg-[#00a884] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#009272] transition-colors shadow-2xs"
            >
              <Mic className="h-3 w-3" />
              <span>Áudio</span>
            </button>
          </div>
        </div>

        {/* Fundo sutil */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#000 0.75px, transparent 0.75px)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Feed de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 z-0">
          <div className="flex justify-center my-1.5">
            <span className="text-[10px] text-slate-500 bg-white/80 px-2.5 py-0.5 rounded shadow-2xs">
              Hoje
            </span>
          </div>

          {activeContact.messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-sm sm:max-w-md rounded-lg px-3 py-2 text-xs shadow-2xs ${
                    isUser
                      ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                      : 'bg-white text-slate-900 rounded-tl-none'
                  }`}
                >
                  {!isUser && (
                    <span className="block text-[10px] font-semibold text-[#00a884] mb-0.5">
                      {msg.senderName}
                    </span>
                  )}

                  {msg.type === 'audio' && msg.audio ? (
                    <AudioPlayerWaveform
                      audio={msg.audio}
                      sender={msg.sender}
                      onAnalyzeAudio={onAnalyzeAudio}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-800">
                      {msg.text}
                    </p>
                  )}

                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {isUser && (
                      <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Notificação limpa de inserção */}
        {showInsertionNotice && (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs text-slate-700 border border-slate-200 shadow-sm transition-all animate-in fade-in">
            <span>
              <strong>Sugestão inserida.</strong> Revise o texto antes de enviar.
            </span>
            <button
              onClick={() => setShowInsertionNotice(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Input Footer do WhatsApp Web */}
        <div className="bg-[#f0f2f5] px-4 py-2 border-t border-slate-200 shrink-0 z-10">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              className="text-slate-500 hover:text-slate-700 p-1"
              title="Emojis"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-700 p-1"
              title="Anexar arquivo"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Mensagem..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full rounded-lg bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>

            {inputText.trim() ? (
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884] text-white shadow-2xs hover:bg-[#009272] transition-colors"
                title="Enviar mensagem"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAudioModal}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                title="Gravar mensagem de voz"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 text-sm mb-1">
              Colar Conversa do WhatsApp
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Cole trechos de mensagens para análise imediata pelo copiloto.
            </p>
            <textarea
              rows={5}
              placeholder="Ex:&#10;[14:20] Cliente: Precisamos rever o escopo...&#10;[14:22] Você: Certo, o que sugere?"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-slate-400 font-mono"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (importText.trim()) {
                    onSendMessage(`[Conversa importada]: ${importText.trim()}`);
                    setImportText('');
                    setShowImportModal(false);
                  }
                }}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
