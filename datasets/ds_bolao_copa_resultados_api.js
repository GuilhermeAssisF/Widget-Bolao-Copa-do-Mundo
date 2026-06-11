/**
 * Dataset Fluig: ds_bolao_copa_resultados_api
 *
 * Versão: WorldCup26.ir v2 - mapeamento corrigido
 *
 * Objetivo:
 * - Consultar a API gratuita worldcup26.ir no servidor do Fluig.
 * - Ler os 104 jogos pelo endpoint /get/games.
 * - Converter o retorno para o mesmo formato que a widget Ranking Bolão Copa já entende.
 * - Mapear MatchID pelo mapa oficial gerado da aba JOGOS: M001 -> id 1, M005 -> id 6, etc.
 *
 * Configuração:
 * 1) Crie/atualize o dataset customizado com o nome exato: ds_bolao_copa_resultados_api
 * 2) Cole este arquivo no dataset.
 * 3) Não precisa de chave de API. Se seu ambiente exigir token, preencha WORLDCUP26_TOKEN.
 */

var WORLDCUP26_BASE_URL = 'https://worldcup26.ir';
var WORLDCUP26_GAMES_PATH = '/get/games';
var WORLDCUP26_TOKEN = ''; // opcional: se a API exigir, informe apenas o token, sem "Bearer"
var TIMEZONE_BR = 'America/Sao_Paulo';

/**
 * Mapa oficial entre o MatchID usado na planilha/widget e o id retornado pela worldcup26.ir.
 * Importante: os ids da API NÃO seguem sempre a mesma ordem M001..M104 na fase de grupos.
 * Ex.: M005 é Austrália x Turquia, mas na API esse jogo está com id 6.
 */
var MATCH_WORLDCUP26_ID_MAP = {
  'M001': 1,
  'M002': 2,
  'M003': 3,
  'M004': 4,
  'M005': 6,
  'M006': 8,
  'M007': 7,
  'M008': 5,
  'M009': 10,
  'M010': 11,
  'M011': 9,
  'M012': 12,
  'M013': 14,
  'M014': 15,
  'M015': 16,
  'M016': 13,
  'M017': 17,
  'M018': 18,
  'M019': 19,
  'M020': 20,
  'M021': 21,
  'M022': 22,
  'M023': 24,
  'M024': 23,
  'M025': 28,
  'M026': 26,
  'M027': 27,
  'M028': 25,
  'M029': 32,
  'M030': 31,
  'M031': 30,
  'M032': 29,
  'M033': 35,
  'M034': 33,
  'M035': 34,
  'M036': 36,
  'M037': 39,
  'M038': 37,
  'M039': 40,
  'M040': 38,
  'M041': 41,
  'M042': 43,
  'M043': 42,
  'M044': 44,
  'M045': 45,
  'M046': 48,
  'M047': 46,
  'M048': 47,
  'M049': 54,
  'M050': 53,
  'M051': 49,
  'M052': 50,
  'M053': 52,
  'M054': 51,
  'M055': 56,
  'M056': 55,
  'M057': 59,
  'M058': 60,
  'M059': 58,
  'M060': 57,
  'M061': 62,
  'M062': 61,
  'M063': 65,
  'M064': 66,
  'M065': 63,
  'M066': 64,
  'M067': 67,
  'M068': 68,
  'M069': 71,
  'M070': 72,
  'M071': 69,
  'M072': 70,
  'M073': 73,
  'M074': 74,
  'M075': 75,
  'M076': 76,
  'M077': 77,
  'M078': 78,
  'M079': 79,
  'M080': 80,
  'M081': 81,
  'M082': 82,
  'M083': 83,
  'M084': 84,
  'M085': 85,
  'M086': 86,
  'M087': 87,
  'M088': 88,
  'M089': 89,
  'M090': 90,
  'M091': 91,
  'M092': 92,
  'M093': 93,
  'M094': 94,
  'M095': 95,
  'M096': 96,
  'M097': 97,
  'M098': 98,
  'M099': 99,
  'M100': 100,
  'M101': 101,
  'M102': 102,
  'M103': 103,
  'M104': 104
};


