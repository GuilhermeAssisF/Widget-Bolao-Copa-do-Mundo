/* ========================================================================== 
   CONFIGURAÇÕES DA WIDGET DE RANKING - BOLÃO COPA 2026
   V1: ranking por planilha + resultados mock/planilha.
   V2: resultados via cache Fluig alimentado pela API-Football/API-Sports.
   ========================================================================== */

window.RANKING_BOLAO_COPA_2026_CONFIG = {
    pontuacao: {
        placarExato: 3,
        resultado: 1
    },

    statusFinalizados: [
        'FT',
        'AET',
        'PEN',
        'FINALIZADO',
        'FINALIZADA',
        'ENCERRADO',
        'ENCERRADA',
        'FIM',
        'TERMINADO',
        'TERMINADA'
    ],

    statusAoVivo: [
        '1H',
        'HT',
        '2H',
        'ET',
        'P',
        'BT',
        'LIVE',
        'AO VIVO',
        'INTERVALO',
        'PRORROGAÇÃO',
        'PÊNALTIS'
    ],

    statusNaoJogados: [
        'NS',
        'TBD',
        'NÃO JOGADO',
        'NAO JOGADO',
        'AGENDADO',
        'AGENDADA',
        'A DEFINIR'
    ],

    apiFootball: {
        baseUrl: 'https://v3.football.api-sports.io',
        league: 1,
        season: 2026,
        observacao: 'Não colocar a API key no JavaScript da widget. Use Dataset/serviço/cache no Fluig.'
    }
};

/*
 * Mock temporário para validar layout, pontuação, jogo ao vivo e detalhe do participante.
 * Depois será substituído por um JSON/cache no Fluig alimentado pela API-Football.
 */
window.RANKING_BOLAO_RESULTADOS_MOCK = {
    M001: {
        matchId: 'M001',
        status: 'FT',
        statusLabel: 'Finalizado',
        finalizado: true,
        aoVivo: false,
        timeA: 'Mexico',
        timeB: 'South Africa',
        placarA: 2,
        placarB: 0,
        elapsed: 90,
        ultimaAtualizacao: '2026-06-11T21:10:00Z'
    },
    M002: {
        matchId: 'M002',
        status: '1H',
        statusLabel: '1º tempo',
        finalizado: false,
        aoVivo: true,
        timeA: 'South Korea',
        timeB: 'European Playoff D',
        placarA: 1,
        placarB: 0,
        elapsed: 34,
        ultimaAtualizacao: '2026-06-11T21:34:00Z'
    },
    M003: {
        matchId: 'M003',
        status: 'FT',
        statusLabel: 'Finalizado',
        finalizado: true,
        aoVivo: false,
        timeA: 'Canada',
        timeB: 'European Playoff A',
        placarA: 1,
        placarB: 1,
        elapsed: 90,
        ultimaAtualizacao: '2026-06-12T00:10:00Z'
    },
    M004: {
        matchId: 'M004',
        status: 'FT',
        statusLabel: 'Finalizado',
        finalizado: true,
        aoVivo: false,
        timeA: 'United States',
        timeB: 'Paraguay',
        placarA: 2,
        placarB: 1,
        elapsed: 90,
        ultimaAtualizacao: '2026-06-12T03:10:00Z'
    },
    M005: {
        matchId: 'M005',
        status: 'NS',
        statusLabel: 'Não jogado',
        finalizado: false,
        aoVivo: false,
        timeA: 'Australia',
        timeB: 'European Playoff C',
        placarA: null,
        placarB: null,
        elapsed: null,
        ultimaAtualizacao: '2026-06-12T03:10:00Z'
    },
    M006: {
        matchId: 'M006',
        status: 'FT',
        statusLabel: 'Finalizado',
        finalizado: true,
        aoVivo: false,
        timeA: 'Qatar',
        timeB: 'Switzerland',
        placarA: 0,
        placarB: 3,
        elapsed: 90,
        ultimaAtualizacao: '2026-06-12T06:10:00Z'
    }
};

window.RANKING_BOLAO_DEMO_PALPITES = [
    { participante: 'Sávio Rosynni', matchId: 'M001', timeA: 'Mexico', timeB: 'South Africa', palpiteA: 2, palpiteB: 0 },
    { participante: 'Sávio Rosynni', matchId: 'M002', timeA: 'South Korea', timeB: 'European Playoff D', palpiteA: 2, palpiteB: 0 },
    { participante: 'Sávio Rosynni', matchId: 'M003', timeA: 'Canada', timeB: 'European Playoff A', palpiteA: 2, palpiteB: 0 },
    { participante: 'Sávio Rosynni', matchId: 'M004', timeA: 'United States', timeB: 'Paraguay', palpiteA: 2, palpiteB: 1 },
    { participante: 'Sávio Rosynni', matchId: 'M005', timeA: 'Australia', timeB: 'European Playoff C', palpiteA: 1, palpiteB: 0 },
    { participante: 'Sávio Rosynni', matchId: 'M006', timeA: 'Qatar', timeB: 'Switzerland', palpiteA: 1, palpiteB: 3 },

    { participante: 'Maria Souza', matchId: 'M001', timeA: 'Mexico', timeB: 'South Africa', palpiteA: 1, palpiteB: 0 },
    { participante: 'Maria Souza', matchId: 'M002', timeA: 'South Korea', timeB: 'European Playoff D', palpiteA: 1, palpiteB: 0 },
    { participante: 'Maria Souza', matchId: 'M003', timeA: 'Canada', timeB: 'European Playoff A', palpiteA: 1, palpiteB: 1 },
    { participante: 'Maria Souza', matchId: 'M004', timeA: 'United States', timeB: 'Paraguay', palpiteA: 1, palpiteB: 1 },
    { participante: 'Maria Souza', matchId: 'M005', timeA: 'Australia', timeB: 'European Playoff C', palpiteA: 0, palpiteB: 0 },
    { participante: 'Maria Souza', matchId: 'M006', timeA: 'Qatar', timeB: 'Switzerland', palpiteA: 0, palpiteB: 2 },

    { participante: 'Carlos Lima', matchId: 'M001', timeA: 'Mexico', timeB: 'South Africa', palpiteA: 0, palpiteB: 0 },
    { participante: 'Carlos Lima', matchId: 'M002', timeA: 'South Korea', timeB: 'European Playoff D', palpiteA: 0, palpiteB: 1 },
    { participante: 'Carlos Lima', matchId: 'M003', timeA: 'Canada', timeB: 'European Playoff A', palpiteA: 2, palpiteB: 2 },
    { participante: 'Carlos Lima', matchId: 'M004', timeA: 'United States', timeB: 'Paraguay', palpiteA: 3, palpiteB: 1 },
    { participante: 'Carlos Lima', matchId: 'M005', timeA: 'Australia', timeB: 'European Playoff C', palpiteA: 2, palpiteB: 1 },
    { participante: 'Carlos Lima', matchId: 'M006', timeA: 'Qatar', timeB: 'Switzerland', palpiteA: 0, palpiteB: 3 }
];
