(function (window) {
    'use strict';

    window.BOLAO_RANKING_CONFIG = window.BOLAO_RANKING_CONFIG || {
        pontosPlacarExato: 3,
        pontosResultado: 1,
        statusFinalizados: ['FT', 'AET', 'PEN', 'FINALIZADO', 'ENCERRADO', 'FINAL', 'FIM DE JOGO'],
        statusAoVivo: ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'AO VIVO', 'INTERVALO']
    };

    window.BOLAO_RANKING_RESULTADOS_API = window.BOLAO_RANKING_RESULTADOS_API || {};

    window.BolaoRankingResultados = {
        normalizarTexto: function (valor) {
            return String(valor || '')
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toUpperCase();
        },

        isFinalizado: function (status) {
            var normalizado = this.normalizarTexto(status);
            if (!normalizado || normalizado === 'NAO JOGADO' || normalizado === 'AGENDADO') {
                return false;
            }

            var lista = window.BOLAO_RANKING_CONFIG.statusFinalizados || [];
            for (var i = 0; i < lista.length; i++) {
                if (normalizado === this.normalizarTexto(lista[i])) {
                    return true;
                }
            }

            return normalizado.indexOf('FINAL') >= 0 || normalizado.indexOf('ENCERR') >= 0;
        },

        isAoVivo: function (status) {
            var normalizado = this.normalizarTexto(status);
            if (!normalizado) return false;

            var lista = window.BOLAO_RANKING_CONFIG.statusAoVivo || [];
            for (var i = 0; i < lista.length; i++) {
                if (normalizado === this.normalizarTexto(lista[i])) {
                    return true;
                }
            }

            return normalizado.indexOf('VIVO') >= 0 || normalizado.indexOf('TEMPO') >= 0;
        },

        montarResultados: function (basePlanilha) {
            var resultados = {};
            var iniciais = basePlanilha && basePlanilha.resultadosIniciais ? basePlanilha.resultadosIniciais : {};
            var api = window.BOLAO_RANKING_RESULTADOS_API || {};
            var matchId;

            for (matchId in iniciais) {
                if (Object.prototype.hasOwnProperty.call(iniciais, matchId)) {
                    resultados[matchId] = this.normalizarResultado(iniciais[matchId]);
                }
            }

            for (matchId in api) {
                if (Object.prototype.hasOwnProperty.call(api, matchId)) {
                    resultados[matchId] = this.normalizarResultado(api[matchId]);
                    resultados[matchId].origem = api[matchId].origem || 'api-cache';
                }
            }

            return resultados;
        },

        normalizarResultado: function (resultado) {
            resultado = resultado || {};
            var status = resultado.status || resultado.statusLabel || 'Não jogado';
            var finalizado = typeof resultado.finalizado === 'boolean' ? resultado.finalizado : this.isFinalizado(status);
            var aoVivo = typeof resultado.aoVivo === 'boolean' ? resultado.aoVivo : this.isAoVivo(status);

            return {
                matchId: resultado.matchId || null,
                fixtureId: resultado.fixtureId || null,
                timeA: resultado.timeA || '',
                timeB: resultado.timeB || '',
                status: status,
                statusLabel: resultado.statusLabel || status,
                placarA: this.numeroOuNull(resultado.placarA),
                placarB: this.numeroOuNull(resultado.placarB),
                elapsed: resultado.elapsed || null,
                finalizado: finalizado,
                aoVivo: aoVivo,
                origem: resultado.origem || 'planilha'
            };
        },

        numeroOuNull: function (valor) {
            if (valor === null || valor === undefined || valor === '') return null;
            var numero = Number(valor);
            return isNaN(numero) ? null : numero;
        }
    };
})(window);