var JOGOS_REFERENCIA = [
  {
    "matchId": "M001",
    "dataBR": "2026-06-11",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "A",
    "timeA": "Mexico 🇲🇽",
    "timeB": "África do Sul 🇿🇦",
    "local": "Mexico 🇲🇽 City"
  },
  {
    "matchId": "M002",
    "dataBR": "2026-06-11",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "A",
    "timeA": "Coreia do Sul 🇰🇷",
    "timeB": "Rep. Tchéquia 🇨🇿",
    "local": "Guadalajara"
  },
  {
    "matchId": "M003",
    "dataBR": "2026-06-12",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "B",
    "timeA": "Canadá 🇨🇦",
    "timeB": "Bósnia e Herzegovina 🇧🇦",
    "local": "Toronto"
  },
  {
    "matchId": "M004",
    "dataBR": "2026-06-12",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "D",
    "timeA": "Estados Unidos 🇺🇸",
    "timeB": "Paraguai 🇵🇾",
    "local": "Los Angeles"
  },
  {
    "matchId": "M005",
    "dataBR": "2026-06-13",
    "horaBR": "01:00",
    "fase": "Grupos",
    "grupo": "D",
    "timeA": "Austrália 🇦🇺",
    "timeB": "Turquia 🇹🇷",
    "local": "Vancouver"
  },
  {
    "matchId": "M006",
    "dataBR": "2026-06-13",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "B",
    "timeA": "Catar 🇶🇦",
    "timeB": "Suíça 🇨🇭",
    "local": "San Francisco"
  },
  {
    "matchId": "M007",
    "dataBR": "2026-06-13",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "C",
    "timeA": "Brasil 🇧🇷",
    "timeB": "Marrocos 🇲🇦",
    "local": "New York, New Jersey"
  },
  {
    "matchId": "M008",
    "dataBR": "2026-06-13",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "C",
    "timeA": "Haiti 🇭🇹",
    "timeB": "Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "local": "Boston"
  },
  {
    "matchId": "M009",
    "dataBR": "2026-06-14",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "E",
    "timeA": "Alemanha 🇩🇪",
    "timeB": "Curaçao 🇨🇼",
    "local": "Houston"
  },
  {
    "matchId": "M010",
    "dataBR": "2026-06-14",
    "horaBR": "17:00",
    "fase": "Grupos",
    "grupo": "F",
    "timeA": "Holanda 🇳🇱",
    "timeB": "Japão 🇯🇵",
    "local": "Dallas"
  },
  {
    "matchId": "M011",
    "dataBR": "2026-06-14",
    "horaBR": "20:00",
    "fase": "Grupos",
    "grupo": "E",
    "timeA": "Costa do Marfim 🇨🇮",
    "timeB": "Equador 🇪🇨",
    "local": "Philadelphia"
  },
  {
    "matchId": "M012",
    "dataBR": "2026-06-14",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "F",
    "timeA": "Suécia 🇸🇪",
    "timeB": "Tunísia 🇹🇳",
    "local": "Monterrey"
  },
  {
    "matchId": "M013",
    "dataBR": "2026-06-15",
    "horaBR": "13:00",
    "fase": "Grupos",
    "grupo": "H",
    "timeA": "Espanha 🇪🇸",
    "timeB": "Cabo Verde 🇨🇻",
    "local": "Atlanta"
  },
  {
    "matchId": "M014",
    "dataBR": "2026-06-15",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "G",
    "timeA": "Bélgica 🇧🇪",
    "timeB": "Egito 🇪🇬",
    "local": "Seattle"
  },
  {
    "matchId": "M015",
    "dataBR": "2026-06-15",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "H",
    "timeA": "Arábia Saudita 🇸🇦",
    "timeB": "Uruguai 🇺🇾",
    "local": "Miami"
  },
  {
    "matchId": "M016",
    "dataBR": "2026-06-15",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "G",
    "timeA": "Iran🇮🇷",
    "timeB": "Nova Zelândia 🇳🇿",
    "local": "Los Angeles"
  },
  {
    "matchId": "M017",
    "dataBR": "2026-06-16",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "I",
    "timeA": "França 🇫🇷",
    "timeB": "Senegal 🇸🇳",
    "local": "New York, New Jersey"
  },
  {
    "matchId": "M018",
    "dataBR": "2026-06-16",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "I",
    "timeA": "Iraque 🇮🇶",
    "timeB": "Noruega 🇳🇴",
    "local": "Boston"
  },
  {
    "matchId": "M019",
    "dataBR": "2026-06-16",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "J",
    "timeA": "Argentina 🇦🇷",
    "timeB": "Argélia 🇩🇿",
    "local": "Kansas City"
  },
  {
    "matchId": "M020",
    "dataBR": "2026-06-17",
    "horaBR": "01:00",
    "fase": "Grupos",
    "grupo": "J",
    "timeA": "Áustria 🇦🇹",
    "timeB": "Jordânia 🇯🇴",
    "local": "San Francisco"
  },
  {
    "matchId": "M021",
    "dataBR": "2026-06-17",
    "horaBR": "14:00",
    "fase": "Grupos",
    "grupo": "K",
    "timeA": "Portugal 🇵🇹",
    "timeB": "RD Congo 🇨🇩",
    "local": "Houston"
  },
  {
    "matchId": "M022",
    "dataBR": "2026-06-17",
    "horaBR": "17:00",
    "fase": "Grupos",
    "grupo": "L",
    "timeA": "Inglaterra🇬🇧",
    "timeB": "Croácia 🇭🇷",
    "local": "Dallas"
  },
  {
    "matchId": "M023",
    "dataBR": "2026-06-17",
    "horaBR": "20:00",
    "fase": "Grupos",
    "grupo": "L",
    "timeA": "Gana 🇬🇭",
    "timeB": "Panamá 🇵🇦",
    "local": "Toronto"
  },
  {
    "matchId": "M024",
    "dataBR": "2026-06-17",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "K",
    "timeA": "Uzbequistão 🇺🇿",
    "timeB": "Colômbia 🇨🇴",
    "local": "Mexico 🇲🇽 City"
  },
  {
    "matchId": "M025",
    "dataBR": "2026-06-18",
    "horaBR": "13:00",
    "fase": "Grupos",
    "grupo": "A",
    "timeA": "Rep. Tchéquia 🇨🇿",
    "timeB": "África do Sul 🇿🇦",
    "local": "Atlanta"
  },
  {
    "matchId": "M026",
    "dataBR": "2026-06-18",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "B",
    "timeA": "Suíça 🇨🇭",
    "timeB": "Bósnia e Herzegovina 🇧🇦",
    "local": "Los Angeles"
  },
  {
    "matchId": "M027",
    "dataBR": "2026-06-18",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "B",
    "timeA": "Canadá 🇨🇦",
    "timeB": "Catar 🇶🇦",
    "local": "Vancouver"
  },
  {
    "matchId": "M028",
    "dataBR": "2026-06-18",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "A",
    "timeA": "Mexico 🇲🇽",
    "timeB": "Coreia do Sul 🇰🇷",
    "local": "Guadalajara"
  },
  {
    "matchId": "M029",
    "dataBR": "2026-06-19",
    "horaBR": "01:00",
    "fase": "Grupos",
    "grupo": "D",
    "timeA": "Turquia 🇹🇷",
    "timeB": "Paraguai 🇵🇾",
    "local": "San Francisco"
  },
  {
    "matchId": "M030",
    "dataBR": "2026-06-19",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "D",
    "timeA": "Estados Unidos 🇺🇸",
    "timeB": "Austrália 🇦🇺",
    "local": "Seattle"
  },
  {
    "matchId": "M031",
    "dataBR": "2026-06-19",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "C",
    "timeA": "Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "timeB": "Marrocos 🇲🇦",
    "local": "Boston"
  },
  {
    "matchId": "M032",
    "dataBR": "2026-06-19",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "C",
    "timeA": "Brasil 🇧🇷",
    "timeB": "Haiti 🇭🇹",
    "local": "Philadelphia"
  },
  {
    "matchId": "M033",
    "dataBR": "2026-06-20",
    "horaBR": "14:00",
    "fase": "Grupos",
    "grupo": "F",
    "timeA": "Holanda 🇳🇱",
    "timeB": "Suécia 🇸🇪",
    "local": "Houston"
  },
  {
    "matchId": "M034",
    "dataBR": "2026-06-20",
    "horaBR": "17:00",
    "fase": "Grupos",
    "grupo": "E",
    "timeA": "Alemanha 🇩🇪",
    "timeB": "Costa do Marfim 🇨🇮",
    "local": "Toronto"
  },
  {
    "matchId": "M035",
    "dataBR": "2026-06-20",
    "horaBR": "21:00",
    "fase": "Grupos",
    "grupo": "E",
    "timeA": "Equador 🇪🇨",
    "timeB": "Curaçao 🇨🇼",
    "local": "Kansas City"
  },
  {
    "matchId": "M036",
    "dataBR": "2026-06-21",
    "horaBR": "01:00",
    "fase": "Grupos",
    "grupo": "F",
    "timeA": "Tunísia 🇹🇳",
    "timeB": "Japão 🇯🇵",
    "local": "Monterrey"
  },
  {
    "matchId": "M037",
    "dataBR": "2026-06-21",
    "horaBR": "13:00",
    "fase": "Grupos",
    "grupo": "H",
    "timeA": "Espanha 🇪🇸",
    "timeB": "Arábia Saudita 🇸🇦",
    "local": "Atlanta"
  },
  {
    "matchId": "M038",
    "dataBR": "2026-06-21",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "G",
    "timeA": "Bélgica 🇧🇪",
    "timeB": "Iran🇮🇷",
    "local": "Los Angeles"
  },
  {
    "matchId": "M039",
    "dataBR": "2026-06-21",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "H",
    "timeA": "Uruguai 🇺🇾",
    "timeB": "Cabo Verde 🇨🇻",
    "local": "Miami"
  },
  {
    "matchId": "M040",
    "dataBR": "2026-06-21",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "G",
    "timeA": "Nova Zelândia 🇳🇿",
    "timeB": "Egito 🇪🇬",
    "local": "Vancouver"
  },
  {
    "matchId": "M041",
    "dataBR": "2026-06-21",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "I",
    "timeA": "França 🇫🇷",
    "timeB": "Iraque 🇮🇶",
    "local": "Philadelphia"
  },
  {
    "matchId": "M042",
    "dataBR": "2026-06-22",
    "horaBR": "14:00",
    "fase": "Grupos",
    "grupo": "J",
    "timeA": "Argentina 🇦🇷",
    "timeB": "Áustria 🇦🇹",
    "local": "Dalllas"
  },
  {
    "matchId": "M043",
    "dataBR": "2026-06-22",
    "horaBR": "21:00",
    "fase": "Grupos",
    "grupo": "I",
    "timeA": "Noruega 🇳🇴",
    "timeB": "Senegal 🇸🇳",
    "local": "New York, New Jersey"
  },
  {
    "matchId": "M044",
    "dataBR": "2026-06-23",
    "horaBR": "00:00",
    "fase": "Grupos",
    "grupo": "J",
    "timeA": "Jordânia 🇯🇴",
    "timeB": "Argélia 🇩🇿",
    "local": "San Francisco"
  },
  {
    "matchId": "M045",
    "dataBR": "2026-06-23",
    "horaBR": "14:00",
    "fase": "Grupos",
    "grupo": "K",
    "timeA": "Portugal 🇵🇹",
    "timeB": "Uzbequistão 🇺🇿",
    "local": "Houston"
  },
  {
    "matchId": "M046",
    "dataBR": "2026-06-23",
    "horaBR": "17:00",
    "fase": "Grupos",
    "grupo": "L",
    "timeA": "Inglaterra🇬🇧",
    "timeB": "Gana 🇬🇭",
    "local": "Boston"
  },
  {
    "matchId": "M047",
    "dataBR": "2026-06-23",
    "horaBR": "20:00",
    "fase": "Grupos",
    "grupo": "L",
    "timeA": "Panamá 🇵🇦",
    "timeB": "Croácia 🇭🇷",
    "local": "Toronto"
  },
  {
    "matchId": "M048",
    "dataBR": "2026-06-23",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "K",
    "timeA": "Colômbia 🇨🇴",
    "timeB": "RD Congo 🇨🇩",
    "local": "Guadalajara"
  },
  {
    "matchId": "M049",
    "dataBR": "2026-06-24",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "B",
    "timeA": "Suíça 🇨🇭",
    "timeB": "Canadá 🇨🇦",
    "local": "Vancouver"
  },
  {
    "matchId": "M050",
    "dataBR": "2026-06-24",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "B",
    "timeA": "Bósnia e Herzegovina 🇧🇦",
    "timeB": "Catar 🇶🇦",
    "local": "Seattle"
  },
  {
    "matchId": "M051",
    "dataBR": "2026-06-24",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "C",
    "timeA": "Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "timeB": "Brasil 🇧🇷",
    "local": "Miami"
  },
  {
    "matchId": "M052",
    "dataBR": "2026-06-24",
    "horaBR": "19:00",
    "fase": "Grupos",
    "grupo": "C",
    "timeA": "Marrocos 🇲🇦",
    "timeB": "Haiti 🇭🇹",
    "local": "Atlanta"
  },
  {
    "matchId": "M053",
    "dataBR": "2026-06-24",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "A",
    "timeA": "Rep. Tchéquia 🇨🇿",
    "timeB": "Mexico 🇲🇽",
    "local": "Mexico 🇲🇽 City"
  },
  {
    "matchId": "M054",
    "dataBR": "2026-06-24",
    "horaBR": "22:00",
    "fase": "Grupos",
    "grupo": "A",
    "timeA": "África do Sul 🇿🇦",
    "timeB": "Coreia do Sul 🇰🇷",
    "local": "Monterrey"
  },
  {
    "matchId": "M055",
    "dataBR": "2026-06-25",
    "horaBR": "17:00",
    "fase": "Grupos",
    "grupo": "E",
    "timeA": "Equador 🇪🇨",
    "timeB": "Alemanha 🇩🇪",
    "local": "New York, New Jersey"
  },
  {
    "matchId": "M056",
    "dataBR": "2026-06-25",
    "horaBR": "17:00",
    "fase": "Grupos",
    "grupo": "E",
    "timeA": "Curaçao 🇨🇼",
    "timeB": "Costa do Marfim 🇨🇮",
    "local": "New York, New Jersey"
  },
  {
    "matchId": "M057",
    "dataBR": "2026-06-25",
    "horaBR": "20:00",
    "fase": "Grupos",
    "grupo": "F",
    "timeA": "Japão 🇯🇵",
    "timeB": "Suécia 🇸🇪",
    "local": "Dallas"
  },
  {
    "matchId": "M058",
    "dataBR": "2026-06-25",
    "horaBR": "20:00",
    "fase": "Grupos",
    "grupo": "F",
    "timeA": "Tunísia 🇹🇳",
    "timeB": "Holanda 🇳🇱",
    "local": "Kansas City"
  },
  {
    "matchId": "M059",
    "dataBR": "2026-06-25",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "D",
    "timeA": "Turquia 🇹🇷",
    "timeB": "Estados Unidos 🇺🇸",
    "local": "Los Angeles"
  },
  {
    "matchId": "M060",
    "dataBR": "2026-06-25",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "D",
    "timeA": "Paraguai 🇵🇾",
    "timeB": "Austrália 🇦🇺",
    "local": "San Francisco"
  },
  {
    "matchId": "M061",
    "dataBR": "2026-06-26",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "I",
    "timeA": "Noruega 🇳🇴",
    "timeB": "França 🇫🇷",
    "local": "Boston"
  },
  {
    "matchId": "M062",
    "dataBR": "2026-06-26",
    "horaBR": "16:00",
    "fase": "Grupos",
    "grupo": "I",
    "timeA": "Senegal 🇸🇳",
    "timeB": "Iraque 🇮🇶",
    "local": "Toronto"
  },
  {
    "matchId": "M063",
    "dataBR": "2026-06-26",
    "horaBR": "21:00",
    "fase": "Grupos",
    "grupo": "H",
    "timeA": "Cabo Verde 🇨🇻",
    "timeB": "Arábia Saudita 🇸🇦",
    "local": "Houston"
  },
  {
    "matchId": "M064",
    "dataBR": "2026-06-26",
    "horaBR": "21:00",
    "fase": "Grupos",
    "grupo": "H",
    "timeA": "Uruguai 🇺🇾",
    "timeB": "Espanha 🇪🇸",
    "local": "Guadalajara"
  },
  {
    "matchId": "M065",
    "dataBR": "2026-06-27",
    "horaBR": "00:00",
    "fase": "Grupos",
    "grupo": "G",
    "timeA": "Egito 🇪🇬",
    "timeB": "Iran🇮🇷",
    "local": "Seattle"
  },
  {
    "matchId": "M066",
    "dataBR": "2026-06-27",
    "horaBR": "00:00",
    "fase": "Grupos",
    "grupo": "G",
    "timeA": "Nova Zelândia 🇳🇿",
    "timeB": "Bélgica 🇧🇪",
    "local": "Vancouver"
  },
  {
    "matchId": "M067",
    "dataBR": "2026-06-27",
    "horaBR": "18:00",
    "fase": "Grupos",
    "grupo": "L",
    "timeA": "Panamá 🇵🇦",
    "timeB": "Inglaterra🇬🇧",
    "local": "New York, New Jersey"
  },
  {
    "matchId": "M068",
    "dataBR": "2026-06-27",
    "horaBR": "18:00",
    "fase": "Grupos",
    "grupo": "L",
    "timeA": "Croácia 🇭🇷",
    "timeB": "Gana 🇬🇭",
    "local": "Philadelphia"
  },
  {
    "matchId": "M069",
    "dataBR": "2026-06-27",
    "horaBR": "20:30",
    "fase": "Grupos",
    "grupo": "K",
    "timeA": "Colômbia 🇨🇴",
    "timeB": "Portugal 🇵🇹",
    "local": "Miami"
  },
  {
    "matchId": "M070",
    "dataBR": "2026-06-27",
    "horaBR": "20:30",
    "fase": "Grupos",
    "grupo": "K",
    "timeA": "RD Congo 🇨🇩",
    "timeB": "Uzbequistão 🇺🇿",
    "local": "Atlanta"
  },
  {
    "matchId": "M071",
    "dataBR": "2026-06-27",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "J",
    "timeA": "Argélia 🇩🇿",
    "timeB": "Áustria 🇦🇹",
    "local": "Kansas City"
  },
  {
    "matchId": "M072",
    "dataBR": "2026-06-27",
    "horaBR": "23:00",
    "fase": "Grupos",
    "grupo": "J",
    "timeA": "Jordânia 🇯🇴",
    "timeB": "Argentina 🇦🇷",
    "local": "Dallas"
  },
  {
    "matchId": "M073",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 1",
    "timeA": "2A",
    "timeB": "2B",
    "local": ""
  },
  {
    "matchId": "M074",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 2",
    "timeA": "1E",
    "timeB": "Best 3rd (ABCDF)",
    "local": ""
  },
  {
    "matchId": "M075",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 3",
    "timeA": "1F",
    "timeB": "2C",
    "local": ""
  },
  {
    "matchId": "M076",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 4",
    "timeA": "1C",
    "timeB": "2F",
    "local": ""
  },
  {
    "matchId": "M077",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 5",
    "timeA": "1I",
    "timeB": "Best 3rd (CDFGH)",
    "local": ""
  },
  {
    "matchId": "M078",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 6",
    "timeA": "2E",
    "timeB": "2I",
    "local": ""
  },
  {
    "matchId": "M079",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 7",
    "timeA": "1A",
    "timeB": "Best 3rd (CEFHI)",
    "local": ""
  },
  {
    "matchId": "M080",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 8",
    "timeA": "1L",
    "timeB": "Best 3rd (EHIJK)",
    "local": ""
  },
  {
    "matchId": "M081",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 9",
    "timeA": "1D",
    "timeB": "Best 3rd (BEFIJ)",
    "local": ""
  },
  {
    "matchId": "M082",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 10",
    "timeA": "1G",
    "timeB": "Best 3rd (AEHIJ)",
    "local": ""
  },
  {
    "matchId": "M083",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 11",
    "timeA": "2K",
    "timeB": "2L",
    "local": ""
  },
  {
    "matchId": "M084",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 12",
    "timeA": "1H",
    "timeB": "2J",
    "local": ""
  },
  {
    "matchId": "M085",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 13",
    "timeA": "1B",
    "timeB": "Best 3rd (EFGIJ)",
    "local": ""
  },
  {
    "matchId": "M086",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 14",
    "timeA": "1J",
    "timeB": "2H",
    "local": ""
  },
  {
    "matchId": "M087",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 15",
    "timeA": "1K",
    "timeB": "Best 3rd (DEIJL)",
    "local": ""
  },
  {
    "matchId": "M088",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 32",
    "grupo": "JOGO 16",
    "timeA": "2D",
    "timeB": "2G",
    "local": ""
  },
  {
    "matchId": "M089",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 2",
    "timeB": "VENCEDOR JOGO 5",
    "local": ""
  },
  {
    "matchId": "M090",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 1",
    "timeB": "VENCEDOR JOGO 3",
    "local": ""
  },
  {
    "matchId": "M091",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 4",
    "timeB": "VENCEDOR JOGO 6",
    "local": ""
  },
  {
    "matchId": "M092",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 7",
    "timeB": "VENCEDOR JOGO 8",
    "local": ""
  },
  {
    "matchId": "M093",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 11",
    "timeB": "VENCEDOR JOGO 12",
    "local": ""
  },
  {
    "matchId": "M094",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 9",
    "timeB": "VENCEDOR JOGO 10",
    "local": ""
  },
  {
    "matchId": "M095",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 14",
    "timeB": "VENCEDOR JOGO 16",
    "local": ""
  },
  {
    "matchId": "M096",
    "dataBR": "",
    "horaBR": "00:00",
    "fase": "Round of 16",
    "grupo": "",
    "timeA": "VENCEDOR JOGO 13",
    "timeB": "VENCEDOR JOGO 15",
    "local": ""
  },
  {
    "matchId": "M097",
    "dataBR": "2026-07-09",
    "horaBR": "17:00",
    "fase": "Quarter-final",
    "grupo": "QUARTAS 1",
    "timeA": "W89",
    "timeB": "W90",
    "local": ""
  },
  {
    "matchId": "M098",
    "dataBR": "2026-07-10",
    "horaBR": "16:00",
    "fase": "Quarter-final",
    "grupo": "QUARTAS 2",
    "timeA": "W93",
    "timeB": "W94",
    "local": ""
  },
  {
    "matchId": "M099",
    "dataBR": "2026-07-11",
    "horaBR": "18:00",
    "fase": "Quarter-final",
    "grupo": "QUARTAS 3",
    "timeA": "W91",
    "timeB": "W92",
    "local": ""
  },
  {
    "matchId": "M100",
    "dataBR": "2026-07-11",
    "horaBR": "22:00",
    "fase": "Quarter-final",
    "grupo": "QUARTAS 4",
    "timeA": "W95",
    "timeB": "W96",
    "local": ""
  },
  {
    "matchId": "M101",
    "dataBR": "2026-07-14",
    "horaBR": "16:00",
    "fase": "Semi-final",
    "grupo": "SEMI 1 ",
    "timeA": "VENCEDOR QUARTAS 1",
    "timeB": "VENCEDOR QUARTAS 2",
    "local": ""
  },
  {
    "matchId": "M102",
    "dataBR": "2026-07-15",
    "horaBR": "16:00",
    "fase": "Semi-final",
    "grupo": "SEMI 2",
    "timeA": "VENCEDOR QUARTAS 3",
    "timeB": "VENCEDOR QUARTAS 4",
    "local": ""
  },
  {
    "matchId": "M103",
    "dataBR": "2026-07-18",
    "horaBR": "18:00",
    "fase": "3rd place",
    "grupo": "",
    "timeA": "PERDEDOR SEMI 1",
    "timeB": "PERDEDOR SEMI 2",
    "local": ""
  },
  {
    "matchId": "M104",
    "dataBR": "2026-07-19",
    "horaBR": "16:00",
    "fase": "Final",
    "grupo": "",
    "timeA": "GANHADOR SEMI 1",
    "timeB": "GANHADOR SEMI 2",
    "local": ""
  }
];

