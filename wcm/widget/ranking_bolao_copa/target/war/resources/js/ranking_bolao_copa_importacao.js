/* ========================================================================== 
   IMPORTAÇÃO DA PLANILHA DE PALPITES
   ========================================================================== */

window.RankingBolaoImportacao = (function () {
    'use strict';

    function normalizarChave(valor) {
        return String(valor || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '');
    }

    function criarMapaLinha(linha) {
        var mapa = {};
        Object.keys(linha || {}).forEach(function (chaveOriginal) {
            mapa[normalizarChave(chaveOriginal)] = linha[chaveOriginal];
        });
        return mapa;
    }

    function obter(mapa, aliases, padrao) {
        for (var i = 0; i < aliases.length; i++) {
            var chave = normalizarChave(aliases[i]);
            if (Object.prototype.hasOwnProperty.call(mapa, chave)) {
                return mapa[chave];
            }
        }
        return padrao;
    }

    function texto(valor) {
        if (valor === null || typeof valor === 'undefined') return '';
        return String(valor).trim();
    }

    function numero(valor) {
        if (valor === null || typeof valor === 'undefined' || valor === '') return null;
        if (typeof valor === 'number') return isNaN(valor) ? null : valor;

        var normalizado = String(valor)
            .trim()
            .replace(',', '.')
            .replace(/[^0-9.-]/g, '');

        if (!normalizado) return null;

        var parsed = parseFloat(normalizado);
        return isNaN(parsed) ? null : parsed;
    }

    function linhaParaPalpite(linha, indice) {
        var mapa = criarMapaLinha(linha);
        var participante = texto(obter(mapa, ['Participante', 'Nome', 'Nome Participante'], ''));
        var matchId = texto(obter(mapa, ['MatchID', 'Match ID', 'ID Jogo', 'JogoID'], ''));

        if (!participante || !matchId) {
            return null;
        }

        return {
            palpiteId: texto(obter(mapa, ['PalpiteID', 'Palpite ID'], indice + 1)),
            participante: participante,
            matchId: matchId.toUpperCase(),
            timeA: texto(obter(mapa, ['Time A', 'TimeA', 'Mandante'], '')),
            timeB: texto(obter(mapa, ['Time B', 'TimeB', 'Visitante'], '')),
            palpiteA: numero(obter(mapa, ['Palpite A', 'PalpiteA', 'Placar A', 'Placar Palpite A'], null)),
            palpiteB: numero(obter(mapa, ['Palpite B', 'PalpiteB', 'Placar B', 'Placar Palpite B'], null)),
            statusJogo: texto(obter(mapa, ['Status Jogo', 'Status'], '')),
            placarRealA: numero(obter(mapa, ['Placar Real A', 'Real A', 'Resultado A'], null)),
            placarRealB: numero(obter(mapa, ['Placar Real B', 'Real B', 'Resultado B'], null)),
            pontosPlanilha: numero(obter(mapa, ['Pontos'], null)),
            detalhePlanilha: texto(obter(mapa, ['Detalhe'], '')),
            timestamp: texto(obter(mapa, ['Timestamp', 'Data'], '')),
            obs: texto(obter(mapa, ['Obs', 'Observação', 'Observacao'], '')),
            linhaOrigem: indice + 2
        };
    }

    function lerArquivoExcel(arquivo) {
        return new Promise(function (resolve, reject) {
            if (!arquivo) {
                reject(new Error('Nenhum arquivo selecionado.'));
                return;
            }

            if (typeof XLSX === 'undefined') {
                reject(new Error('Biblioteca XLSX não carregada. Verifique o acesso ao CDN do SheetJS.'));
                return;
            }

            var reader = new FileReader();

            reader.onload = function (evento) {
                try {
                    var data = new Uint8Array(evento.target.result);
                    var workbook = XLSX.read(data, { type: 'array' });
                    var primeiraAba = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[primeiraAba];
                    var linhas = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
                    var palpites = [];

                    linhas.forEach(function (linha, indice) {
                        var palpite = linhaParaPalpite(linha, indice);
                        if (palpite) {
                            palpites.push(palpite);
                        }
                    });

                    resolve({
                        nomeArquivo: arquivo.name,
                        aba: primeiraAba,
                        totalLinhas: linhas.length,
                        palpites: palpites
                    });
                } catch (erro) {
                    reject(erro);
                }
            };

            reader.onerror = function () {
                reject(new Error('Não foi possível ler o arquivo selecionado.'));
            };

            reader.readAsArrayBuffer(arquivo);
        });
    }

    return {
        lerArquivoExcel: lerArquivoExcel,
        linhaParaPalpite: linhaParaPalpite,
        numero: numero,
        texto: texto,
        normalizarChave: normalizarChave
    };
})();
