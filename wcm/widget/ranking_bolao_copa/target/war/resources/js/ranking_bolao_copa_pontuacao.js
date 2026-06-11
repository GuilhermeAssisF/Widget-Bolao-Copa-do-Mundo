(function (window) {
    'use strict';

    window.BolaoRankingPontuacao = {
        numeroOuNull: function (valor) {
            if (valor === null || valor === undefined || valor === '') return null;
            var numero = Number(valor);
            return isNaN(numero) ? null : numero;
        },

        obterResultado: function (a, b) {
            a = this.numeroOuNull(a);
            b = this.numeroOuNull(b);

            if (a === null || b === null) return null;
            if (a > b) return 'A';
            if (b > a) return 'B';
            return 'EMPATE';
        },

        calcularPalpite: function (palpite, resultado, parcial) {
            palpite = palpite || {};
            resultado = resultado || {};

            var palpiteA = this.numeroOuNull(palpite.palpiteA);
            var palpiteB = this.numeroOuNull(palpite.palpiteB);
            var realA = this.numeroOuNull(resultado.placarA);
            var realB = this.numeroOuNull(resultado.placarB);
            var config = window.BOLAO_RANKING_CONFIG || {};
            var finalizado = !!resultado.finalizado;
            var aoVivo = !!resultado.aoVivo;

            if (!finalizado && !parcial) {
                return {
                    pontos: 0,
                    pontosExibicao: '-',
                    tipo: aoVivo ? 'aovivo' : 'aguardando',
                    detalhe: aoVivo ? 'Ao vivo — parcial não somado' : 'Aguardando resultado',
                    oficial: false
                };
            }

            if (palpiteA === null || palpiteB === null || realA === null || realB === null) {
                return {
                    pontos: 0,
                    pontosExibicao: parcial ? '0' : '-',
                    tipo: aoVivo ? 'aovivo' : 'aguardando',
                    detalhe: 'Sem placar para calcular',
                    oficial: false
                };
            }

            if (palpiteA === realA && palpiteB === realB) {
                return {
                    pontos: config.pontosPlacarExato || 3,
                    pontosExibicao: String(config.pontosPlacarExato || 3),
                    tipo: 'exato',
                    detalhe: parcial ? 'Parcial: placar exato' : 'Placar exato',
                    oficial: finalizado
                };
            }

            if (this.obterResultado(palpiteA, palpiteB) === this.obterResultado(realA, realB)) {
                return {
                    pontos: config.pontosResultado || 1,
                    pontosExibicao: String(config.pontosResultado || 1),
                    tipo: 'resultado',
                    detalhe: parcial ? 'Parcial: acertou vencedor/empate' : 'Acertou vencedor/empate',
                    oficial: finalizado
                };
            }

            return {
                pontos: 0,
                pontosExibicao: '0',
                tipo: 'erro',
                detalhe: parcial ? 'Parcial: errou resultado' : 'Errou resultado',
                oficial: finalizado
            };
        },

        calcularTudo: function (palpites, resultados) {
            var rankingMap = {};
            var detalhados = [];
            var pontosDistribuidos = 0;
            palpites = palpites || [];
            resultados = resultados || {};

            for (var i = 0; i < palpites.length; i++) {
                var palpite = palpites[i];
                var nome = palpite.participante || 'Sem nome';
                var resultado = resultados[palpite.matchId] || {
                    matchId: palpite.matchId,
                    timeA: palpite.timeA,
                    timeB: palpite.timeB,
                    status: palpite.statusJogo || 'Não jogado',
                    statusLabel: palpite.statusJogo || 'Não jogado',
                    placarA: palpite.placarRealA,
                    placarB: palpite.placarRealB,
                    finalizado: false,
                    aoVivo: false
                };

                var calculo = this.calcularPalpite(palpite, resultado, false);
                var linha = this.montarLinhaDetalhada(palpite, resultado, calculo);
                detalhados.push(linha);

                if (!rankingMap[nome]) {
                    rankingMap[nome] = {
                        participante: nome,
                        pontos: 0,
                        acertosExatos: 0,
                        acertosResultado: 0,
                        jogosPontuados: 0,
                        totalPalpites: 0,
                        palpites: []
                    };
                }

                rankingMap[nome].totalPalpites += 1;
                rankingMap[nome].palpites.push(linha);

                if (calculo.oficial) {
                    rankingMap[nome].pontos += calculo.pontos;
                    pontosDistribuidos += calculo.pontos;

                    if (calculo.pontos > 0) {
                        rankingMap[nome].jogosPontuados += 1;
                    }

                    if (calculo.tipo === 'exato') {
                        rankingMap[nome].acertosExatos += 1;
                    }

                    if (calculo.tipo === 'resultado') {
                        rankingMap[nome].acertosResultado += 1;
                    }
                }
            }

            var ranking = [];
            for (var chave in rankingMap) {
                if (Object.prototype.hasOwnProperty.call(rankingMap, chave)) {
                    ranking.push(rankingMap[chave]);
                }
            }

            ranking.sort(function (a, b) {
                if (b.pontos !== a.pontos) return b.pontos - a.pontos;
                if (b.acertosExatos !== a.acertosExatos) return b.acertosExatos - a.acertosExatos;
                if (b.acertosResultado !== a.acertosResultado) return b.acertosResultado - a.acertosResultado;
                return String(a.participante).localeCompare(String(b.participante));
            });

            for (var r = 0; r < ranking.length; r++) {
                ranking[r].posicao = r + 1;
            }

            return {
                ranking: ranking,
                detalhados: detalhados,
                pontosDistribuidos: pontosDistribuidos
            };
        },

        montarLinhaDetalhada: function (palpite, resultado, calculo) {
            return {
                palpiteId: palpite.palpiteId,
                participante: palpite.participante,
                matchId: palpite.matchId,
                timeA: resultado.timeA || palpite.timeA,
                timeB: resultado.timeB || palpite.timeB,
                palpiteA: this.numeroOuNull(palpite.palpiteA),
                palpiteB: this.numeroOuNull(palpite.palpiteB),
                placarRealA: this.numeroOuNull(resultado.placarA),
                placarRealB: this.numeroOuNull(resultado.placarB),
                statusJogo: resultado.statusLabel || resultado.status || palpite.statusJogo || 'Não jogado',
                finalizado: !!resultado.finalizado,
                aoVivo: !!resultado.aoVivo,
                pontos: calculo.pontos,
                pontosExibicao: calculo.pontosExibicao,
                tipo: calculo.tipo,
                detalhe: calculo.detalhe,
                oficial: calculo.oficial
            };
        }
    };
})(window);