/**
 * Dicionário para casar nomes da planilha em português com nomes da API em inglês.
 */
var TEAM_ALIASES = {
  "AFRICA DO SUL": [
    "SOUTH AFRICA"
  ],
  "ALEMANHA": [
    "GERMANY"
  ],
  "ARGENTINA": [
    "ARGENTINA"
  ],
  "ARGELIA": [
    "ALGERIA"
  ],
  "ARABIA SAUDITA": [
    "SAUDI ARABIA"
  ],
  "AUSTRALIA": [
    "AUSTRALIA"
  ],
  "AUSTRIA": [
    "AUSTRIA"
  ],
  "BELGICA": [
    "BELGIUM"
  ],
  "BOSNIA E HERZEGOVINA": [
    "BOSNIA AND HERZEGOVINA",
    "BOSNIA-HERZEGOVINA",
    "BOSNIA HERZEGOVINA",
    "BOSNIA"
  ],
  "BRASIL": [
    "BRAZIL"
  ],
  "CABO VERDE": [
    "CAPE VERDE"
  ],
  "CANADA": [
    "CANADA"
  ],
  "CATAR": [
    "QATAR"
  ],
  "COLOMBIA": [
    "COLOMBIA"
  ],
  "COREIA DO SUL": [
    "SOUTH KOREA",
    "KOREA REPUBLIC",
    "KOREA REP.",
    "KOREA"
  ],
  "COSTA DO MARFIM": [
    "IVORY COAST",
    "COTE D IVOIRE",
    "COTE D'IVOIRE",
    "CÔTE D'IVOIRE"
  ],
  "CROACIA": [
    "CROATIA"
  ],
  "CURACAO": [
    "CURACAO",
    "CURAÇAO"
  ],
  "EGITO": [
    "EGYPT"
  ],
  "EQUADOR": [
    "ECUADOR"
  ],
  "ESCOCIA": [
    "SCOTLAND"
  ],
  "ESPANHA": [
    "SPAIN"
  ],
  "ESTADOS UNIDOS": [
    "UNITED STATES",
    "USA",
    "UNITED STATES OF AMERICA"
  ],
  "FRANCA": [
    "FRANCE"
  ],
  "GANA": [
    "GHANA"
  ],
  "HAITI": [
    "HAITI"
  ],
  "HOLANDA": [
    "NETHERLANDS",
    "HOLLAND"
  ],
  "INGLATERRA": [
    "ENGLAND"
  ],
  "IRAN": [
    "IRAN"
  ],
  "IRAQUE": [
    "IRAQ"
  ],
  "JAPAO": [
    "JAPAN"
  ],
  "JORDANIA": [
    "JORDAN"
  ],
  "MARROCOS": [
    "MOROCCO"
  ],
  "MEXICO": [
    "MEXICO"
  ],
  "NORUEGA": [
    "NORWAY"
  ],
  "NOVA ZELANDIA": [
    "NEW ZEALAND"
  ],
  "PANAMA": [
    "PANAMA"
  ],
  "PARAGUAI": [
    "PARAGUAY"
  ],
  "PORTUGAL": [
    "PORTUGAL"
  ],
  "RD CONGO": [
    "DR CONGO",
    "CONGO DR",
    "DEMOCRATIC REPUBLIC OF THE CONGO",
    "CONGO"
  ],
  "REP TCHEQUIA": [
    "CZECH REPUBLIC",
    "CZECHIA",
    "CZECH REP.",
    "CZECH REP"
  ],
  "SENEGAL": [
    "SENEGAL"
  ],
  "SUECIA": [
    "SWEDEN"
  ],
  "SUICA": [
    "SWITZERLAND"
  ],
  "TUNISIA": [
    "TUNISIA"
  ],
  "TURQUIA": [
    "TURKEY"
  ],
  "URUGUAI": [
    "URUGUAY"
  ],
  "UZBEQUISTAO": [
    "UZBEKISTAN"
  ]
};

