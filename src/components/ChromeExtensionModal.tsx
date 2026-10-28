import React, { useState } from 'react';
import { X, Copy, Check, Chrome, Download, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

interface ChromeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChromeExtensionModal: React.FC<ChromeExtensionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'content' | 'instructions'>('instructions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const manifestCode = `{
  "manifest_version": 3,
  "name": "Assistente IA - WhatsApp Web Copilot",
  "version": "1.0.0",
  "description": "Copiloto de comunicação para WhatsApp Web. Monitora conversas autorizadas e sugere respostas contextuais em tempo real.",
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "https://web.whatsapp.com/*",
    "http://localhost:3000/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://web.whatsapp.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}`;

  const contentScriptCode = `// content.js - WhatsApp Web Message Observer
console.log('[Assistente IA] Extensão conectada ao WhatsApp Web');

let lastCapturedText = '';

// Monitora mutações no DOM do WhatsApp Web
function startObserving() {
  const mainPane = document.querySelector('#main') || document.querySelector('div[role="region"]');
  if (!mainPane) {
    setTimeout(startObserving, 1500);
    return;
  }

  const observer = new MutationObserver((mutations) => {
    // 1. Identifica o contato atual aberto no cabeçalho
    const headerTitleEl = document.querySelector('header span[title]');
    const currentContact = headerTitleEl ? headerTitleEl.getAttribute('title') : 'Desconhecido';

    // 2. Busca mensagens recentes no chat
    const messageElements = document.querySelectorAll('div.message-in, div.message-out');
    if (messageElements.length === 0) return;

    const latestElement = messageElements[messageElements.length - 1];
    const textSpan = latestElement.querySelector('span.selectable-text');
    const messageText = textSpan ? textSpan.innerText.trim() : '';

    if (messageText && messageText !== lastCapturedText) {
      lastCapturedText = messageText;
      const isUser = latestElement.classList.contains('message-out');

      // Notifica o aplicativo da janela auxiliar via postMessage
      window.postMessage({
        source: 'WHATSAPP_ASSISTANT_EXTENSION',
        type: 'NEW_CHAT_MESSAGE',
        payload: {
          contact: currentContact,
          sender: isUser ? 'user' : 'other',
          text: messageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }, '*');

      console.log('[Assistente IA] Nova mensagem identificada:', { isUser, currentContact, messageText });
    }
  });

  observer.observe(mainPane, { childList: true, subtree: true });
}

// Inicia monitoramento
startObserving();
`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Chrome className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs">
                Extensão do Google Chrome
              </h3>
              <p className="text-[11px] text-slate-500">
                Manifest V3 para leitura no WhatsApp Web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5 gap-2 pt-2 bg-white">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2 px-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'instructions'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Instalação
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`pb-2 px-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'manifest'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            manifest.json
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-2 px-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'content'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            content.js
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'instructions' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-200">
                <div className="flex items-center gap-2 font-medium text-blue-900 mb-1">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Como funciona a integração local</span>
                </div>
                <p className="text-blue-800">
                  A extensão atua no Google Chrome acompanhando as alterações no WhatsApp Web (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono">web.whatsapp.com</code>) e encaminha mensagens autorizadas para processamento pelo copiloto.
                </p>
              </div>

              <ol className="list-decimal list-inside space-y-3 pl-1">
                <li>
                  <strong>Crie uma pasta no seu computador</strong> chamada <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">whatsapp-ai-extension</code>.
                </li>
                <li>
                  Copie o conteúdo das abas <strong>manifest.json</strong> e <strong>content.js</strong> para dentro dessa pasta com os respectivos nomes de arquivo.
                </li>
                <li>
                  No Google Chrome, abra a barra de endereços e acesse: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-700">chrome://extensions</code>.
                </li>
                <li>
                  Ative o interruptor <strong>"Modo do desenvolvedor"</strong> no canto superior direito.
                </li>
                <li>
                  Clique no botão <strong>"Carregar sem compactação"</strong> e selecione a pasta criada.
                </li>
                <li>
                  Abra o WhatsApp Web normalmente. A extensão detectará automaticamente as mensagens e enviará para esta janela auxiliar!
                </li>
              </ol>

              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-900">
                <strong>Dica de uso prático:</strong> Você também pode testar 100% das funcionalidades diretamente pelo simulador ao lado, alternando contatos e simulando novas mensagens e áudios de voz instantaneamente.
              </div>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="relative">
              <button
                onClick={() => copyToClipboard(manifestCode, 'manifest')}
                className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {copiedKey === 'manifest' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
              <pre className="rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {manifestCode}
              </pre>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="relative">
              <button
                onClick={() => copyToClipboard(contentScriptCode, 'content')}
                className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {copiedKey === 'content' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
              <pre className="rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {contentScriptCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-900 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
