export type ScenarioType =
  | 'profissional'
  | 'negociacao'
  | 'conflito'
  | 'informal'
  | 'pessoal';

export interface AudioMetadata {
  id: string;
  durationSeconds: number;
  transcription?: string;
  speechPace?: string;
  intensity?: string;
  intonation?: string;
  observedTension?: string;
  acousticNotes?: string;
  ethicalDisclaimer?: string;
  audioBlobUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  senderName: string;
  text: string;
  timestamp: string;
  type: 'text' | 'audio';
  audio?: AudioMetadata;
  status?: 'sent' | 'delivered' | 'read';
}

export interface ContactConversation {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  scenario: ScenarioType;
  roleDescription: string;
  unreadCount: number;
  authorizedForAnalysis: boolean;
  messages: ChatMessage[];
}

export interface ConversationAnalysis {
  mainSubject: string;
  context: string;
  requestsOrQuestions: string[];
  tensionsOrDemands: string[];
  keyPoints: string[];
  howToAct: string[];
  suggestedResponse: string;
  detectedTone: string;
  urgency: 'baixa' | 'media' | 'alta';
  toneJustification: string;
}

export type ToneType =
  | 'mais_educada'
  | 'mais_firme'
  | 'mais_profissional'
  | 'mais_direta'
  | 'mais_curta'
  | 'mais_convincente'
  | 'mais_conciliadora'
  | 'mais_natural'
  | 'personalizada';

export interface AIQuestionExchange {
  id: string;
  question: string;
  answer: string;
  suggestedActions: string[];
  timestamp: string;
}