function createDataset(fields, constraints, sortFields) {
    var ds = DatasetBuilder.newDataset();
    ds.addColumn('status');
    ds.addColumn('json');
    ds.addColumn('ultimaAtualizacao');
    ds.addColumn('mensagem');

    var url = WORLDCUP26_BASE_URL + WORLDCUP26_GAMES_PATH;

    try {
        var chamada = httpGetWorldcup26(url);
        var resposta = chamada.json || {};
        var games = extrairGamesWorldcup26(resposta);

        games.sort(function (a, b) {
            var idA = numeroOuNull(a && a.id);
            var idB = numeroOuNull(b && b.id);
            if (idA === null) idA = 9999;
            if (idB === null) idB = 9999;
            return idA - idB;
        });

        var debugApi = montarDebugWorldcup26(url, chamada, games);
        var pacote = montarPacoteResultadosWorldcup26(games, resposta || {}, debugApi);
        var json = JSON.stringify(pacote);

        var statusLinha = 'OK';
        var mensagem = 'Resultados carregados da worldcup26.ir e convertidos por MatchID.';

        if (debugApi.httpStatus < 200 || debugApi.httpStatus >= 300) {
            statusLinha = 'ERRO_HTTP_API';
            mensagem = 'worldcup26.ir retornou HTTP ' + debugApi.httpStatus + '. Veja metadata.api no JSON.';
        } else if (debugApi.parseError) {
            statusLinha = 'ERRO_PARSE_API';
            mensagem = 'A worldcup26.ir respondeu, mas o retorno não pôde ser convertido em JSON. Veja metadata.api.rawPreview.';
        } else if (debugApi.erroConexao) {
            statusLinha = 'ERRO_CONEXAO_API';
            mensagem = 'Erro de conexão ao chamar worldcup26.ir. Veja metadata.api.erroConexao.';
        } else if (!games.length) {
            statusLinha = 'OK_SEM_JOGOS_API';
            mensagem = 'A worldcup26.ir respondeu, mas não encontrei a lista de jogos no retorno. Veja metadata.api.rawPreview.';
        } else if (pacote.metadata.totalMapeados === 0) {
            statusLinha = 'OK_SEM_MAPEAMENTO';
            mensagem = 'A API retornou jogos, mas nenhum tinha id compatível com M001..M104.';
        }

        ds.addRow([statusLinha, json, pacote.metadata.ultimaAtualizacao, mensagem]);
        return ds;
    } catch (e) {
        var erroTexto = String(e && e.message ? e.message : e);
        var pacoteErro = montarPacoteResultadosWorldcup26([], {
            erro: erroTexto
        }, montarDebugWorldcup26(url, {
            httpStatus: null,
            texto: '',
            json: null,
            parseError: '',
            erroConexao: erroTexto
        }, []));

        ds.addRow([
            'ERRO_CONEXAO_API',
            JSON.stringify(pacoteErro),
            agoraIso(),
            'Erro ao consultar a worldcup26.ir: ' + erroTexto
        ]);
        return ds;
    }
}

