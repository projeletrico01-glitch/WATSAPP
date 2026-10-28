import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Sparkles, FileAudio } from 'lucide-react';
import { AudioMetadata } from '../types';

interface AudioPlayerWaveformProps {
  audio: AudioMetadata;
  sender: 'user' | 'other';
  onAnalyzeAudio?: (audio: AudioMetadata) => void;
}

export const AudioPlayerWaveform: React.FC<AudioPlayerWaveformProps> = ({
  audio,
  sender,
  onAnalyzeAudio
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [progress, setProgress] = useState(0);

  // Simula reprodução
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + (100 / (audio.durationSeconds * 10)) * playbackSpeed;
        });
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, audio.durationSeconds, playbackSpeed]);

  const toggleSpeed = () => {
    if (playbackSpeed === 1) setPlaybackSpeed(1.5);
    else if (playbackSpeed === 1.5) setPlaybackSpeed(2);
    else setPlaybackSpeed(1);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = Math.floor(sec % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Alturas estáticas para simular a forma de onda do WhatsApp
  const barHeights = [
    30, 60, 45, 80, 100, 70, 40, 65, 90, 75,
    50, 85, 95, 60, 40, 70, 80, 55, 90, 65,
    40, 75, 85, 60, 35, 80, 95, 70, 50, 40
  ];

  return (
    <div className="w-full max-w-sm rounded-lg py-1">
      <div className="flex items-center gap-3">
        {/* Botão Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${
            sender === 'user'
              ? 'bg-[#00a884] text-white hover:bg-[#009272]'
              : 'bg-slate-700 text-white hover:bg-slate-800'
          }`}
          title={isPlaying ? 'Pausar áudio' : 'Ouvir áudio'}
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>

        {/* Onda Sonora e Duração */}
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-0.5 h-6 py-0.5">
            {barHeights.map((h, i) => {
              const barProgress = (i / barHeights.length) * 100;
              const isFilled = progress >= barProgress;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-colors"
                  style={{
                    height: `${Math.max(15, h * 0.75)}%`,
                    backgroundColor: isFilled
                      ? (sender === 'user' ? '#00a884' : '#64748b')
                      : '#cbd5e1'
                  }}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-0.5">
            <span>
              {isPlaying
                ? formatSeconds((progress / 100) * audio.durationSeconds)
                : formatSeconds(audio.durationSeconds)}
            </span>
            <button
              onClick={toggleSpeed}
              className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-200/80 rounded px-1 py-0.2"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>

      {/* Transcrição breve e botão de análise com IA */}
      {audio.transcription ? (
        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div className="flex items-start gap-1.5 text-slate-700">
            <FileAudio className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
            <p className="italic text-slate-600 text-[11px] leading-relaxed">
              "{audio.transcription}"
            </p>
          </div>
          {audio.observedTension && (
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Ritmo: {audio.speechPace} · Tensão: {audio.observedTension}</span>
              {onAnalyzeAudio && (
                <button
                  onClick={() => onAnalyzeAudio(audio)}
                  className="text-emerald-700 font-medium hover:underline inline-flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Ver análise acústica
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-end">
          {onAnalyzeAudio && (
            <button
              onClick={() => onAnalyzeAudio(audio)}
              className="text-[11px] text-emerald-700 font-medium hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Transcrever com IA
            </button>
          )}
        </div>
      )}
    </div>
  );
};
