var WidgetBolaoCopa2026 = SuperWidget.extend({
    instanceId: null,

    authConfig: {
        url: typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '',
        consumerKey: 'integracao_widget_diagnostico',
        consumerSecret: 's3cr3t_key_1nt_w1dt_0384183',
        token: '7e4f7fdb-b394-4385-8a88-95a87d475f41',
        tokenSecret: '9e9dcd7e-c8d2-4dd7-a69d-5f5083b9e2c0ec33ebf8-fa20-4ded-9376-0885093c95cf',
        gedFolderId: 684
    },

    state: {
        etapaAtual: 'dados',
        rodadaAtual: 1,
        faseMataMataAtual: 'round_32',
        fasesMataMataDisponiveis: [],

        participante: {
            nome: '',
            email: '',
            telefone: ''
        },

        dadosCopa: null,
        selecoes: {},
        grupos: [],
        jogos: [],
        palpites: {},
        classificacao: {},
        melhoresTerceiros: [],
        classificados: [],
        mapaClassificados: {},
        mataMata: {},
        mataMataResolvido: {},
        campeao: null,
        documentoGED: null
    },

    init: function () {
        this.instanceId = this.instanceId || this.getInstanceIdByElement();

        if (typeof window !== 'undefined') {
            window.__WidgetBolaoCopa2026Instances = window.__WidgetBolaoCopa2026Instances || {};
            window.__WidgetBolaoCopa2026Instances[this.instanceId] = this;

            if (typeof window.bolaoCopa2026Mock !== 'function') {
                window.bolaoCopa2026Mock = function (opcoes) {
                    opcoes = opcoes || {};

                    var registry = window.__WidgetBolaoCopa2026Instances || {};
                    var instanceId = opcoes.instanceId || Object.keys(registry)[0];
                    var instancia = registry[instanceId];

                    if (!instancia) {
                        console.warn('Nenhuma instância da widget Bolão Copa 2026 foi encontrada.');
                        return null;
                    }

                    return instancia.gerarMockDadosTeste(opcoes);
                };
            }
        }

        this.inicializarDadosCopa();
        this.validarBandeirasConfiguradas();

        this.renderizarEtapa();
        this.registrarEventos();
        this.atualizarSidebar();

        console.log("Widget Bolão Copa 2026 iniciada. Instância:", this.instanceId);
    },

    inicializarDadosCopa: function () {
        if (typeof BOLAO_COPA_2026_DATA === 'undefined') {
            this.exibirMensagem(
                'danger',
                'Dados não carregados',
                'O arquivo widget_bolao_copa_2026_dados.js não foi carregado corretamente.'
            );
            return;
        }

        this.state.dadosCopa = BOLAO_COPA_2026_DATA;
        this.state.selecoes = BOLAO_COPA_2026_DATA.selecoes || {};
        this.state.grupos = BOLAO_COPA_2026_DATA.grupos || [];
        this.state.jogos = BOLAO_COPA_2026_DATA.jogos || [];
        this.obterFasesMataMataDisponiveis();

        this.state.palpites = {};

        for (var i = 0; i < this.state.jogos.length; i++) {
            var jogo = this.state.jogos[i];

            this.state.palpites[jogo.id] = {
                matchId: jogo.id,
                fase: jogo.fase,
                grupo: jogo.grupo || null,
                rodada: jogo.rodada || null,
                timeA: jogo.timeA,
                timeB: jogo.timeB,
                placarA: null,
                placarB: null,
                vencedor: null
            };
        }

        console.log('Dados da Copa carregados:', {
            selecoes: Object.keys(this.state.selecoes).length,
            grupos: this.state.grupos.length,
            jogos: this.state.jogos.length,
            palpites: Object.keys(this.state.palpites).length
        });
    },

    getInstanceIdByElement: function () {
        var $widget = $('[id^="WidgetBolaoCopa2026_"]').first();
        if (!$widget.length) return '';
        return $widget.attr('id').replace('WidgetBolaoCopa2026_', '');
    },

    getSeletor: function (idBase) {
        return '#' + idBase + '_' + this.instanceId;
    },

    registrarEventos: function () {
        var that = this;

        $(document)
            .off('click', this.getSeletor('btnBolaoAvancar'))
            .on('click', this.getSeletor('btnBolaoAvancar'), function () {
                that.avancarEtapa();
            });

        $(document)
            .off('click', this.getSeletor('btnBolaoVoltar'))
            .on('click', this.getSeletor('btnBolaoVoltar'), function () {
                that.voltarEtapa();
            });

        $(document)
            .off('input', this.getSeletor('bolaoNome'))
            .on('input', this.getSeletor('bolaoNome'), function () {
                that.state.participante.nome = $(this).val();
                that.atualizarSidebar();
            });

        $(document)
            .off('input', this.getSeletor('bolaoEmail'))
            .on('input', this.getSeletor('bolaoEmail'), function () {
                that.state.participante.email = $(this).val();
            });

        $(document)
            .off('input', this.getSeletor('bolaoTelefone'))
            .on('input', this.getSeletor('bolaoTelefone'), function () {
                var telefoneFormatado = that.aplicarMascaraTelefone($(this).val());
                $(this).val(telefoneFormatado);
                that.state.participante.telefone = telefoneFormatado;
            });

        $(document)
            .off('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-round-tab')
            .on('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-round-tab', function () {
                var rodada = parseInt($(this).data('rodada'), 10);
                that.state.rodadaAtual = rodada;
                that.renderizarEtapa();
            });

        $(document)
            .off('input', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-score-input')
            .on('input', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-score-input', function () {
                that.atualizarPlacarGrupo($(this));
            });

        $(document)
            .off('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-winner-btn')
            .on('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-winner-btn', function () {
                that.atualizarVencedorMataMata($(this));
            });

        $(document)
            .off('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-knockout-tab')
            .on('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-knockout-tab', function () {
                if ($(this).hasClass('disabled')) {
                    that.exibirMensagem(
                        'warning',
                        'Fase bloqueada',
                        'Conclua as fases anteriores antes de acessar esta etapa.'
                    );
                    return;
                }

                that.state.faseMataMataAtual = $(this).data('fase');
                that.renderizarEtapa();
            });
    },

    renderizarFaseGrupos: function () {
        this.calcularTodasClassificacoes();
        this.atualizarClassificacaoPrincipal();

        var rodadaAtual = this.state.rodadaAtual || 1;
        var jogosDaRodada = this.state.jogos.filter(function (jogo) {
            return jogo.fase === 'grupos' && jogo.rodada === rodadaAtual;
        });

        var gruposComJogos = this.agruparJogosPorGrupo(jogosDaRodada);

        var html = '';

        html += '<div class="bolao-round-tabs">';
        html += '   <button type="button" class="bolao-round-tab ' + (rodadaAtual === 1 ? 'active' : '') + '" data-rodada="1">Rodada 1</button>';
        html += '   <button type="button" class="bolao-round-tab ' + (rodadaAtual === 2 ? 'active' : '') + '" data-rodada="2">Rodada 2</button>';
        html += '   <button type="button" class="bolao-round-tab ' + (rodadaAtual === 3 ? 'active' : '') + '" data-rodada="3">Rodada 3</button>';
        html += '</div>';

        html += '<div class="bolao-groups-grid">';

        for (var grupoId in gruposComJogos) {
            if (gruposComJogos.hasOwnProperty(grupoId)) {
                html += this.renderizarCardGrupo(grupoId, gruposComJogos[grupoId], rodadaAtual);
            }
        }

        html += '</div>';

        $(this.getSeletor('bolaoConteudo')).html(html);
    },

    agruparJogosPorGrupo: function (jogos) {
        var grupos = {};

        for (var i = 0; i < jogos.length; i++) {
            var jogo = jogos[i];

            if (!grupos[jogo.grupo]) {
                grupos[jogo.grupo] = [];
            }

            grupos[jogo.grupo].push(jogo);
        }

        return grupos;
    },

    renderizarCardGrupo: function (grupoId, jogos, rodadaAtual) {
        var classificacao = this.state.classificacao[grupoId] || [];
        var html = '';

        html += '<article class="bolao-group-card">';
        html += '   <header class="bolao-group-header">';
        html += '       <div>';
        html += '           <span>Rodada ' + rodadaAtual + '</span>';
        html += '           <h3>Grupo ' + this.escaparHtml(grupoId) + '</h3>';
        html += '       </div>';
        html += '       <span>' + jogos.length + ' jogos</span>';
        html += '   </header>';

        html += '   <div class="bolao-match-list">';

        for (var i = 0; i < jogos.length; i++) {
            html += this.renderizarJogoGrupo(jogos[i]);
        }

        html += '   </div>';

        html += '   <div class="bolao-standings">';
        html += '       <p class="bolao-standings-title">Classificação simulada</p>';
        html += this.renderizarTabelaClassificacao(classificacao);
        html += '   </div>';

        html += '</article>';

        return html;
    },

    renderizarJogoGrupo: function (jogo) {
        var palpite = this.state.palpites[jogo.id] || {};
        var selecaoA = this.obterSelecao(jogo.timeA);
        var selecaoB = this.obterSelecao(jogo.timeB);

        var placarA = palpite.placarA !== null && palpite.placarA !== undefined ? palpite.placarA : '';
        var placarB = palpite.placarB !== null && palpite.placarB !== undefined ? palpite.placarB : '';

        var completo = placarA !== '' && placarB !== '';
        var classeCompleto = completo ? ' completed' : '';

        var html = '';

        html += '<div class="bolao-match-card' + classeCompleto + '" data-match-id="' + this.escaparHtml(jogo.id) + '">';

        html += '   <div class="bolao-match-meta">';
        html += '       <span>' + this.formatarDataJogo(jogo.data) + ' • ' + this.escaparHtml(jogo.hora || '') + '</span>';
        html += '   </div>';

        html += '   <div class="bolao-match-teams">';

        html += '       <div class="bolao-team home">';
        html += '           <img class="bolao-flag" src="' + this.obterUrlBandeira(selecaoA) + '" alt="' + this.escaparHtml(selecaoA.nome) + '" onerror="this.onerror=null;this.src=\'' + this.obterPlaceholderBandeira() + '\'">';
        html += '           <span class="bolao-team-name" title="' + this.escaparHtml(selecaoA.nome) + '">' + this.escaparHtml(selecaoA.nome) + '</span>';
        html += '       </div>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="A" value="' + placarA + '">';

        html += '       <span class="bolao-versus">x</span>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="B" value="' + placarB + '">';

        html += '       <div class="bolao-team away">';
        html += '           <span class="bolao-team-name" title="' + this.escaparHtml(selecaoB.nome) + '">' + this.escaparHtml(selecaoB.nome) + '</span>';
        html += '           <img class="bolao-flag" src="' + this.obterUrlBandeira(selecaoB) + '" alt="' + this.escaparHtml(selecaoB.nome) + '" onerror="this.onerror=null;this.src=\'' + this.obterPlaceholderBandeira() + '\'">';
        html += '       </div>';

        html += '   </div>';
        html += '</div>';

        return html;
    },

    atualizarPlacarGrupo: function ($input) {
        var matchId = $input.data('match-id');
        var lado = $input.data('lado');
        var valor = $input.val();

        if (!this.state.palpites[matchId]) {
            return;
        }

        if (valor !== '') {
            valor = parseInt(valor, 10);

            if (isNaN(valor) || valor < 0) {
                valor = 0;
            }

            if (valor > 99) {
                valor = 99;
            }

            $input.val(valor);
        }

        if (lado === 'A') {
            this.state.palpites[matchId].placarA = valor === '' ? null : valor;
        }

        if (lado === 'B') {
            this.state.palpites[matchId].placarB = valor === '' ? null : valor;
        }

        this.definirVencedorPalpite(matchId);
        this.calcularTodasClassificacoes();
        this.atualizarClassificacaoPrincipal();
        this.atualizarSidebar();
        this.atualizarCardJogoCompleto(matchId);
        this.atualizarTabelasDaTela();

        if (this.state.etapaAtual === 'mata_mata') {
            this.renderizarEtapa();
        }
    },

    definirVencedorPalpite: function (matchId) {
        var palpite = this.state.palpites[matchId];

        if (!palpite) {
            return;
        }

        if (palpite.placarA === null || palpite.placarB === null) {
            palpite.vencedor = null;
            return;
        }

        if (palpite.placarA > palpite.placarB) {
            palpite.vencedor = palpite.timeA;
            return;
        }

        if (palpite.placarB > palpite.placarA) {
            palpite.vencedor = palpite.timeB;
            return;
        }

        if (palpite.fase === 'grupos') {
            palpite.vencedor = 'empate';
            return;
        }

        palpite.vencedor = null;
    },

    atualizarCardJogoCompleto: function (matchId) {
        var palpite = this.state.palpites[matchId];
        var $card = $('.bolao-match-card[data-match-id="' + matchId + '"]');

        if (!palpite || !$card.length) {
            return;
        }

        if (palpite.placarA !== null && palpite.placarB !== null) {
            $card.addClass('completed');
        } else {
            $card.removeClass('completed');
        }
    },

    atualizarTabelasDaTela: function () {
        if (this.state.etapaAtual !== 'grupos') {
            return;
        }

        var rodadaAtual = this.state.rodadaAtual || 1;
        var jogosDaRodada = this.state.jogos.filter(function (jogo) {
            return jogo.fase === 'grupos' && jogo.rodada === rodadaAtual;
        });

        var gruposComJogos = this.agruparJogosPorGrupo(jogosDaRodada);

        for (var grupoId in gruposComJogos) {
            if (gruposComJogos.hasOwnProperty(grupoId)) {
                var $grupoCard = $('.bolao-group-card').filter(function () {
                    return $(this).find('.bolao-group-header h3').text().trim() === 'Grupo ' + grupoId;
                });

                if ($grupoCard.length) {
                    $grupoCard.find('.bolao-standings').html(
                        '<p class="bolao-standings-title">Classificação simulada</p>' +
                        this.renderizarTabelaClassificacao(this.state.classificacao[grupoId] || [])
                    );
                }
            }
        }
    },

    calcularTodasClassificacoes: function () {
        var classificacao = {};

        for (var i = 0; i < this.state.grupos.length; i++) {
            var grupo = this.state.grupos[i];
            classificacao[grupo.id] = this.calcularClassificacaoGrupo(grupo.id);
        }

        this.state.classificacao = classificacao;
    },

    calcularClassificacaoGrupo: function (grupoId) {
        var grupo = this.obterGrupo(grupoId);
        var tabela = {};

        if (!grupo) {
            return [];
        }

        for (var i = 0; i < grupo.selecoes.length; i++) {
            var selecaoId = grupo.selecoes[i];

            tabela[selecaoId] = {
                selecaoId: selecaoId,
                nome: this.obterSelecao(selecaoId).nome,
                pontos: 0,
                jogos: 0,
                vitorias: 0,
                empates: 0,
                derrotas: 0,
                golsPro: 0,
                golsContra: 0,
                saldo: 0
            };
        }

        var jogosGrupo = this.state.jogos.filter(function (jogo) {
            return jogo.fase === 'grupos' && jogo.grupo === grupoId;
        });

        for (var j = 0; j < jogosGrupo.length; j++) {
            var jogo = jogosGrupo[j];
            var palpite = this.state.palpites[jogo.id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null) {
                continue;
            }

            var timeA = palpite.timeA;
            var timeB = palpite.timeB;
            var golsA = parseInt(palpite.placarA, 10);
            var golsB = parseInt(palpite.placarB, 10);

            if (!tabela[timeA] || !tabela[timeB]) {
                continue;
            }

            tabela[timeA].jogos++;
            tabela[timeB].jogos++;

            tabela[timeA].golsPro += golsA;
            tabela[timeA].golsContra += golsB;

            tabela[timeB].golsPro += golsB;
            tabela[timeB].golsContra += golsA;

            if (golsA > golsB) {
                tabela[timeA].pontos += 3;
                tabela[timeA].vitorias++;
                tabela[timeB].derrotas++;
            } else if (golsB > golsA) {
                tabela[timeB].pontos += 3;
                tabela[timeB].vitorias++;
                tabela[timeA].derrotas++;
            } else {
                tabela[timeA].pontos++;
                tabela[timeB].pontos++;
                tabela[timeA].empates++;
                tabela[timeB].empates++;
            }
        }

        var lista = [];

        for (var selecaoKey in tabela) {
            if (tabela.hasOwnProperty(selecaoKey)) {
                tabela[selecaoKey].saldo = tabela[selecaoKey].golsPro - tabela[selecaoKey].golsContra;
                lista.push(tabela[selecaoKey]);
            }
        }

        lista.sort(function (a, b) {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos;
            if (b.saldo !== a.saldo) return b.saldo - a.saldo;
            if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
            if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
            return a.nome.localeCompare(b.nome);
        });

        return lista;
    },

    renderizarTabelaClassificacao: function (classificacao) {
        var html = '';

        html += '<table class="bolao-table-classificacao">';
        html += '   <thead>';
        html += '       <tr>';
        html += '           <th>Seleção</th>';
        html += '           <th>Pts</th>';
        html += '           <th>J</th>';
        html += '           <th>V</th>';
        html += '           <th>E</th>';
        html += '           <th>D</th>';
        html += '           <th>SG</th>';
        html += '       </tr>';
        html += '   </thead>';
        html += '   <tbody>';

        for (var i = 0; i < classificacao.length; i++) {
            var item = classificacao[i];
            var classeClassificado = i < 2 ? ' classificado' : '';

            html += '   <tr class="' + classeClassificado + '">';
            html += '       <td>';
            html += '           <div class="bolao-class-team">';
            html += '               <span class="bolao-class-pos">' + (i + 1) + '</span>';
            html += '               <span class="bolao-class-name" title="' + this.escaparHtml(item.nome) + '">' + this.escaparHtml(item.nome) + '</span>';
            html += '           </div>';
            html += '       </td>';
            html += '       <td>' + item.pontos + '</td>';
            html += '       <td>' + item.jogos + '</td>';
            html += '       <td>' + item.vitorias + '</td>';
            html += '       <td>' + item.empates + '</td>';
            html += '       <td>' + item.derrotas + '</td>';
            html += '       <td>' + item.saldo + '</td>';
            html += '   </tr>';
        }

        html += '   </tbody>';
        html += '</table>';

        return html;
    },

    renderizarGrupoClassificacaoCompacta: function (grupoId, classificacao) {
        var html = '';

        html += '<article class="bolao-main-classification-card">';
        html += '   <header class="bolao-main-classification-header">';
        html += '       <h4>Grupo ' + this.escaparHtml(grupoId) + '</h4>';
        html += '       <span>' + (classificacao ? classificacao.length : 0) + ' seleções</span>';
        html += '   </header>';

        for (var i = 0; i < (classificacao || []).length; i++) {
            var item = classificacao[i];
            var selecao = this.obterSelecao(item.selecaoId);
            var classe = i < 2 ? ' classificado' : '';

            html += '   <div class="bolao-sidebar-team' + classe + '">';
            html += '       <div class="bolao-sidebar-team-name">';
            html += '           <img class="bolao-sidebar-flag" src="' + this.obterUrlBandeira(selecao) + '" alt="' + this.escaparHtml(selecao.nome) + '" onerror="this.onerror=null;this.src=\'' + this.obterPlaceholderBandeira() + '\'">';
            html += '           <span title="' + this.escaparHtml(item.nome) + '">' + this.escaparHtml(item.nome) + '</span>';
            html += '       </div>';
            html += '       <strong>' + item.pontos + ' pts</strong>';
            html += '   </div>';
        }

        html += '</article>';

        return html;
    },

    atualizarSidebar: function () {
        var nome = this.state.participante.nome && this.state.participante.nome.trim()
            ? this.state.participante.nome.trim()
            : 'Ainda não informado';

        $(this.getSeletor('bolaoNomeParticipante')).text(nome);
    },

    atualizarClassificacaoPrincipal: function () {
        var $container = $(this.getSeletor('bolaoMainClassificacao'));

        if (!$container.length) {
            return;
        }

        if (!this.state.classificacao || Object.keys(this.state.classificacao).length === 0) {
            $container.html('<p class="bolao-empty-message">A classificação aparecerá após preencher os jogos.</p>');
            return;
        }

        var grupos = this.state.grupos || [];
        var html = '';

        for (var i = 0; i < grupos.length; i++) {
            var grupo = grupos[i];
            var classificacao = this.state.classificacao[grupo.id] || [];
            html += this.renderizarGrupoClassificacaoCompacta(grupo.id, classificacao);
        }

        $container.html(html);
    },

    validarFaseGruposCompleta: function () {
        var jogosGrupos = this.state.jogos.filter(function (jogo) {
            return jogo.fase === 'grupos';
        });

        for (var i = 0; i < jogosGrupos.length; i++) {
            var jogo = jogosGrupos[i];
            var palpite = this.state.palpites[jogo.id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null) {
                this.exibirMensagem(
                    'warning',
                    'Fase de grupos incompleta',
                    'Preencha todos os placares da fase de grupos antes de avançar. Jogo pendente: ' + jogo.id
                );

                this.state.rodadaAtual = jogo.rodada || 1;
                this.renderizarEtapa();

                return false;
            }
        }

        return true;
    },

    obterSelecao: function (selecaoId) {
        if (this.state.selecoes && this.state.selecoes[selecaoId]) {
            return this.state.selecoes[selecaoId];
        }

        return {
            id: selecaoId,
            nome: selecaoId,
            bandeira: ''
        };
    },

    obterGrupo: function (grupoId) {
        for (var i = 0; i < this.state.grupos.length; i++) {
            if (this.state.grupos[i].id === grupoId) {
                return this.state.grupos[i];
            }
        }

        return null;
    },

    obterUrlBandeira: function (selecao) {
        if (!selecao || !selecao.bandeira) {
            return this.obterPlaceholderBandeira();
        }

        var bandeira = selecao.bandeira;

        if (/^https?:\/\//i.test(bandeira) || bandeira.indexOf('data:image') === 0) {
            return bandeira;
        }

        var basePath = '';

        if (this.state.dadosCopa && this.state.dadosCopa.bandeirasBasePath) {
            basePath = this.state.dadosCopa.bandeirasBasePath;
        }

        if (!basePath) {
            basePath = '/bolao_copa_2026/resources/images/bandeiras/';
        }

        if (basePath.charAt(basePath.length - 1) !== '/') {
            basePath += '/';
        }

        return basePath + bandeira;
    },

    obterPlaceholderBandeira: function () {
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 48 32">' +
            '<rect width="48" height="32" rx="6" fill="#e5e7eb"/>' +
            '<circle cx="24" cy="16" r="7" fill="#9ca3af"/>' +
            '</svg>'
        );
    },

    validarBandeirasConfiguradas: function () {
        if (!this.state.selecoes) {
            return;
        }

        var faltantes = [];

        for (var selecaoId in this.state.selecoes) {
            if (!this.state.selecoes.hasOwnProperty(selecaoId)) {
                continue;
            }

            var selecao = this.state.selecoes[selecaoId];

            if (!selecao.bandeira) {
                faltantes.push(selecaoId);
            }
        }

        if (faltantes.length) {
            console.warn('[Bolão Copa 2026] Seleções sem bandeira configurada:', faltantes);
        }
    },

    formatarDataJogo: function (data) {
        if (!data) {
            return '';
        }

        var partes = data.split('-');

        if (partes.length !== 3) {
            return data;
        }

        return partes[2] + '/' + partes[1] + '/' + partes[0];
    },

    renderizarEtapa: function () {
        if (this.state.etapaAtual === 'dados') {
            this.renderizarDadosParticipante();
        }

        if (this.state.etapaAtual === 'grupos') {
            this.renderizarFaseGrupos();
        }

        if (this.state.etapaAtual === 'mata_mata') {
            this.renderizarMataMata();
        }

        if (this.state.etapaAtual === 'resultado') {
            this.renderizarResultadoFinal();
        }

        this.atualizarCabecalho();
        this.atualizarBotoes();
        this.atualizarMenuEtapas();
        this.atualizarSidebar();
        this.atualizarClassificacaoPrincipal();
    },

    renderizarDadosParticipante: function () {
        var html = '';

        html += '<div class="bolao-form-card">';
        html += '   <div class="bolao-form-header">';
        html += '       <div>';
        html += '           <h3>Comece seu palpite</h3>';
        html += '           <p>Preencha seus dados para identificarmos sua simulação no bolão.</p>';
        html += '       </div>';
        html += '       <div class="bolao-form-icon">';
        html += '           <i class="flaticon flaticon-user icon-md"></i>';
        html += '       </div>';
        html += '   </div>';

        html += '   <div class="bolao-notification-card">';
        html += '       <div class="bolao-notification-icon">';
        html += '           <i class="flaticon flaticon-info icon-sm"></i>';
        html += '       </div>';
        html += '       <div>';
        html += '           <strong>Primeira etapa</strong>';
        html += '           <p>Depois de preencher seus dados, vamos para a fase de grupos e a classificação será atualizada em tempo real.</p>';
        html += '       </div>';
        html += '   </div>';

        html += '   <div class="bolao-form-grid">';

        html += '       <div class="bolao-field">';
        html += '           <label for="bolaoNome_' + this.instanceId + '">Nome</label>';
        html += '           <input type="text" class="form-control" id="bolaoNome_' + this.instanceId + '" placeholder="Ex: Guilherme Assis" value="' + this.escaparHtml(this.state.participante.nome) + '">';
        html += '       </div>';

        html += '       <div class="bolao-field">';
        html += '           <label for="bolaoEmail_' + this.instanceId + '">E-mail</label>';
        html += '           <input type="email" class="form-control" id="bolaoEmail_' + this.instanceId + '" placeholder="seuemail@exemplo.com" value="' + this.escaparHtml(this.state.participante.email) + '">';
        html += '       </div>';

        html += '       <div class="bolao-field">';
        html += '           <label for="bolaoTelefone_' + this.instanceId + '">Telefone</label>';
        html += '           <input type="text" class="form-control" id="bolaoTelefone_' + this.instanceId + '" placeholder="(00) 00000-0000" maxlength="15" value="' + this.escaparHtml(this.state.participante.telefone) + '">';
        html += '       </div>';

        html += '   </div>';

        html += '   <div class="bolao-regulamento-card">';
        html += '       <div class="bolao-regulamento-header">';
        html += '           <strong>Regulamento do bolão</strong>';
        html += '           <span>Como funciona a pontuação</span>';
        html += '       </div>';
        html += '       <ul>';
        html += '           <li>Palpites em todos os jogos da Copa.</li>';
        html += '           <li>Ranking atualizado rodada após rodada.</li>';
        html += '           <li>Pontuação acumulada rodada após rodada.</li>';
        html += '           <li>Tabela atualizada ao fim de cada rodada.</li>';
        html += '           <li>Acertou o placar: <strong>3 pontos</strong>.</li>';
        html += '           <li>Acertou o resultado, vencedor ou empate: <strong>1 ponto</strong>.</li>';
        html += '       </ul>';
        html += '   </div>';

        html += '</div>';

        $(this.getSeletor('bolaoConteudo')).html(html);
    },

    atualizarCabecalho: function () {
        if (this.state.etapaAtual === 'dados') {
            $(this.getSeletor('bolaoEtapaLabel')).text('Etapa 1 de 4');
            $(this.getSeletor('bolaoEtapaTitulo')).text('Dados do participante');
            $(this.getSeletor('bolaoEtapaDescricao')).text('Informe seus dados para iniciar a simulação do bolão da Copa 2026.');
            return;
        }

        if (this.state.etapaAtual === 'grupos') {
            $(this.getSeletor('bolaoEtapaLabel')).text('Etapa 2 de 4');
            $(this.getSeletor('bolaoEtapaTitulo')).text('Fase de grupos');
            $(this.getSeletor('bolaoEtapaDescricao')).text('Preencha os placares por rodada. A classificação dos grupos será atualizada automaticamente.');
            return;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            var configMataMata = this.obterConfigFaseMataMata(this.state.faseMataMataAtual);
            $(this.getSeletor('bolaoEtapaLabel')).text('Etapa 3 de 4');
            $(this.getSeletor('bolaoEtapaTitulo')).text('Mata-mata - ' + configMataMata.label);
            $(this.getSeletor('bolaoEtapaDescricao')).text('Preencha os placares da fase atual. Em caso de empate, escolha quem avança.');
            return;
        }

        if (this.state.etapaAtual === 'resultado') {
            $(this.getSeletor('bolaoEtapaLabel')).text('Etapa 4 de 4');
            $(this.getSeletor('bolaoEtapaTitulo')).text('Resultado final');
            $(this.getSeletor('bolaoEtapaDescricao')).text('Confira o resumo do seu bolão antes do envio.');
            return;
        }
    },


    atualizarBotoes: function () {
        var $btnVoltar = $(this.getSeletor('btnBolaoVoltar'));
        var $btnAvancar = $(this.getSeletor('btnBolaoAvancar'));

        if (this.state.etapaAtual === 'dados') {
            $btnVoltar.prop('disabled', true);
            $btnAvancar.text('Avançar');
            return;
        }

        if (this.state.etapaAtual === 'grupos') {
            $btnVoltar.prop('disabled', false);
            $btnAvancar.text('Avançar para mata-mata');
            return;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            $btnVoltar.prop('disabled', false);
            $btnAvancar.text(this.obterConfigFaseMataMata(this.state.faseMataMataAtual).proximoBotao || 'Avançar');
            return;
        }

        if (this.state.etapaAtual === 'resultado') {
            $btnVoltar.prop('disabled', false);
            $btnAvancar.text('Gerar registro');
        }
    },

    atualizarMenuEtapas: function () {
        var $widget = $('#WidgetBolaoCopa2026_' + this.instanceId);

        $widget.find('.bolao-step-list li').removeClass('active');
        $widget.find('[data-step-menu="' + this.state.etapaAtual + '"]').addClass('active');
    },

    avancarEtapa: function () {
        if (this.state.etapaAtual === 'dados') {
            if (!this.validarDadosParticipante()) {
                return;
            }

            this.state.etapaAtual = 'grupos';
            this.state.rodadaAtual = 1;
            this.renderizarEtapa();

            this.exibirMensagem(
                'success',
                'Dados preenchidos',
                'Agora preencha os placares da fase de grupos.'
            );

            return;
        }

        if (this.state.etapaAtual === 'grupos') {
            if (!this.validarFaseGruposCompleta()) {
                return;
            }

            this.prepararMataMata();

            this.state.etapaAtual = 'mata_mata';
            this.state.faseMataMataAtual = 'round_32';
            this.renderizarEtapa();

            this.exibirMensagem(
                'success',
                'Mata-mata gerado',
                'Os confrontos da primeira fase eliminatória foram montados com base na sua classificação.'
            );

            return;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            if (!this.validarFaseMataMataAtual()) {
                return;
            }

            var proximaFase = this.obterProximaFaseMataMata();

            if (proximaFase) {
                this.state.faseMataMataAtual = proximaFase.id;
                this.renderizarEtapa();

                this.exibirMensagem(
                    'success',
                    'Fase concluída',
                    'Agora preencha os jogos de ' + proximaFase.label + '.'
                );
                return;
            }

            this.definirCampeaoFinal();
            this.state.etapaAtual = 'resultado';
            this.renderizarEtapa();

            this.exibirMensagem(
                'success',
                'Bolão finalizado',
                'Todos os palpites foram preenchidos.'
            );

            return;
        }

        if (this.state.etapaAtual === 'resultado') {
            this.salvarRegistroGED();
            return;
        }
    },

    voltarEtapa: function () {
        if (this.state.etapaAtual === 'grupos') {
            this.state.etapaAtual = 'dados';
            this.renderizarEtapa();
            return;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            var faseAnterior = this.obterFaseAnteriorMataMata();

            if (faseAnterior) {
                this.state.faseMataMataAtual = faseAnterior.id;
                this.renderizarEtapa();
                return;
            }

            this.state.etapaAtual = 'grupos';
            this.renderizarEtapa();
            return;
        }

        if (this.state.etapaAtual === 'resultado') {
            var ultimaFase = this.state.fasesMataMataDisponiveis[this.state.fasesMataMataDisponiveis.length - 1];

            this.state.etapaAtual = 'mata_mata';

            if (ultimaFase) {
                this.state.faseMataMataAtual = ultimaFase.id;
            }

            this.renderizarEtapa();
        }
    },

    validarDadosParticipante: function () {
        var nome = $(this.getSeletor('bolaoNome')).val().trim();
        var email = $(this.getSeletor('bolaoEmail')).val().trim();
        var telefone = $(this.getSeletor('bolaoTelefone')).val().trim();

        this.state.participante.nome = nome;
        this.state.participante.email = email;
        this.state.participante.telefone = telefone;

        if (!nome) {
            this.exibirMensagem('warning', 'Campo obrigatório', 'Informe o nome do participante.');
            $(this.getSeletor('bolaoNome')).focus();
            return false;
        }

        if (!email) {
            this.exibirMensagem('warning', 'Campo obrigatório', 'Informe o e-mail do participante.');
            $(this.getSeletor('bolaoEmail')).focus();
            return false;
        }

        if (!this.emailValido(email)) {
            this.exibirMensagem('warning', 'E-mail inválido', 'Informe um e-mail válido para continuar.');
            $(this.getSeletor('bolaoEmail')).focus();
            return false;
        }

        if (!telefone) {
            this.exibirMensagem('warning', 'Campo obrigatório', 'Informe o telefone do participante.');
            $(this.getSeletor('bolaoTelefone')).focus();
            return false;
        }

        return true;
    },

    emailValido: function (email) {
        var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    aplicarMascaraTelefone: function (valor) {
        valor = valor.replace(/\D/g, '');

        if (valor.length > 11) {
            valor = valor.substring(0, 11);
        }

        if (valor.length <= 10) {
            return valor
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }

        return valor
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    },

    exibirMensagem: function (tipo, titulo, mensagem) {
        if (typeof FLUIGC !== 'undefined' && FLUIGC.toast) {
            FLUIGC.toast({
                title: titulo + ': ',
                message: mensagem,
                type: tipo
            });
            return;
        }

        alert(titulo + '\n' + mensagem);
    },

    escaparHtml: function (texto) {
        if (!texto) return '';

        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    prepararMataMata: function () {
        this.prepararMataMataFases();
        return;

        this.calcularTodasClassificacoes();

        this.state.classificados = this.obterClassificadosFaseGrupos();
        this.state.melhoresTerceiros = this.calcularMelhoresTerceiros();

        var jogosRound32 = this.state.jogos.filter(function (jogo) {
            return jogo.fase === 'round_32';
        });

        var terceirosUsados = {};
        var jogosResolvidos = [];

        for (var i = 0; i < jogosRound32.length; i++) {
            var jogoOriginal = jogosRound32[i];

            var timeAResolvido = this.resolverSlotMataMata(jogoOriginal.timeA, terceirosUsados);
            var timeBResolvido = this.resolverSlotMataMata(jogoOriginal.timeB, terceirosUsados);

            var jogoResolvido = {
                id: jogoOriginal.id,
                fase: jogoOriginal.fase,
                grupo: jogoOriginal.grupo,
                data: jogoOriginal.data,
                hora: jogoOriginal.hora,
                local: jogoOriginal.local,

                // Visual principal: mantém exatamente a lógica da planilha
                timeA: jogoOriginal.timeA,
                timeB: jogoOriginal.timeB,

                // Interno: classificado real, se um dia precisarmos usar
                timeAResolvido: timeAResolvido,
                timeBResolvido: timeBResolvido
            };

            jogosResolvidos.push(jogoResolvido);

            if (!this.state.palpites[jogoOriginal.id]) {
                this.state.palpites[jogoOriginal.id] = {};
            }

            this.state.palpites[jogoOriginal.id].matchId = jogoOriginal.id;
            this.state.palpites[jogoOriginal.id].fase = jogoOriginal.fase;
            this.state.palpites[jogoOriginal.id].grupo = jogoOriginal.grupo || null;
            this.state.palpites[jogoOriginal.id].rodada = null;

            // Salva o confronto como está na planilha
            this.state.palpites[jogoOriginal.id].timeA = jogoOriginal.timeA;
            this.state.palpites[jogoOriginal.id].timeB = jogoOriginal.timeB;

            // Guarda também a resolução real, sem usar como visual principal
            this.state.palpites[jogoOriginal.id].timeAResolvido = timeAResolvido;
            this.state.palpites[jogoOriginal.id].timeBResolvido = timeBResolvido;

            if (this.state.palpites[jogoOriginal.id].placarA === undefined) {
                this.state.palpites[jogoOriginal.id].placarA = null;
            }

            if (this.state.palpites[jogoOriginal.id].placarB === undefined) {
                this.state.palpites[jogoOriginal.id].placarB = null;
            }

            if (this.state.palpites[jogoOriginal.id].vencedor === undefined) {
                this.state.palpites[jogoOriginal.id].vencedor = null;
            }
        }

        this.state.mataMataResolvido.round_32 = jogosResolvidos;

        console.log('Classificados reais:', this.state.classificados);
        console.log('Melhores terceiros:', this.state.melhoresTerceiros);
        console.log('Mata-mata exibido conforme planilha:', this.state.mataMataResolvido.round_32);
    },

    obterClassificadosFaseGrupos: function () {
        var classificados = [];
        var mapa = {};

        for (var i = 0; i < this.state.grupos.length; i++) {
            var grupo = this.state.grupos[i];
            var classificacao = this.state.classificacao[grupo.id] || [];

            for (var pos = 0; pos < classificacao.length; pos++) {
                var item = classificacao[pos];

                var classificado = {
                    selecaoId: item.selecaoId,
                    nome: item.nome,
                    grupo: grupo.id,
                    posicao: pos + 1,
                    pontos: item.pontos,
                    jogos: item.jogos,
                    vitorias: item.vitorias,
                    empates: item.empates,
                    derrotas: item.derrotas,
                    golsPro: item.golsPro,
                    golsContra: item.golsContra,
                    saldo: item.saldo
                };

                classificados.push(classificado);

                if (pos < 2) {
                    mapa[(pos + 1) + grupo.id] = item.selecaoId;
                }

                if (pos === 2) {
                    mapa['3' + grupo.id] = item.selecaoId;
                }
            }
        }

        this.state.mapaClassificados = mapa;

        return classificados;
    },

    calcularMelhoresTerceiros: function () {
        var terceiros = [];

        for (var i = 0; i < this.state.grupos.length; i++) {
            var grupo = this.state.grupos[i];
            var classificacao = this.state.classificacao[grupo.id] || [];

            if (classificacao.length >= 3) {
                var terceiro = classificacao[2];

                terceiros.push({
                    selecaoId: terceiro.selecaoId,
                    nome: terceiro.nome,
                    grupo: grupo.id,
                    posicao: 3,
                    pontos: terceiro.pontos,
                    jogos: terceiro.jogos,
                    vitorias: terceiro.vitorias,
                    empates: terceiro.empates,
                    derrotas: terceiro.derrotas,
                    golsPro: terceiro.golsPro,
                    golsContra: terceiro.golsContra,
                    saldo: terceiro.saldo
                });
            }
        }

        terceiros.sort(function (a, b) {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos;
            if (b.saldo !== a.saldo) return b.saldo - a.saldo;
            if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
            if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
            return a.nome.localeCompare(b.nome);
        });

        return terceiros.slice(0, 8);
    },

    resolverSlotMataMata: function (slot, terceirosUsados) {
        if (!slot) {
            return null;
        }

        var slotTexto = String(slot).trim();

        if (/^[12][A-L]$/.test(slotTexto)) {
            return this.state.mapaClassificados[slotTexto] || slotTexto;
        }

        if (slotTexto.indexOf('Best 3rd') === 0) {
            var gruposPermitidos = this.extrairGruposPermitidosTerceiro(slotTexto);

            for (var i = 0; i < this.state.melhoresTerceiros.length; i++) {
                var terceiro = this.state.melhoresTerceiros[i];

                if (
                    gruposPermitidos.indexOf(terceiro.grupo) !== -1 &&
                    !terceirosUsados[terceiro.selecaoId]
                ) {
                    terceirosUsados[terceiro.selecaoId] = true;
                    return terceiro.selecaoId;
                }
            }

            return slotTexto;
        }

        return slotTexto;
    },

    extrairGruposPermitidosTerceiro: function (texto) {
        var match = String(texto).match(/\(([A-L]+)\)/);

        if (!match || !match[1]) {
            return [];
        }

        return match[1].split('');
    },

    obterConfigFaseMataMata: function (faseId) {
        var faseNormalizada = this.normalizarFaseMataMata(faseId);
        var configs = {
            round_32: {
                id: 'round_32',
                ordem: 1,
                label: '32 avos / Décima-sextas',
                titulo: 'Primeira fase eliminatória',
                proximoBotao: 'Avançar para oitavas'
            },
            round_16: {
                id: 'round_16',
                ordem: 2,
                label: 'Oitavas',
                titulo: 'Oitavas de final',
                proximoBotao: 'Avançar para quartas'
            },
            quarter_finals: {
                id: 'quarter_finals',
                ordem: 3,
                label: 'Quartas',
                titulo: 'Quartas de final',
                proximoBotao: 'Avançar para semifinais'
            },
            semi_finals: {
                id: 'semi_finals',
                ordem: 4,
                label: 'Semifinais',
                titulo: 'Semifinais',
                proximoBotao: 'Avançar'
            },
            third_place: {
                id: 'third_place',
                ordem: 5,
                label: '3º lugar',
                titulo: 'Disputa de terceiro lugar',
                proximoBotao: 'Avançar para final'
            },
            final: {
                id: 'final',
                ordem: 6,
                label: 'Final',
                titulo: 'Final',
                proximoBotao: 'Finalizar bolão'
            }
        };

        return configs[faseNormalizada] || {
            id: faseNormalizada,
            ordem: 99,
            label: faseNormalizada,
            titulo: faseNormalizada,
            proximoBotao: 'Avançar'
        };
    },

    normalizarFaseMataMata: function (fase) {
        var texto = String(fase || '').toLowerCase().trim();

        if (texto === 'round_32' || texto.indexOf('32') !== -1 || texto.indexOf('dezesseis') !== -1 || texto.indexOf('decima') !== -1 || texto.indexOf('décima') !== -1) {
            return 'round_32';
        }

        if (texto === 'round_16' || texto.indexOf('oitavas') !== -1 || texto.indexOf('16') !== -1) {
            return 'round_16';
        }

        if (texto === 'quarter_finals' || texto.indexOf('quartas') !== -1 || texto.indexOf('quarter') !== -1) {
            return 'quarter_finals';
        }

        if (texto === 'semi_finals' || texto.indexOf('semifinal') !== -1 || texto.indexOf('semi') !== -1) {
            return 'semi_finals';
        }

        if (texto === 'third_place' || texto.indexOf('terceiro') !== -1 || texto.indexOf('3º') !== -1 || texto.indexOf('3o') !== -1) {
            return 'third_place';
        }

        if (texto === 'final' || texto.indexOf('final') !== -1) {
            return 'final';
        }

        return fase;
    },

    obterFasesMataMataDisponiveis: function () {
        var mapa = {};

        for (var i = 0; i < this.state.jogos.length; i++) {
            var jogo = this.state.jogos[i];

            if (jogo.fase === 'grupos') {
                continue;
            }

            var faseNormalizada = this.normalizarFaseMataMata(jogo.fase);
            mapa[faseNormalizada] = this.obterConfigFaseMataMata(faseNormalizada);
        }

        var fases = [];

        for (var faseId in mapa) {
            if (mapa.hasOwnProperty(faseId)) {
                fases.push(mapa[faseId]);
            }
        }

        fases.sort(function (a, b) {
            return a.ordem - b.ordem;
        });

        this.state.fasesMataMataDisponiveis = fases;

        return fases;
    },

    obterJogosMataMataFaseAtual: function () {
        var faseAtual = this.state.faseMataMataAtual || 'round_32';

        if (!this.state.mataMataResolvido || !this.state.mataMataResolvido[faseAtual]) {
            return [];
        }

        return this.state.mataMataResolvido[faseAtual];
    },

    obterIndiceFaseMataMataAtual: function () {
        var fases = this.state.fasesMataMataDisponiveis || [];
        var faseAtual = this.state.faseMataMataAtual;

        for (var i = 0; i < fases.length; i++) {
            if (fases[i].id === faseAtual) {
                return i;
            }
        }

        return -1;
    },

    obterProximaFaseMataMata: function () {
        var fases = this.state.fasesMataMataDisponiveis || [];
        var indiceAtual = this.obterIndiceFaseMataMataAtual();

        if (indiceAtual === -1 || indiceAtual >= fases.length - 1) {
            return null;
        }

        return fases[indiceAtual + 1];
    },

    obterFaseAnteriorMataMata: function () {
        var fases = this.state.fasesMataMataDisponiveis || [];
        var indiceAtual = this.obterIndiceFaseMataMataAtual();

        if (indiceAtual <= 0) {
            return null;
        }

        return fases[indiceAtual - 1];
    },

    faseMataMataCompleta: function (faseId) {
        var jogos = this.state.mataMataResolvido[faseId] || [];

        if (!jogos.length) {
            return false;
        }

        for (var i = 0; i < jogos.length; i++) {
            var palpite = this.state.palpites[jogos[i].id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null || !palpite.vencedor) {
                return false;
            }
        }

        return true;
    },

    faseMataMataBloqueada: function (faseId) {
        var fases = this.state.fasesMataMataDisponiveis || [];
        var indiceAlvo = -1;

        for (var i = 0; i < fases.length; i++) {
            if (fases[i].id === faseId) {
                indiceAlvo = i;
                break;
            }
        }

        if (indiceAlvo <= 0) {
            return false;
        }

        for (var j = 0; j < indiceAlvo; j++) {
            if (!this.faseMataMataCompleta(fases[j].id)) {
                return true;
            }
        }

        return false;
    },

    renderizarTabsMataMata: function () {
        var fases = this.state.fasesMataMataDisponiveis || [];
        var faseAtual = this.state.faseMataMataAtual || 'round_32';
        var html = '';

        html += '<div class="bolao-knockout-tabs">';

        for (var i = 0; i < fases.length; i++) {
            var fase = fases[i];
            var active = fase.id === faseAtual ? ' active' : '';
            var done = this.faseMataMataCompleta(fase.id) ? ' done' : '';
            var bloqueada = this.faseMataMataBloqueada(fase.id) ? ' disabled' : '';

            html += '<button type="button" class="bolao-knockout-tab' + active + done + bloqueada + '" data-fase="' + this.escaparHtml(fase.id) + '">';
            html += this.escaparHtml(fase.label);
            html += '</button>';
        }

        html += '</div>';

        return html;
    },

    prepararMataMataFases: function () {
        this.calcularTodasClassificacoes();

        this.state.classificados = this.obterClassificadosFaseGrupos();
        this.state.melhoresTerceiros = this.calcularMelhoresTerceiros();
        this.obterFasesMataMataDisponiveis();

        var jogosPorFase = {};
        var terceirosUsados = {};

        this.state.mataMata = {};
        this.state.mataMataResolvido = {};

        for (var i = 0; i < this.state.jogos.length; i++) {
            var jogoOriginal = this.state.jogos[i];

            if (jogoOriginal.fase === 'grupos') {
                continue;
            }

            var faseNormalizada = this.normalizarFaseMataMata(jogoOriginal.fase);
            var timeAResolvido = this.resolverSlotMataMata(jogoOriginal.timeA, terceirosUsados);
            var timeBResolvido = this.resolverSlotMataMata(jogoOriginal.timeB, terceirosUsados);
            var palpiteExistente = this.state.palpites[jogoOriginal.id] || {};

            this.state.palpites[jogoOriginal.id] = {
                matchId: jogoOriginal.id,
                fase: faseNormalizada,
                faseOriginal: jogoOriginal.fase,
                grupo: jogoOriginal.grupo || null,
                rodada: null,
                timeA: jogoOriginal.timeA,
                timeB: jogoOriginal.timeB,
                timeAResolvido: timeAResolvido,
                timeBResolvido: timeBResolvido,
                placarA: palpiteExistente.placarA !== undefined ? palpiteExistente.placarA : null,
                placarB: palpiteExistente.placarB !== undefined ? palpiteExistente.placarB : null,
                vencedor: palpiteExistente.vencedor !== undefined ? palpiteExistente.vencedor : null
            };

            var jogoResolvido = {
                id: jogoOriginal.id,
                fase: faseNormalizada,
                faseOriginal: jogoOriginal.fase,
                grupo: jogoOriginal.grupo || null,
                data: jogoOriginal.data,
                hora: jogoOriginal.hora,
                local: jogoOriginal.local,
                timeA: jogoOriginal.timeA,
                timeB: jogoOriginal.timeB,
                timeAResolvido: timeAResolvido,
                timeBResolvido: timeBResolvido
            };

            if (!jogosPorFase[faseNormalizada]) {
                jogosPorFase[faseNormalizada] = [];
            }

            jogosPorFase[faseNormalizada].push(jogoResolvido);

            this.state.mataMata[faseNormalizada] = jogosPorFase[faseNormalizada];
            this.state.mataMataResolvido[faseNormalizada] = jogosPorFase[faseNormalizada];
        }

        return this.state.mataMataResolvido;
    },

    renderizarMataMataFases: function () {
        if (!this.state.fasesMataMataDisponiveis || !this.state.fasesMataMataDisponiveis.length) {
            this.prepararMataMataFases();
        }

        if (this.state.fasesMataMataDisponiveis && this.state.fasesMataMataDisponiveis.length) {
            var faseExiste = false;

            for (var i = 0; i < this.state.fasesMataMataDisponiveis.length; i++) {
                if (this.state.fasesMataMataDisponiveis[i].id === this.state.faseMataMataAtual) {
                    faseExiste = true;
                    break;
                }
            }

            if (!faseExiste) {
                this.state.faseMataMataAtual = this.state.fasesMataMataDisponiveis[0].id;
            }
        }

        var faseAtual = this.state.faseMataMataAtual || 'round_32';
        var config = this.obterConfigFaseMataMata(faseAtual);
        var jogos = this.obterJogosMataMataFaseAtual();
        var html = '';

        html += this.renderizarTabsMataMata();

        if (this.obterIndiceFaseMataMataAtual() === 0) {
            html += this.renderizarResumoClassificados();
            html += this.renderizarRankingTerceiros();
        }

        html += '<section class="bolao-knockout-section">';
        html += '   <h3>' + this.escaparHtml(config.titulo) + '</h3>';
        html += '   <div class="bolao-knockout-grid">';

        for (var j = 0; j < jogos.length; j++) {
            html += this.renderizarJogoMataMata(jogos[j]);
        }

        html += '   </div>';
        html += '</section>';

        $(this.getSeletor('bolaoConteudo')).html(html);
    },

    validarFaseMataMataAtualFases: function () {
        var faseAtual = this.state.faseMataMataAtual || 'round_32';
        var jogos = this.state.mataMataResolvido[faseAtual] || [];

        for (var i = 0; i < jogos.length; i++) {
            var jogo = jogos[i];
            var palpite = this.state.palpites[jogo.id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null) {
                this.exibirMensagem(
                    'warning',
                    'Mata-mata incompleto',
                    'Preencha o placar do jogo ' + jogo.id + ' antes de continuar.'
                );

                return false;
            }

            if (!palpite.vencedor) {
                this.exibirMensagem(
                    'warning',
                    'Escolha o classificado',
                    'O jogo ' + jogo.id + ' está empatado. Escolha qual lado avança.'
                );

                return false;
            }
        }

        return true;
    },

    renderizarResultadoFinal: function () {
        var campeao = this.state.campeao && this.state.campeao.vencedorLabel
            ? this.state.campeao.vencedorLabel
            : 'Não definido';

        var html = '';

        html += '<section class="bolao-final-card">';
        html += '   <h3>Bolão preenchido com sucesso</h3>';
        html += '   <p>Participante: <strong>' + this.escaparHtml(this.state.participante.nome) + '</strong></p>';
        html += '   <p>Campeão previsto: <strong>' + this.escaparHtml(campeao) + '</strong></p>';
        html += '   <p>Todos os palpites foram registrados em memória. No próximo passo vamos gerar o JSON para gravação no GED do Fluig.</p>';

        if (this.state.documentoGED && this.state.documentoGED.documentId) {
            html += '<div class="bolao-ged-success">';
            html += '   <strong>Registro salvo no GED</strong>';
            html += '   <p>Documento: ' + this.escaparHtml(this.state.documentoGED.documentId) + '</p>';

            if (this.state.documentoGED.link) {
                html += '   <a href="' + this.escaparHtml(this.state.documentoGED.link) + '" target="_blank" class="btn btn-primary bolao-btn-primary">Abrir documento</a>';
            }

            html += '</div>';
        }

        html += '</section>';

        $(this.getSeletor('bolaoConteudo')).html(html);
    },

    definirCampeaoFinal: function () {
        var fases = this.state.fasesMataMataDisponiveis || [];

        if (!fases.length) {
            this.state.campeao = null;
            return;
        }

        var ultimaFase = fases[fases.length - 1];
        var jogos = this.state.mataMataResolvido[ultimaFase.id] || [];

        if (!jogos.length) {
            this.state.campeao = null;
            return;
        }

        var jogoFinal = jogos[jogos.length - 1];
        var palpite = this.state.palpites[jogoFinal.id];

        if (!palpite || !palpite.vencedor) {
            this.state.campeao = null;
            return;
        }

        this.state.campeao = {
            matchId: jogoFinal.id,
            vencedor: palpite.vencedor,
            vencedorLabel: this.formatarSlotMataMata(palpite.vencedor)
        };
    },

    gerarMockDadosTeste: function (opcoes) {
        opcoes = opcoes || {};

        var nomes = [
            'Ana Souza',
            'Bruno Lima',
            'Carla Mendes',
            'Diego Alves',
            'Eduarda Rocha',
            'Felipe Costa'
        ];

        var emails = [
            'ana.souza@example.com',
            'bruno.lima@example.com',
            'carla.mendes@example.com',
            'diego.alves@example.com',
            'eduarda.rocha@example.com',
            'felipe.costa@example.com'
        ];

        var telefones = [
            '(11) 98888-1111',
            '(21) 97777-2222',
            '(31) 96666-3333',
            '(41) 95555-4444',
            '(51) 94444-5555',
            '(61) 93333-6666'
        ];

        var pickRandom = function (lista) {
            return lista[Math.floor(Math.random() * lista.length)];
        };

        var randomScore = function (max) {
            return Math.floor(Math.random() * (max + 1));
        };

        this.state.participante = {
            nome: pickRandom(nomes),
            email: pickRandom(emails),
            telefone: pickRandom(telefones)
        };

        this.state.documentoGED = null;
        this.state.campeao = null;
        this.state.etapaAtual = 'grupos';
        this.state.rodadaAtual = 1;
        this.state.faseMataMataAtual = 'round_32';

        for (var i = 0; i < this.state.jogos.length; i++) {
            var jogo = this.state.jogos[i];
            var palpite = this.state.palpites[jogo.id] || {
                matchId: jogo.id,
                fase: jogo.fase,
                grupo: jogo.grupo || null,
                rodada: jogo.rodada || null,
                timeA: jogo.timeA,
                timeB: jogo.timeB,
                timeAResolvido: null,
                timeBResolvido: null,
                placarA: null,
                placarB: null,
                vencedor: null
            };

            palpite.fase = jogo.fase;
            palpite.faseOriginal = jogo.fase;
            palpite.grupo = jogo.grupo || null;
            palpite.rodada = jogo.rodada || null;
            palpite.timeA = jogo.timeA;
            palpite.timeB = jogo.timeB;

            if (jogo.fase === 'grupos') {
                palpite.placarA = randomScore(5);
                palpite.placarB = randomScore(5);

                if (palpite.placarA > palpite.placarB) {
                    palpite.vencedor = palpite.timeA;
                } else if (palpite.placarB > palpite.placarA) {
                    palpite.vencedor = palpite.timeB;
                } else {
                    palpite.vencedor = 'empate';
                }
            } else {
                var placarA = randomScore(4);
                var placarB = randomScore(4);

                if (placarA === placarB) {
                    placarB = placarB === 4 ? 3 : placarB + 1;
                }

                palpite.placarA = placarA;
                palpite.placarB = placarB;
                palpite.vencedor = placarA > placarB ? palpite.timeA : palpite.timeB;
            }

            this.state.palpites[jogo.id] = palpite;
        }

        this.calcularTodasClassificacoes();
        this.prepararMataMataFases();

        var fases = this.state.fasesMataMataDisponiveis || [];

        for (var f = 0; f < fases.length; f++) {
            var faseId = fases[f].id;
            var jogosFase = this.state.mataMataResolvido[faseId] || [];

            for (var j = 0; j < jogosFase.length; j++) {
                var jogoFase = jogosFase[j];
                var palpiteFase = this.state.palpites[jogoFase.id];

                if (!palpiteFase) {
                    continue;
                }

                var placarAfase = randomScore(4);
                var placarBfase = randomScore(4);

                if (placarAfase === placarBfase) {
                    placarBfase = placarBfase === 4 ? 3 : placarBfase + 1;
                }

                palpiteFase.placarA = placarAfase;
                palpiteFase.placarB = placarBfase;
                palpiteFase.vencedor = placarAfase > placarBfase ? palpiteFase.timeA : palpiteFase.timeB;
            }
        }

        this.definirCampeaoFinal();
        this.state.etapaAtual = opcoes.irParaResultado === false ? 'mata_mata' : 'resultado';

        if (this.state.etapaAtual === 'mata_mata') {
            this.state.faseMataMataAtual = this.state.fasesMataMataDisponiveis.length
                ? this.state.fasesMataMataDisponiveis[0].id
                : 'round_32';
        }

        this.renderizarEtapa();

        return {
            participante: this.state.participante,
            campeao: this.state.campeao,
            registro: this.montarRegistroFinalGED()
        };
    },

    oauthConfigurado: function () {
        return this.authConfig &&
            this.authConfig.consumerKey &&
            this.authConfig.consumerSecret &&
            this.authConfig.token &&
            this.authConfig.tokenSecret &&
            this.authConfig.consumerKey !== 'CONFIGURAR_CONSUMER_KEY' &&
            this.authConfig.consumerSecret !== 'CONFIGURAR_CONSUMER_SECRET' &&
            this.authConfig.token !== 'CONFIGURAR_TOKEN' &&
            this.authConfig.tokenSecret !== 'CONFIGURAR_TOKEN_SECRET';
    },

    getOAuthData: function (url, method) {
        if (typeof OAuth === 'undefined' || typeof CryptoJS === 'undefined') {
            console.warn('OAuth ou CryptoJS não carregado.');
            return {};
        }

        var oauth = OAuth({
            consumer: {
                key: this.authConfig.consumerKey,
                secret: this.authConfig.consumerSecret
            },
            signature_method: 'HMAC-SHA1',
            hash_function: function (baseString, key) {
                return CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64);
            },
            nonce_length: 6
        });

        return oauth.toHeader(
            oauth.authorize(
                {
                    url: url,
                    method: method,
                    data: {}
                },
                {
                    key: this.authConfig.token,
                    secret: this.authConfig.tokenSecret
                }
            )
        );
    },

    montarRegistroFinalGED: function () {
        var palpites = [];

        for (var matchId in this.state.palpites) {
            if (!this.state.palpites.hasOwnProperty(matchId)) {
                continue;
            }

            var palpite = this.state.palpites[matchId];

            palpites.push({
                matchId: palpite.matchId || matchId,
                fase: palpite.fase || null,
                faseOriginal: palpite.faseOriginal || null,
                grupo: palpite.grupo || null,
                rodada: palpite.rodada || null,
                timeA: palpite.timeA || null,
                timeB: palpite.timeB || null,
                timeAResolvido: palpite.timeAResolvido || null,
                timeBResolvido: palpite.timeBResolvido || null,
                placarA: palpite.placarA,
                placarB: palpite.placarB,
                vencedor: palpite.vencedor || null
            });
        }

        palpites.sort(function (a, b) {
            return String(a.matchId).localeCompare(String(b.matchId));
        });

        return {
            tipoRegistro: 'BOLAO_COPA_2026',
            versaoRegistro: '1.0.0',
            dataEnvio: new Date().toISOString(),

            participante: {
                nome: this.state.participante.nome || '',
                email: this.state.participante.email || '',
                telefone: this.state.participante.telefone || ''
            },

            campeao: this.state.campeao || null,

            totais: {
                totalJogos: palpites.length,
                totalGrupos: this.state.grupos ? this.state.grupos.length : 0,
                totalSelecoes: this.state.selecoes ? Object.keys(this.state.selecoes).length : 0
            },

            classificacao: this.state.classificacao || {},
            melhoresTerceiros: this.state.melhoresTerceiros || [],
            fasesMataMataDisponiveis: this.state.fasesMataMataDisponiveis || [],

            palpites: palpites,

            metadadosFluig: {
                serverURL: typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '',
                userCode: typeof WCMAPI !== 'undefined' && WCMAPI.userCode ? WCMAPI.userCode : '',
                userLogin: typeof WCMAPI !== 'undefined' && WCMAPI.userLogin ? WCMAPI.userLogin : '',
                widget: 'bolao_copa_2026'
            }
        };
    },

    gerarNomeArquivoGED: function () {
        var nome = this.state.participante && this.state.participante.nome
            ? this.state.participante.nome
            : 'participante';

        var nomeSanitizado = String(nome)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        var data = new Date();
        var timestamp = data.getFullYear().toString() +
            String(data.getMonth() + 1).padStart(2, '0') +
            String(data.getDate()).padStart(2, '0') +
            '_' +
            String(data.getHours()).padStart(2, '0') +
            String(data.getMinutes()).padStart(2, '0') +
            String(data.getSeconds()).padStart(2, '0');

        return 'Bolao_Copa_2026_' + nomeSanitizado + '_' + timestamp + '.json';
    },

    uploadJsonBolaoParaGED: function (registro, fileName, callback) {
        var that = this;
        var baseUrl = this.authConfig.url || (typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '');

        var jsonString = JSON.stringify(registro, null, 2);
        var blob = new Blob([jsonString], {
            type: 'application/json;charset=utf-8'
        });

        var endpointUpload = baseUrl + '/api/public/2.0/contentfiles/upload/?fileName=' + encodeURIComponent(fileName);

        $.ajax({
            url: endpointUpload,
            type: 'POST',
            data: blob,
            processData: false,
            contentType: 'application/octet-stream',
            headers: that.getOAuthData(endpointUpload, 'POST'),
            crossDomain: true,
            success: function () {
                that.criarDocumentoGED(fileName, callback);
            },
            error: function (xhr) {
                console.error('Erro ao fazer upload do JSON para o GED:', xhr.responseText || xhr);
                callback(false, null, '', xhr);
            }
        });
    },

    criarDocumentoGED: function (fileName, callback) {
        var that = this;
        var baseUrl = this.authConfig.url || (typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '');
        var pastaDestino = parseInt(this.authConfig.gedFolderId, 10);

        if (!pastaDestino || pastaDestino <= 0) {
            callback(false, null, '', {
                message: 'gedFolderId não configurado.'
            });
            return;
        }

        var payload = {
            description: fileName,
            parentId: pastaDestino,
            downloadEnabled: true,
            internalVisualizer: true,
            isPrivate: false,
            publicDocument: false,
            attachments: [
                {
                    fileName: fileName,
                    principal: true
                }
            ]
        };

        var endpointCreate = baseUrl + '/api/public/ecm/document/createDocument';

        $.ajax({
            url: endpointCreate,
            type: 'POST',
            data: JSON.stringify(payload),
            contentType: 'application/json',
            headers: that.getOAuthData(endpointCreate, 'POST'),
            crossDomain: true,
            success: function (response) {
                var docId = null;

                if (response && response.content && response.content.id) {
                    docId = response.content.id;
                } else if (response && response.content && response.content.documentId) {
                    docId = response.content.documentId;
                }

                if (!docId) {
                    callback(false, null, '', response);
                    return;
                }

                that.obterLinkDownloadGED(docId, function (link) {
                    callback(true, docId, link, response);
                });
            },
            error: function (xhr) {
                console.error('Erro ao criar documento no GED:', xhr.responseText || xhr);
                callback(false, null, '', xhr);
            }
        });
    },

    obterLinkDownloadGED: function (documentId, callback) {
        var that = this;
        var baseUrl = this.authConfig.url || (typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '');

        var endpointDownloadUrl = baseUrl + '/api/public/2.0/documents/getDownloadURL/' + documentId;

        $.ajax({
            url: endpointDownloadUrl,
            type: 'GET',
            headers: that.getOAuthData(endpointDownloadUrl, 'GET'),
            crossDomain: true,
            success: function (resUrl) {
                var link = resUrl && resUrl.content
                    ? resUrl.content
                    : baseUrl + '/portal/p/1/documentdownload?documentId=' + documentId + '&version=1000';

                callback(link);
            },
            error: function () {
                callback(baseUrl + '/portal/p/1/documentdownload?documentId=' + documentId + '&version=1000');
            }
        });
    },

    salvarRegistroGED: function () {
        var that = this;

        if (!this.authConfig || !this.authConfig.gedFolderId || parseInt(this.authConfig.gedFolderId, 10) <= 0) {
            this.exibirMensagem(
                'warning',
                'GED não configurado',
                'Configure o ID da pasta GED em authConfig.gedFolderId antes de salvar.'
            );

            console.log('JSON que seria salvo no GED:', this.montarRegistroFinalGED());
            return;
        }

        if (!this.oauthConfigurado()) {
            this.exibirMensagem(
                'warning',
                'OAuth não configurado',
                'Configure as credenciais OAuth antes de salvar no GED.'
            );

            console.log('JSON que seria salvo no GED:', this.montarRegistroFinalGED());
            return;
        }

        var loading = null;

        if (typeof FLUIGC !== 'undefined' && FLUIGC.loading) {
            loading = FLUIGC.loading(window, {
                textMessage: 'Salvando bolão no GED...',
                title: 'Aguarde'
            });
            loading.show();
        }

        var registro = this.montarRegistroFinalGED();
        var fileName = this.gerarNomeArquivoGED();

        this.uploadJsonBolaoParaGED(registro, fileName, function (sucesso, documentId, linkDocumento, response) {
            if (loading) {
                loading.hide();
            }

            if (!sucesso) {
                that.exibirMensagem(
                    'danger',
                    'Erro ao salvar',
                    'Não foi possível salvar o bolão no GED. Verifique o console para mais detalhes.'
                );

                console.error('Falha ao salvar registro GED:', response);
                return;
            }

            that.state.documentoGED = {
                documentId: documentId,
                link: linkDocumento,
                fileName: fileName,
                dataSalvamento: new Date().toISOString()
            };

            that.exibirMensagem(
                'success',
                'Bolão salvo',
                'O resultado foi salvo no GED com o documento ' + documentId + '.'
            );

            that.renderizarEtapa();
        });
    },

    renderizarMataMata: function () {
        this.renderizarMataMataFases();
        return;

        if (!this.state.mataMataResolvido.round_32 || !this.state.mataMataResolvido.round_32.length) {
            this.prepararMataMata();
        }

        var jogos = this.state.mataMataResolvido.round_32 || [];
        var html = '';

        html += this.renderizarResumoClassificados();
        html += this.renderizarRankingTerceiros();

        html += '<section class="bolao-knockout-section">';
        html += '   <h3>Primeira fase eliminatória</h3>';
        html += '   <div class="bolao-knockout-grid">';

        for (var i = 0; i < jogos.length; i++) {
            html += this.renderizarJogoMataMata(jogos[i]);
        }

        html += '   </div>';
        html += '</section>';

        $(this.getSeletor('bolaoConteudo')).html(html);
    },

    renderizarResumoClassificados: function () {
        var html = '';

        html += '<div class="bolao-qualified-panel">';
        html += '   <section class="bolao-qualified-card">';
        html += '       <h3>Classificados por grupo</h3>';
        html += '       <div class="bolao-qualified-grid">';

        for (var i = 0; i < this.state.grupos.length; i++) {
            var grupo = this.state.grupos[i];
            var classificacao = this.state.classificacao[grupo.id] || [];

            html += '       <div class="bolao-qualified-group">';
            html += '           <strong>Grupo ' + this.escaparHtml(grupo.id) + '</strong>';

            for (var pos = 0; pos < Math.min(3, classificacao.length); pos++) {
                var item = classificacao[pos];
                var selecao = this.obterSelecao(item.selecaoId);

                html += '       <div class="bolao-qualified-team">';
                html += '           <img class="bolao-flag" src="' + this.obterUrlBandeira(selecao) + '" alt="' + this.escaparHtml(selecao.nome) + '" onerror="this.onerror=null;this.src=\'' + this.obterPlaceholderBandeira() + '\'">';
                html += '           <span>' + (pos + 1) + 'º ' + this.escaparHtml(item.nome) + '</span>';
                html += '       </div>';
            }

            html += '       </div>';
        }

        html += '       </div>';
        html += '   </section>';

        return html;
    },

    renderizarRankingTerceiros: function () {
        var html = '';

        html += '   <section class="bolao-third-card">';
        html += '       <h3>Melhores terceiros</h3>';
        html += '       <div class="bolao-third-list">';

        for (var i = 0; i < this.state.melhoresTerceiros.length; i++) {
            var item = this.state.melhoresTerceiros[i];
            var selecao = this.obterSelecao(item.selecaoId);

            html += '       <div class="bolao-third-item">';
            html += '           <div class="team">';
            html += '               <img class="bolao-flag" src="' + this.obterUrlBandeira(selecao) + '" alt="' + this.escaparHtml(selecao.nome) + '" onerror="this.onerror=null;this.src=\'' + this.obterPlaceholderBandeira() + '\'">';
            html += '               <span>' + (i + 1) + '. ' + this.escaparHtml(item.nome) + ' <small>Grupo ' + this.escaparHtml(item.grupo) + '</small></span>';
            html += '           </div>';
            html += '           <span class="points">' + item.pontos + ' pts</span>';
            html += '       </div>';
        }

        html += '       </div>';
        html += '   </section>';
        html += '</div>';

        return html;
    },

    renderizarJogoMataMata: function (jogo) {
        var palpite = this.state.palpites[jogo.id] || {};

        var nomeTimeA = this.formatarSlotMataMata(jogo.timeA);
        var nomeTimeB = this.formatarSlotMataMata(jogo.timeB);

        var placarA = palpite.placarA !== null && palpite.placarA !== undefined ? palpite.placarA : '';
        var placarB = palpite.placarB !== null && palpite.placarB !== undefined ? palpite.placarB : '';

        var completo = palpite.placarA !== null && palpite.placarB !== null && palpite.vencedor;
        var classeCompleto = completo ? ' completed' : '';

        var html = '';

        html += '<article class="bolao-knockout-card' + classeCompleto + '" data-match-id="' + this.escaparHtml(jogo.id) + '">';

        html += '   <div class="bolao-knockout-meta">';
        html += '       <span class="match-id">' + this.escaparHtml(jogo.id) + '</span>';
        html += '       <span>' + this.escaparHtml(jogo.grupo || 'Mata-mata') + '</span>';
        html += '   </div>';

        html += '   <div class="bolao-knockout-teams">';

        html += '       <div class="bolao-knockout-team home bolao-knockout-slot">';
        html += '           <span class="bolao-slot-icon">A</span>';
        html += '           <span title="' + this.escaparHtml(nomeTimeA) + '">' + this.escaparHtml(nomeTimeA) + '</span>';
        html += '       </div>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="A" value="' + placarA + '">';

        html += '       <span class="bolao-versus">x</span>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="B" value="' + placarB + '">';

        html += '       <div class="bolao-knockout-team away bolao-knockout-slot">';
        html += '           <span title="' + this.escaparHtml(nomeTimeB) + '">' + this.escaparHtml(nomeTimeB) + '</span>';
        html += '           <span class="bolao-slot-icon">B</span>';
        html += '       </div>';

        html += '   </div>';

        html += this.renderizarAreaVencedorMataMata(jogo, palpite);

        html += '</article>';

        return html;
    },

    renderizarAreaVencedorMataMata: function (jogo, palpite) {
        if (
            palpite.placarA === null ||
            palpite.placarB === null ||
            palpite.placarA === undefined ||
            palpite.placarB === undefined
        ) {
            return '';
        }

        var nomeTimeA = this.formatarSlotMataMata(jogo.timeA);
        var nomeTimeB = this.formatarSlotMataMata(jogo.timeB);

        var html = '';

        html += '<div class="bolao-winner-area">';

        if (palpite.placarA !== palpite.placarB && palpite.vencedor) {
            var vencedorLabel = palpite.vencedor === jogo.timeA ? nomeTimeA : nomeTimeB;

            html += '<span class="bolao-winner-badge">';
            html += 'Classificado: ' + this.escaparHtml(vencedorLabel);
            html += '</span>';

            html += '</div>';
            return html;
        }

        html += '<div class="bolao-winner-options">';
        html += '   <button type="button" class="bolao-winner-btn ' + (palpite.vencedor === jogo.timeA ? 'active' : '') + '" data-match-id="' + this.escaparHtml(jogo.id) + '" data-vencedor="' + this.escaparHtml(jogo.timeA) + '">';
        html += '       Classificar ' + this.escaparHtml(nomeTimeA);
        html += '   </button>';

        html += '   <button type="button" class="bolao-winner-btn ' + (palpite.vencedor === jogo.timeB ? 'active' : '') + '" data-match-id="' + this.escaparHtml(jogo.id) + '" data-vencedor="' + this.escaparHtml(jogo.timeB) + '">';
        html += '       Classificar ' + this.escaparHtml(nomeTimeB);
        html += '   </button>';
        html += '</div>';

        html += '</div>';

        return html;
    },

    atualizarVencedorMataMata: function ($btn) {
        var matchId = $btn.data('match-id');
        var vencedor = $btn.data('vencedor');

        if (!this.state.palpites[matchId]) {
            return;
        }

        this.state.palpites[matchId].vencedor = vencedor;

        this.renderizarEtapa();
    },

    validarFaseMataMataAtual: function () {
        return this.validarFaseMataMataAtualFases();

        var jogos = this.state.mataMataResolvido.round_32 || [];

        for (var i = 0; i < jogos.length; i++) {
            var jogo = jogos[i];
            var palpite = this.state.palpites[jogo.id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null) {
                this.exibirMensagem(
                    'warning',
                    'Mata-mata incompleto',
                    'Preencha o placar do jogo ' + jogo.id + ' antes de continuar.'
                );

                return false;
            }

            if (!palpite.vencedor) {
                this.exibirMensagem(
                    'warning',
                    'Escolha o classificado',
                    'O jogo ' + jogo.id + ' está empatado. Escolha qual seleção avança.'
                );

                return false;
            }
        }

        return true;
    },

    formatarSlotMataMata: function (slot) {
        if (!slot) {
            return 'A definir';
        }

        var texto = String(slot).trim();

        if (/^1[A-L]$/.test(texto)) {
            return 'Primeiro Grupo ' + texto.substring(1);
        }

        if (/^2[A-L]$/.test(texto)) {
            return 'Segundo Grupo ' + texto.substring(1);
        }

        if (/^3[A-L]$/.test(texto)) {
            return 'Terceiro Grupo ' + texto.substring(1);
        }

        if (texto.indexOf('Best 3rd') === 0) {
            var grupos = this.extrairGruposPermitidosTerceiro(texto);

            if (grupos.length) {
                return 'Melhor 3º colocado dos Grupos ' + grupos.join(', ');
            }

            return 'Melhor 3º colocado';
        }

        if (texto.indexOf('Winner') === 0) {
            return texto.replace('Winner', 'Vencedor');
        }

        if (texto.indexOf('Loser') === 0) {
            return texto.replace('Loser', 'Perdedor');
        }

        return texto;
    },
});