function httpGetWorldcup26(urlTexto) {
    var retorno = {
        httpStatus: null,
        texto: '',
        json: null,
        parseError: '',
        erroConexao: ''
    };

    try {
        var url = new java.net.URL(urlTexto);
        var conn = url.openConnection();
        conn.setRequestMethod('GET');
        conn.setRequestProperty('Accept', 'application/json');
        conn.setRequestProperty('User-Agent', 'Fluig Ranking Bolao Copa/1.0');

        if (WORLDCUP26_TOKEN && String(WORLDCUP26_TOKEN).trim()) {
            conn.setRequestProperty('Authorization', 'Bearer ' + String(WORLDCUP26_TOKEN).trim());
        }

        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);

        var status = conn.getResponseCode();
        retorno.httpStatus = status;

        var stream = status >= 200 && status < 300 ? conn.getInputStream() : conn.getErrorStream();
        var texto = lerStream(stream);
        retorno.texto = String(texto || '');

        if (retorno.texto) {
            try {
                retorno.json = JSON.parse(retorno.texto);
            } catch (parseError) {
                retorno.parseError = String(parseError && parseError.message ? parseError.message : parseError);
            }
        }
    } catch (e) {
        retorno.erroConexao = String(e && e.message ? e.message : e);
    }

    return retorno;
}

