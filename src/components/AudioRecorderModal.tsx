import React, { useState, useRef } from 'react';
import { Mic, Square, Play, AlertCircle, X, Sparkles, Check, Loader2, Volume2 } from 'lucide-react';
import { AudioMetadata } from '../types';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioReady: (audio: AudioMetadata) => void;
  senderName: string;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  onAudioReady,
  senderName,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const presets = [
    {
      title: 'Cobrança Firme e Urgente',
      scenario: 'Conflito / Cobrança',
      text: 'Preciso que você me dê uma resposta definitiva até o final da manhã. Estamos com o time parado esperando esse retorno e o cliente final já cobrou a entrega.',
      pace: 'acelerado',
      intensity: 'enfática',
      intonation: 'firme e pressionadora',
      tension: 'alta',
      notes: 'Pausas curtas, ênfase nas palavras "resposta definitiva" e "time parado".'
    },
    {
      title: 'Proposta Comercial / Negociação',
      scenario: 'Negociação',
      text: 'Oi, avaliamos o seu orçamento com a gerência. Se conseguirmos fechar com um desconto de dez por cento à vista, já autorizo a emissão da ordem de serviço hoje mesmo.',
      pace: 'moderado',
      intensity: 'normal',
      intonation: 'propositiva e cordial',
      tension: 'baixa',
      notes: 'Entonação amigável e confiante, com pausa reflexiva antes da contraproposta.'
    },
    {
      title: 'Alinhamento Pessoal com Cuidado',
      scenario: 'Relacionamento',
      text: 'Oi, sei que seu dia no trabalho deve ter sido puxado hoje, mas tenta não se atrasar para o nosso compromisso, por favor. É importante para mim.',
      pace: 'lento e suave',
      intensity: 'suave',
      intonation: 'afetuosa porém com expectativa',
      tension: 'moderada',
      notes: 'Tom calmo, velocidade comedida, buscando evitar confronto mas expressando prioridade.'
    }
  ];

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microfone não acessível, usando modo preset:', err);
      setErrorMessage('Não foi possível acessar o microfone diretamente. Você pode escolher um áudio de simulação realista abaixo!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const processRecordedAudio = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (audioBlob) {
        // Converte para base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: 'audio/webm',
              sender: 'other',
              senderName: senderName
            })
          });
          const data = await response.json();
          onAudioReady({
            id: 'audio-' + Date.now(),
            durationSeconds: recordingDuration || 15,
            transcription: data.transcription || 'Áudio gravado com sucesso.',
            speechPace: data.speechPace || 'moderado',
            intensity: data.intensity || 'normal',
            intonation: data.intonation || 'neutra',
            observedTension: data.observedTension || 'baixa',
            acousticNotes: data.acousticNotes || 'Gravação via microfone processada pelo Gemini AI.',
            ethicalDisclaimer: data.ethicalDisclaimer,
            audioBlobUrl: audioUrl || undefined
          });
          setIsProcessing(false);
          onClose();
        };
      } else if (selectedPreset !== null) {
        const preset = presets[selectedPreset];
        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulatedText: preset.text,
            sender: 'other',
            senderName: senderName
          })
        });
        const data = await response.json();
        onAudioReady({
          id: 'audio-' + Date.now(),
          durationSeconds: 22,
          transcription: data.transcription || preset.text,
          speechPace: data.speechPace || preset.pace,
          intensity: data.intensity || preset.intensity,
          intonation: data.intonation || preset.intonation,
          observedTension: data.observedTension || preset.tension,
          acousticNotes: data.acousticNotes || preset.notes,
          ethicalDisclaimer: data.ethicalDisclaimer
        });
        setIsProcessing(false);
        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao processar áudio:', err);
      setErrorMessage('Erro ao analisar áudio com IA. Tente novamente.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs">
                Mensagem de Voz
              </h3>
              <p className="text-[11px] text-slate-500">
                Grave pelo microfone ou selecione uma mensagem de teste
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Opção 1: Gravação Real */}
          <div className="rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/40">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-700">
                Gravar com Microfone
              </span>
              {isRecording && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  Gravando ({recordingDuration}s)
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 py-1">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Iniciar Gravação
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-medium text-white shadow-2xs hover:bg-rose-700 active:scale-95 transition-all"
                >
                  <Square className="h-3.5 w-3.5" />
                  Finalizar Gravação
                </button>
              )}

              {audioUrl && !isRecording && (
                <div className="flex items-center gap-2">
                  <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                </div>
              )}
            </div>
          </div>

          {/* Divisor */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase font-medium">
              ou escolha um cenário
            </span>
          </div>

          {/* Opção 2: Presets de Áudios Realistas */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 block">
              Opção 2: Simular Áudio de Voz Realista
            </span>

            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset, idx) => {
                const isSelected = selectedPreset === idx && !audioBlob;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(idx);
                      setAudioBlob(null);
                      setAudioUrl(null);
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium text-slate-900 mb-0.5">
                      <span>{preset.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {preset.scenario}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] line-clamp-2">
                      "{preset.text}"
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <p className="text-[11px] text-slate-400">
            Transcrição e estimativa de tom
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={(!audioBlob && selectedPreset === null) || isProcessing}
              onClick={processRecordedAudio}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Processar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
