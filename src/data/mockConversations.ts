import { ContactConversation } from '../types';

export const INITIAL_CONVERSATIONS: ContactConversation[] = [
  {
    id: 'conv-conflito-1',
    name: 'Carlos Eduardo',
    phone: '+55 11 98765-4321',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    scenario: 'conflito',
    roleDescription: 'Cliente Corporativo - Reclamação Crítica de Entrega',
    unreadCount: 1,
    authorizedForAnalysis: true,
    messages: [
      {
        id: 'msg-1',
        sender: 'other',
        senderName: 'Carlos Eduardo',
        text: 'Bom dia. Vocês tinham me garantido na sexta-feira que o módulo financeiro estaria homologado até às 09h de hoje!',
        timestamp: '09:12',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-2',
        sender: 'user',
        senderName: 'Você',
        text: 'Bom dia, Carlos. Nossa equipe trabalhou no final de semana, mas tivemos uma instabilidade na API bancária na madrugada.',
        timestamp: '09:15',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-3',
        sender: 'other',
        senderName: 'Carlos Eduardo',
        text: 'Não quero desculpas técnicas agora. Minha diretoria está na minha sala exigindo o painel funcionando agora para a reunião de resultados. Se isso não subir até o meio-dia, vou ter que acionar a cláusula de rescisão do contrato.',
        timestamp: '09:20',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-4',
        sender: 'other',
        senderName: 'Carlos Eduardo',
        text: 'Mensagem de voz recebida (0:34)',
        timestamp: '09:22',
        type: 'audio',
        audio: {
          id: 'audio-carlos-1',
          durationSeconds: 34,
          transcription: 'Olha, eu preciso que você me atenda ou me dê uma previsão exata por escrito em no máximo 15 minutos. Estou segurando as pontas aqui, mas a paciência acabou.',
          speechPace: 'acelerado',
          intensity: 'enfática',
          intonation: 'irritada e pressionadora',
          observedTension: 'alta',
          acousticNotes: 'Pausas curtas, respiração forte no início, tom incisivo nas palavras "previsão exata" e "paciência acabou".',
          ethicalDisclaimer: 'Aviso ético: As características acústicas são estimativas complementares de apoio e não constituem comprovação de raiva ou intenção deliberada.'
        },
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-negociacao-2',
    name: 'Mariana Duarte',
    phone: '+55 21 99123-8877',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    scenario: 'negociacao',
    roleDescription: 'Diretora Comercial - Renovação de Contrato Anual',
    unreadCount: 0,
    authorizedForAnalysis: true,
    messages: [
      {
        id: 'msg-n1',
        sender: 'other',
        senderName: 'Mariana Duarte',
        text: 'Olá! Analisamos a proposta de renovação da licença corporativa enviada pela sua equipe.',
        timestamp: '14:05',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-n2',
        sender: 'other',
        senderName: 'Mariana Duarte',
        text: 'Gostamos muito do atendimento desse último ano, porém o reajuste de 18% ficou acima do teto orçamentário aprovado pelo conselho.',
        timestamp: '14:07',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-n3',
        sender: 'user',
        senderName: 'Você',
        text: 'Oi Mariana! Entendo a preocupação orçamentária. O valor reflete as 4 novas funcionalidades que incluímos sem custo adicional.',
        timestamp: '14:15',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-n4',
        sender: 'other',
        senderName: 'Mariana Duarte',
        text: 'Se vocês conseguirem manter o valor do ano passado com contrato de 24 meses ou darem 10% de desconto no plano anual à vista, fechamos a assinatura ainda hoje.',
        timestamp: '14:22',
        type: 'text',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-profissional-3',
    name: 'Diretor Roberto',
    phone: '+55 11 97654-3210',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    scenario: 'profissional',
    roleDescription: 'Gestor Direto - Alinhamento Estratégico',
    unreadCount: 0,
    authorizedForAnalysis: true,
    messages: [
      {
        id: 'msg-p1',
        sender: 'other',
        senderName: 'Diretor Roberto',
        text: 'Você tem disponibilidade para assumir a coordenação do novo projeto de inteligência artificial a partir de novembro?',
        timestamp: '11:00',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-p2',
        sender: 'user',
        senderName: 'Você',
        text: 'Com certeza Roberto, tenho muito interesse. Como ficaria a transição das demandas atuais com o time de suporte?',
        timestamp: '11:10',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-p3',
        sender: 'other',
        senderName: 'Diretor Roberto',
        text: 'A ideia é você delegar 70% do suporte para o Júnior e focar na nova arquitetura. Podemos nos reunir amanhã às 15h para estruturar as metas e a revisão salarial desse papel?',
        timestamp: '11:18',
        type: 'text',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-pessoal-4',
    name: 'Beatriz Lima',
    phone: '+55 11 96543-2109',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    scenario: 'pessoal',
    roleDescription: 'Relacionamento Pessoal / Familiar',
    unreadCount: 0,
    authorizedForAnalysis: true,
    messages: [
      {
        id: 'msg-r1',
        sender: 'other',
        senderName: 'Beatriz Lima',
        text: 'Oi amor, você vai conseguir sair no horário hoje ou vai ter que estender de novo no escritório?',
        timestamp: '17:30',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-r2',
        sender: 'user',
        senderName: 'Você',
        text: 'Oi Bia! Estou com uma entrega urgente de um cliente, mas estou fazendo de tudo para finalizar até 19h.',
        timestamp: '17:35',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-r3',
        sender: 'other',
        senderName: 'Beatriz Lima',
        text: 'Tudo bem, só não esquece que hoje é o jantar de aniversário da minha mãe e ela está contando com a sua presença às 20h. Não quero passar vergonha chegando sozinha de novo.',
        timestamp: '17:42',
        type: 'text',
        status: 'read'
      }
    ]
  },
  {
    id: 'conv-informal-5',
    name: 'Lucas Martins',
    phone: '+55 11 95432-1098',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    scenario: 'informal',
    roleDescription: 'Amigo / Grupo de Futebol e Churrasco',
    unreadCount: 0,
    authorizedForAnalysis: true,
    messages: [
      {
        id: 'msg-i1',
        sender: 'other',
        senderName: 'Lucas Martins',
        text: 'Fala parceiro! E aí, o churrasco no sítio sábado tá de pé mesmo?',
        timestamp: '16:10',
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg-i2',
        sender: 'other',
        senderName: 'Lucas Martins',
        text: 'O pessoal quer saber se você vai levar a caixa de som e a picanha ou se divide tudo no Pix.',
        timestamp: '16:12',
        type: 'text',
        status: 'read'
      }
    ]
  }
];