function extrairGamesWorldcup26(resposta) {
    if (!resposta) return [];

    if (isArray(resposta)) return resposta;
    if (isArray(resposta.games)) return resposta.games;
    if (resposta.data && isArray(resposta.data.games)) return resposta.data.games;
    if (resposta.data && isArray(resposta.data)) return resposta.data;
    if (resposta.response && isArray(resposta.response.games)) return resposta.response.games;
    if (resposta.response && isArray(resposta.response)) return resposta.response;
    if (resposta.result && isArray(resposta.result.games)) return resposta.result.games;
    if (resposta.result && isArray(resposta.result)) return resposta.result;

    return [];
}

function montarDebugWorldcup26(url, chamada, games) {
    chamada = chamada || {};
    var json = chamada.json || {};
    games = games || [];

    return {
        provedor: 'worldcup26.ir',
        url: url || '',
        httpStatus: chamada.httpStatus,
        erroConexao: chamada.erroConexao || '',
        parseError: chamada.parseError || '',
        rawPreview: limitarTexto(chamada.texto || '', 1800),
        totalGamesExtraidos: games.length,
        chavesRaiz: listarChaves(json),
        responsePreview: montarWorldcup26Preview(games)
    };
}

function montarWorldcup26Preview(games) {
    var preview = [];

    if (!isArray(games)) return preview;

    for (var i = 0; i < games.length && i < 8; i++) {
        var game = games[i] || {};
        preview.push({
            id: game.id || '',
            local_date: game.local_date || '',
            home: obterNomeHomeWorldcup26(game),
            away: obterNomeAwayWorldcup26(game),
            home_score: game.home_score,
            away_score: game.away_score,
            finished: game.finished,
            time_elapsed: game.time_elapsed,
            type: game.type || '',
            group: game.group || ''
        });
    }

    return preview;
}

function listarChaves(obj) {
    var chaves = [];
    if (!obj || typeof obj !== 'object') return chaves;

    for (var k in obj) {
        if (obj.hasOwnProperty(k)) chaves.push(k);
        if (chaves.length >= 20) break;
    }

    return chaves;
}

function montarPacoteResultadosWorldcup26(games, respostaApi, debugApi) {
    var resultados = {};
    var logsMapeamento = [];
    var totalMapeados = 0;
    var totalSemMapa = 0;
    var jogosPorId = indexarGamesWorldcup26PorId(games);

    for (var i = 0; i < JOGOS_REFERENCIA.length; i++) {
        var jogo = JOGOS_REFERENCIA[i];
        var matchId = jogo.matchId;
        var gameIdMapeado = MATCH_WORLDCUP26_ID_MAP[matchId];
        var game = gameIdMapeado !== null && gameIdMapeado !== undefined ? jogosPorId[String(gameIdMapeado)] : null;

        if (game) {
            resultados[matchId] = normalizarGameWorldcup26(matchId, jogo, game);
            totalMapeados++;
            logsMapeamento.push(matchId + ' -> worldcup26 game id ' + game.id + ' via MATCH_WORLDCUP26_ID_MAP');
        } else {
            resultados[matchId] = montarResultadoNaoMapeadoWorldcup26(jogo);
            totalSemMapa++;
            logsMapeamento.push(matchId + ' -> sem jogo correspondente na worldcup26.ir para game id ' + gameIdMapeado);
        }
    }

    return {
        metadata: {
            fonte: 'worldcup26.ir',
            provedor: 'WORLDCUP26',
            endpoint: WORLDCUP26_GAMES_PATH,
            estrategiaMapeamento: 'MATCH_WORLDCUP26_ID_MAP gerado da aba JOGOS; corrige divergências entre MatchID e id da worldcup26.ir',
            totalFixturesApi: games.length,
            totalGamesApi: games.length,
            totalMapeados: totalMapeados,
            totalSemMapa: totalSemMapa,
            ultimaAtualizacao: agoraIso(),
            timezoneReferencia: TIMEZONE_BR,
            observacao: 'Dataset usando API gratuita worldcup26.ir. Sem chave por padrão; token opcional se o endpoint exigir autenticação.',
            api: debugApi || {},
            apiRawKeys: listarChaves(respostaApi || {})
        },
        resultados: resultados,
        logsMapeamento: logsMapeamento
    };
}

function indexarGamesWorldcup26PorId(games) {
    var mapa = {};
    if (!isArray(games)) return mapa;

    for (var i = 0; i < games.length; i++) {
        var game = games[i] || {};
        var id = numeroOuNull(game.id);
        if (id !== null) mapa[String(id)] = game;
    }

    return mapa;
}

function numeroMatchId(matchId) {
    var texto = String(matchId || '').toUpperCase().replace(/^M/, '');
    var n = Number(texto);
    return isNaN(n) ? null : n;
}

function normalizarGameWorldcup26(matchId, jogoReferencia, game) {
    var statusInfo = normalizarStatusWorldcup26(game);
    var placarHome = numeroOuNull(game.home_score);
    var placarAway = numeroOuNull(game.away_score);

    var temPlacarValido = statusInfo.finalizado || statusInfo.aoVivo;

    return {
        matchId: matchId,
        fixtureId: numeroOuNull(game.id),
        worldcup26Id: numeroOuNull(game.id),
        timeA: jogoReferencia.timeA || obterNomeHomeWorldcup26(game),
        timeB: jogoReferencia.timeB || obterNomeAwayWorldcup26(game),
        timeAApi: obterNomeHomeWorldcup26(game),
        timeBApi: obterNomeAwayWorldcup26(game),
        status: statusInfo.status,
        statusLabel: statusInfo.statusLabel,
        elapsed: statusInfo.elapsed,
        placarA: temPlacarValido ? placarHome : null,
        placarB: temPlacarValido ? placarAway : null,
        finalizado: statusInfo.finalizado,
        aoVivo: statusInfo.aoVivo,
        dataBR: jogoReferencia.dataBR,
        horaBR: jogoReferencia.horaBR,
        dataApi: game.local_date || '',
        fase: jogoReferencia.fase || tipoParaFase(game.type),
        grupo: jogoReferencia.grupo || game.group || '',
        local: jogoReferencia.local || '',
        tipoApi: game.type || '',
        matchdayApi: game.matchday || '',
        invertidoApi: false,
        origem: 'worldcup26.ir',
        origemMapeamento: 'match-id-por-mapa-oficial'
    };
}

function obterNomeHomeWorldcup26(game) {
    game = game || {};
    return String(game.home_team_name_en || game.home_team_label || game.home_team_name || game.home || game.homeTeam || '');
}

function obterNomeAwayWorldcup26(game) {
    game = game || {};
    return String(game.away_team_name_en || game.away_team_label || game.away_team_name || game.away || game.awayTeam || '');
}

function normalizarStatusWorldcup26(game) {
    game = game || {};

    var finished = normalizarBoolean(game.finished);
    var elapsedOriginal = game.time_elapsed;
    var elapsedTexto = String(elapsedOriginal === null || elapsedOriginal === undefined ? '' : elapsedOriginal).toLowerCase().trim();
    var elapsedNumero = numeroOuNull(elapsedOriginal);

    if (finished) {
        return {
            status: 'FT',
            statusLabel: 'Finalizado',
            elapsed: elapsedNumero !== null ? elapsedNumero : 90,
            finalizado: true,
            aoVivo: false
        };
    }

    if (!elapsedTexto || elapsedTexto === 'notstarted' || elapsedTexto === 'not_started' || elapsedTexto === 'not started' || elapsedTexto === 'scheduled' || elapsedTexto === 'ns') {
        return {
            status: 'NS',
            statusLabel: 'Não iniciado',
            elapsed: null,
            finalizado: false,
            aoVivo: false
        };
    }

    if (elapsedTexto === 'halftime' || elapsedTexto === 'half-time' || elapsedTexto === 'ht') {
        return {
            status: 'HT',
            statusLabel: 'Intervalo',
            elapsed: 45,
            finalizado: false,
            aoVivo: true
        };
    }

    if (elapsedTexto.indexOf('extra') >= 0) {
        return {
            status: 'ET',
            statusLabel: 'Prorrogação',
            elapsed: elapsedNumero,
            finalizado: false,
            aoVivo: true
        };
    }

    if (elapsedTexto.indexOf('pen') >= 0) {
        return {
            status: 'P',
            statusLabel: 'Pênaltis',
            elapsed: elapsedNumero,
            finalizado: false,
            aoVivo: true
        };
    }

    if (elapsedNumero !== null || elapsedTexto === 'live' || elapsedTexto === 'playing') {
        return {
            status: 'LIVE',
            statusLabel: elapsedNumero !== null ? (elapsedNumero + '\'') : 'Ao vivo',
            elapsed: elapsedNumero,
            finalizado: false,
            aoVivo: true
        };
    }

    return {
        status: String(elapsedOriginal || 'NS'),
        statusLabel: String(elapsedOriginal || 'Não iniciado'),
        elapsed: elapsedNumero,
        finalizado: false,
        aoVivo: false
    };
}

function normalizarBoolean(valor) {
    if (valor === true) return true;
    if (valor === false) return false;

    var texto = String(valor === null || valor === undefined ? '' : valor).toLowerCase().trim();
    return texto === 'true' || texto === '1' || texto === 'yes' || texto === 'sim' || texto === 'finished' || texto === 'finalizado';
}

function tipoParaFase(tipo) {
    tipo = String(tipo || '').toLowerCase();
    if (tipo === 'group') return 'Grupos';
    if (tipo === 'r32') return 'Round of 32';
    if (tipo === 'r16') return 'Oitavas';
    if (tipo === 'qf') return 'Quartas';
    if (tipo === 'sf') return 'Semifinal';
    if (tipo === 'third') return 'Terceiro lugar';
    if (tipo === 'final') return 'Final';
    return tipo || '';
}

function montarResultadoNaoMapeadoWorldcup26(jogo) {
    return {
        matchId: jogo.matchId,
        fixtureId: null,
        worldcup26Id: null,
        timeA: jogo.timeA,
        timeB: jogo.timeB,
        status: 'Não mapeado',
        statusLabel: 'Não mapeado na worldcup26.ir',
        elapsed: null,
        placarA: null,
        placarB: null,
        finalizado: false,
        aoVivo: false,
        dataBR: jogo.dataBR,
        horaBR: jogo.horaBR,
        fase: jogo.fase,
        grupo: jogo.grupo,
        local: jogo.local,
        origem: 'mapeamento-planilha',
        origemMapeamento: 'sem-game-worldcup26'
    };
}

function numeroOuNull(valor) {
    if (valor === null || valor === undefined || valor === '') return null;

    var texto = String(valor).toLowerCase().trim();
    if (!texto || texto === 'null' || texto === 'undefined' || texto === 'nan') return null;

    var numero = Number(valor);
    return isNaN(numero) ? null : numero;
}

function isArray(valor) {
    return Object.prototype.toString.call(valor) === '[object Array]';
}

function limitarTexto(texto, limite) {
    texto = String(texto || '');
    limite = limite || 1000;

    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
}

function lerStream(stream) {
    if (stream === null) return '';

    var reader = new java.io.BufferedReader(new java.io.InputStreamReader(stream, 'UTF-8'));
    var sb = new java.lang.StringBuilder();
    var linha;

    while ((linha = reader.readLine()) !== null) {
        sb.append(linha);
    }

    reader.close();
    return String(sb.toString());
}

function agoraIso() {
    var sdf = new java.text.SimpleDateFormat('yyyy-MM-dd HH:mm:ss');
    sdf.setTimeZone(java.util.TimeZone.getTimeZone(TIMEZONE_BR));
    return String(sdf.format(new java.util.Date()));
}
