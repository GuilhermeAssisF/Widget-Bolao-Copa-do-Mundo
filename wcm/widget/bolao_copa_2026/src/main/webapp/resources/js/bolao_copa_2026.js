var WidgetBolaoCopa2026 = SuperWidget.extend({
    instanceId: null,

    googleDriveTokenClient: null,
    googleDriveAccessToken: null,
    googleDriveTokenExpiry: 0,

    authConfig: {
        url: typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '',
        consumerKey: 'integracao_widget_diagnostico',
        consumerSecret: 's3cr3t_key_1nt_w1dt_0384183',
        token: '7e4f7fdb-b394-4385-8a88-95a87d475f41',
        tokenSecret: '9e9dcd7e-c8d2-4dd7-a69d-5f5083b9e2c0ec33ebf8-fa20-4ded-9376-0885093c95cf',
        gedFolderId: 684,
        emailResponsavelBolao: 'marketing@interhativaoperacional.com',
        googleDriveClientId: '286116751747-goda27iokurmta2tftnlgf4um29n8dpb.apps.googleusercontent.com',
        googleDriveFolderId: '1LXt_ofQpB7QJufgwtlD37XOKuBnizojJ',
        googleDriveScope: 'https://www.googleapis.com/auth/drive.file'
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

            if (typeof window.bolaoCopa2026Mocks !== 'object') {
                window.bolaoCopa2026Mocks = {
                    geral: function (opcoes) {
                        return window.bolaoCopa2026Mock(opcoes);
                    },
                    grupos: function (opcoes) {
                        opcoes = opcoes || {};
                        opcoes.etapa = 'grupos';
                        return window.bolaoCopa2026Mock(opcoes);
                    },
                    rodada1: function (opcoes) {
                        opcoes = opcoes || {};
                        opcoes.etapa = 'grupos';
                        opcoes.rodada = 1;
                        return window.bolaoCopa2026Mock(opcoes);
                    },
                    rodada2: function (opcoes) {
                        opcoes = opcoes || {};
                        opcoes.etapa = 'grupos';
                        opcoes.rodada = 2;
                        return window.bolaoCopa2026Mock(opcoes);
                    },
                    rodada3: function (opcoes) {
                        opcoes = opcoes || {};
                        opcoes.etapa = 'grupos';
                        opcoes.rodada = 3;
                        return window.bolaoCopa2026Mock(opcoes);
                    },
                    mataMata: function (opcoes) {
                        opcoes = opcoes || {};
                        opcoes.etapa = 'mata_mata';
                        return window.bolaoCopa2026Mock(opcoes);
                    },
                    fase: function (faseId, opcoes) {
                        opcoes = opcoes || {};
                        opcoes.etapa = 'mata_mata';
                        opcoes.faseMataMata = faseId;
                        return window.bolaoCopa2026Mock(opcoes);
                    },
                    round32: function (opcoes) {
                        return window.bolaoCopa2026Mocks.fase('round_32', opcoes);
                    },
                    oitavas: function (opcoes) {
                        return window.bolaoCopa2026Mocks.fase('round_16', opcoes);
                    },
                    quartas: function (opcoes) {
                        return window.bolaoCopa2026Mocks.fase('quarter_finals', opcoes);
                    },
                    semis: function (opcoes) {
                        return window.bolaoCopa2026Mocks.fase('semi_finals', opcoes);
                    },
                    terceiroLugar: function (opcoes) {
                        return window.bolaoCopa2026Mocks.fase('third_place', opcoes);
                    },
                    final: function (opcoes) {
                        return window.bolaoCopa2026Mocks.fase('final', opcoes);
                    }
                };
            }
        }

        this.inicializarDadosCopa();
        this.carregarEstadoLocalStorage();
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

    rolarParaTopoDaEtapa: function (seletorAlvo) {
        if (typeof window === 'undefined' || typeof $ === 'undefined') {
            return;
        }

        var $alvo = seletorAlvo ? $(seletorAlvo) : $();

        if (!$alvo.length) {
            $alvo = $(this.getSeletor('bolaoConteudo'));
        }

        if (!$alvo.length) {
            return;
        }

        var topo = Math.max(0, ($alvo.offset() && $alvo.offset().top ? $alvo.offset().top : 0) - 20);

        $('html, body').stop(true).animate({ scrollTop: topo }, 250);
    },

    destacarJogosPendentes: function (matchIds) {
        if (!matchIds || !matchIds.length || typeof $ === 'undefined') {
            return;
        }

        var $widget = $('#WidgetBolaoCopa2026_' + this.instanceId);
        var $primeiro = $();

        $widget.find('.bolao-match-card-pending').removeClass('bolao-match-card-pending');

        for (var i = 0; i < matchIds.length; i++) {
            var matchId = String(matchIds[i]).replace(/"/g, '\\"');
            var $card = $widget.find('.bolao-match-card[data-match-id="' + matchId + '"], .bolao-knockout-card[data-match-id="' + matchId + '"]');

            if (!$card.length) {
                continue;
            }

            $card.addClass('bolao-match-card-pending');

            if (!$primeiro.length) {
                $primeiro = $card.first();
            }
        }

        if ($primeiro.length) {
            var topo = Math.max(0, ($primeiro.offset().top || 0) - 90);
            $('html, body').stop(true).animate({ scrollTop: topo }, 300);
        }
    },

    alternarSidebarMobile: function () {
        var $widget = $('#WidgetBolaoCopa2026_' + this.instanceId);
        var $sidebar = $widget.find('.bolao-sidebar');
        var $botao = $(this.getSeletor('btnBolaoSidebarToggle'));

        if (!$widget.length || !$sidebar.length || !$botao.length) {
            return;
        }

        var aberta = !$widget.hasClass('bolao-sidebar-open-mobile');
        if (aberta) {
            $widget.removeClass('bolao-classificacao-open-mobile');
            $(this.getSeletor('btnBolaoClassificacaoMobile')).attr('aria-expanded', 'false');
        }

        $widget.toggleClass('bolao-sidebar-open-mobile', aberta);
        $botao.attr('aria-expanded', aberta ? 'true' : 'false');
        this.atualizarControlesMobile();
    },

    alternarClassificacaoMobile: function () {
        var $widget = $('#WidgetBolaoCopa2026_' + this.instanceId);
        var $botao = $(this.getSeletor('btnBolaoClassificacaoMobile'));

        if (!$widget.length || !$botao.length) {
            return;
        }

        var aberta = !$widget.hasClass('bolao-classificacao-open-mobile');
        if (aberta) {
            $widget.removeClass('bolao-sidebar-open-mobile');
            $(this.getSeletor('btnBolaoSidebarToggle')).attr('aria-expanded', 'false');
        }

        $widget.toggleClass('bolao-classificacao-open-mobile', aberta);
        $botao.attr('aria-expanded', aberta ? 'true' : 'false');
        this.atualizarControlesMobile();
    },

    fecharPainelsMobile: function () {
        var $widget = $('#WidgetBolaoCopa2026_' + this.instanceId);
        var $sidebarBotao = $(this.getSeletor('btnBolaoSidebarToggle'));
        var $classificacaoBotao = $(this.getSeletor('btnBolaoClassificacaoMobile'));

        if (!$widget.length) {
            return;
        }

        $widget.removeClass('bolao-sidebar-open-mobile bolao-classificacao-open-mobile');

        if ($sidebarBotao.length) {
            $sidebarBotao.attr('aria-expanded', 'false');
        }

        if ($classificacaoBotao.length) {
            $classificacaoBotao.attr('aria-expanded', 'false');
        }

        this.atualizarControlesMobile();
    },

    atualizarControlesMobile: function () {
        var $widget = $('#WidgetBolaoCopa2026_' + this.instanceId);
        var $botaoClassificacao = $(this.getSeletor('btnBolaoClassificacaoMobile'));

        if (!$widget.length || !$botaoClassificacao.length) {
            return;
        }

        if ($widget.hasClass('bolao-classificacao-open-mobile')) {
            $botaoClassificacao.text('Ocultar classificação');
        } else {
            $botaoClassificacao.text('Ver classificação simulada');
        }
    },

    registrarEventos: function () {
        var that = this;

        $(document)
            .off('click', this.getSeletor('btnBolaoAvancar'))
            .on('click', this.getSeletor('btnBolaoAvancar'), function () {
                that.avancarEtapa();
            });

        $(document)
            .off('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-nova-simulacao-btn')
            .on('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-nova-simulacao-btn', function () {
                that.iniciarNovaSimulacao();
            });

        $(document)
            .off('click', this.getSeletor('btnBolaoVoltar'))
            .on('click', this.getSeletor('btnBolaoVoltar'), function () {
                that.voltarEtapa();
            });

        $(document)
            .off('click', this.getSeletor('btnBolaoSidebarToggle'))
            .on('click', this.getSeletor('btnBolaoSidebarToggle'), function () {
                that.alternarSidebarMobile();
            });

        $(document)
            .off('click', this.getSeletor('btnBolaoClassificacaoMobile'))
            .on('click', this.getSeletor('btnBolaoClassificacaoMobile'), function () {
                that.alternarClassificacaoMobile();
            });

        $(document)
            .off('input', this.getSeletor('bolaoNome'))
            .on('input', this.getSeletor('bolaoNome'), function () {
                that.state.participante.nome = $(this).val();
                that.atualizarSidebar();
                that.salvarEstadoLocalStorage();
            });

        $(document)
            .off('input', this.getSeletor('bolaoEmail'))
            .on('input', this.getSeletor('bolaoEmail'), function () {
                that.state.participante.email = $(this).val();
                that.salvarEstadoLocalStorage();
            });

        $(document)
            .off('input', this.getSeletor('bolaoTelefone'))
            .on('input', this.getSeletor('bolaoTelefone'), function () {
                var telefoneFormatado = that.aplicarMascaraTelefone($(this).val());
                $(this).val(telefoneFormatado);
                that.state.participante.telefone = telefoneFormatado;
                that.salvarEstadoLocalStorage();
            });

        $(document)
            .off('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-round-tab')
            .on('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-round-tab', function () {
                var rodada = parseInt($(this).data('rodada'), 10);
                that.state.rodadaAtual = rodada;
                that.renderizarEtapa();
                that.salvarEstadoLocalStorage();
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
                that.salvarEstadoLocalStorage();
            });
    },

    obterChaveLocalStorage: function () {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }

        return 'bolao_copa_2026_state_' + (this.instanceId || 'default');
    },

    salvarEstadoLocalStorage: function () {
        var chave = this.obterChaveLocalStorage();

        if (!chave) {
            return;
        }

        try {
            var snapshot = {
                versao: 1,
                salvoEm: new Date().toISOString(),
                etapaAtual: this.state.etapaAtual,
                rodadaAtual: this.state.rodadaAtual,
                faseMataMataAtual: this.state.faseMataMataAtual,
                participante: {
                    nome: this.state.participante.nome || '',
                    email: this.state.participante.email || '',
                    telefone: this.state.participante.telefone || ''
                },
                palpites: this.state.palpites || {}
            };

            window.localStorage.setItem(chave, JSON.stringify(snapshot));
        } catch (erro) {
            console.warn('Não foi possível salvar o estado localmente.', erro);
        }
    },

    carregarEstadoLocalStorage: function () {
        var chave = this.obterChaveLocalStorage();

        if (!chave) {
            return;
        }

        try {
            var raw = window.localStorage.getItem(chave);

            if (!raw) {
                return;
            }

            var snapshot = JSON.parse(raw);

            if (!snapshot || !snapshot.palpites) {
                return;
            }

            if (snapshot.participante) {
                this.state.participante.nome = snapshot.participante.nome || '';
                this.state.participante.email = snapshot.participante.email || '';
                this.state.participante.telefone = snapshot.participante.telefone || '';
            }

            if (snapshot.etapaAtual) {
                this.state.etapaAtual = snapshot.etapaAtual;
            }

            if (snapshot.rodadaAtual) {
                this.state.rodadaAtual = snapshot.rodadaAtual;
            }

            if (snapshot.faseMataMataAtual) {
                this.state.faseMataMataAtual = snapshot.faseMataMataAtual;
            }

            for (var matchId in snapshot.palpites) {
                if (!snapshot.palpites.hasOwnProperty(matchId)) {
                    continue;
                }

                if (!this.state.palpites[matchId]) {
                    continue;
                }

                var salvo = snapshot.palpites[matchId];
                this.state.palpites[matchId].placarA = salvo.placarA !== undefined ? salvo.placarA : this.state.palpites[matchId].placarA;
                this.state.palpites[matchId].placarB = salvo.placarB !== undefined ? salvo.placarB : this.state.palpites[matchId].placarB;
                this.state.palpites[matchId].vencedor = salvo.vencedor !== undefined ? salvo.vencedor : this.state.palpites[matchId].vencedor;
            }

            this.calcularTodasClassificacoes();
            this.prepararMataMataFases();
            this.definirCampeaoFinal();
        } catch (erro) {
            console.warn('Não foi possível restaurar o estado salvo localmente.', erro);
        }
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
        html += '       <span class="bolao-match-id">' + this.escaparHtml(jogo.id) + '</span>';
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
        var palpiteAtual = this.state.palpites[matchId];

        if (!palpiteAtual) {
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
            palpiteAtual.placarA = valor === '' ? null : valor;
        }

        if (lado === 'B') {
            palpiteAtual.placarB = valor === '' ? null : valor;
        }

        this.definirVencedorPalpite(matchId);

        if (palpiteAtual.fase === 'grupos') {
            this.calcularTodasClassificacoes();
            this.atualizarClassificacaoPrincipal();
            this.atualizarSidebar();
            this.atualizarCardJogoCompleto(matchId);
            this.atualizarTabelasDaTela();
            this.prepararMataMataFases();
            palpiteAtual = this.state.palpites[matchId] || palpiteAtual;
        } else {
            this.prepararMataMataFases();
            palpiteAtual = this.state.palpites[matchId] || palpiteAtual;
        }

        this.salvarEstadoLocalStorage();

        if (
            palpiteAtual.placarA !== null &&
            palpiteAtual.placarB !== null
        ) {
            $('.bolao-match-card[data-match-id="' + matchId + '"], .bolao-knockout-card[data-match-id="' + matchId + '"]')
                .removeClass('bolao-match-card-pending');
        }

        if (this.state.etapaAtual === 'mata_mata') {
            this.atualizarCardJogoMataMata(matchId);
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
            palpite.vencedor = palpite.timeAResolvido || palpite.timeA;
            return;
        }

        if (palpite.placarB > palpite.placarA) {
            palpite.vencedor = palpite.timeBResolvido || palpite.timeB;
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

    atualizarCardJogoMataMata: function (matchId) {
        var palpite = this.state.palpites[matchId];
        var jogo = this.obterJogoMataMataResolvidoPorId(matchId);
        var $card = $('.bolao-knockout-card[data-match-id="' + matchId + '"]');

        if (!palpite || !$card.length) {
            return;
        }

        if (!jogo) {
            return;
        }

        if (palpite.placarA !== null && palpite.placarB !== null && palpite.vencedor) {
            $card.addClass('completed');
        } else {
            $card.removeClass('completed');
        }

        var htmlAreaVencedor = this.renderizarAreaVencedorMataMata(jogo, palpite);
        var $areaVencedor = $card.find('.bolao-winner-area');

        if ($areaVencedor.length) {
            if (htmlAreaVencedor) {
                $areaVencedor.replaceWith(htmlAreaVencedor);
            } else {
                $areaVencedor.remove();
            }

            return;
        }

        if (htmlAreaVencedor) {
            $card.find('.bolao-knockout-teams').after(htmlAreaVencedor);
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
        var rodadaPendente = null;
        var jogosPendentes = [];

        for (var i = 0; i < jogosGrupos.length; i++) {
            var jogo = jogosGrupos[i];
            var palpite = this.state.palpites[jogo.id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null) {
                rodadaPendente = jogo.rodada || 1;
                break;
            }
        }

        if (!rodadaPendente) {
            return true;
        }

        for (var j = 0; j < jogosGrupos.length; j++) {
            var jogoPendente = jogosGrupos[j];
            var palpitePendente = this.state.palpites[jogoPendente.id];

            if (parseInt(jogoPendente.rodada, 10) !== parseInt(rodadaPendente, 10)) {
                continue;
            }

            if (!palpitePendente || palpitePendente.placarA === null || palpitePendente.placarB === null) {
                jogosPendentes.push(jogoPendente.id);
            }
        }

        this.exibirMensagem(
            'warning',
            'Fase de grupos incompleta',
            'Preencha todos os placares da rodada ' + rodadaPendente + ' antes de avançar.'
        );

        this.state.rodadaAtual = rodadaPendente;
        this.renderizarEtapa();
        this.destacarJogosPendentes(jogosPendentes);

        return false;
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
        this.fecharPainelsMobile();

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

        if (this.state.etapaAtual === 'enviado') {
            this.renderizarEnvioConcluido();
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
        html += '           <input type="text" class="form-control" id="bolaoNome_' + this.instanceId + '" placeholder="Ex: João Fernandes" value="' + this.escaparHtml(this.state.participante.nome) + '">';
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

        if (this.state.etapaAtual === 'enviado') {
            $(this.getSeletor('bolaoEtapaLabel')).text('Envio concluído');
            $(this.getSeletor('bolaoEtapaTitulo')).text('Palpites enviados');
            $(this.getSeletor('bolaoEtapaDescricao')).text('Obrigado por participar do Bolão Copa 2026.');
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
            $btnAvancar.text('Enviar resultado');
            return;
        }

        if (this.state.etapaAtual === 'enviado') {
            $btnVoltar.prop('disabled', true);
            $btnAvancar.text('Iniciar nova simulação');
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
            this.salvarResultadoDrive();
            return;
        }

        if (this.state.etapaAtual === 'enviado') {
            this.iniciarNovaSimulacao();
            return;
        }
    },

    voltarEtapa: function () {
        if (this.state.etapaAtual === 'grupos') {
            this.state.etapaAtual = 'dados';
            this.renderizarEtapa();
            this.salvarEstadoLocalStorage();
            return;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            var faseAnterior = this.obterFaseAnteriorMataMata();

            if (faseAnterior) {
                this.state.faseMataMataAtual = faseAnterior.id;
                this.renderizarEtapa();
                this.salvarEstadoLocalStorage();
                return;
            }

            this.state.etapaAtual = 'grupos';
            this.renderizarEtapa();
            this.salvarEstadoLocalStorage();
            return;
        }

        if (this.state.etapaAtual === 'resultado') {
            var ultimaFase = this.state.fasesMataMataDisponiveis[this.state.fasesMataMataDisponiveis.length - 1];

            this.state.etapaAtual = 'mata_mata';

            if (ultimaFase) {
                this.state.faseMataMataAtual = ultimaFase.id;
            }

            this.renderizarEtapa();
            this.salvarEstadoLocalStorage();
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
        var mapaMelhoresTerceiros = this.resolverMelhoresTerceirosMataMata(jogosRound32);

        var terceirosUsados = {};
        var jogosResolvidos = [];

        for (var i = 0; i < jogosRound32.length; i++) {
            var jogoOriginal = jogosRound32[i];

            var timeAResolvido = this.resolverSlotMataMata(
                jogoOriginal.timeA,
                terceirosUsados,
                mapaMelhoresTerceiros,
                jogoOriginal.id + ':A'
            );
            var timeBResolvido = this.resolverSlotMataMata(
                jogoOriginal.timeB,
                terceirosUsados,
                mapaMelhoresTerceiros,
                jogoOriginal.id + ':B'
            );

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

    resolverSlotMataMata: function (slot, terceirosUsados, mapaMelhoresTerceiros, chaveSlot, contextoMataMata) {
        if (!slot) {
            return null;
        }

        var slotTexto = String(slot).trim();
        var participanteReferencia = this.obterParticipanteReferenciaMataMata(slotTexto, contextoMataMata);

        if (participanteReferencia !== undefined) {
            return participanteReferencia;
        }

        if (/^[12][A-L]$/.test(slotTexto)) {
            return this.state.mapaClassificados[slotTexto] || slotTexto;
        }

        if (slotTexto.indexOf('Best 3rd') === 0) {
            if (
                mapaMelhoresTerceiros &&
                chaveSlot &&
                mapaMelhoresTerceiros[chaveSlot]
            ) {
                return mapaMelhoresTerceiros[chaveSlot];
            }

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

    resolverMelhoresTerceirosMataMata: function (jogosRound32) {
        var slots = [];
        var terceiros = this.state.melhoresTerceiros || [];

        for (var i = 0; i < jogosRound32.length; i++) {
            var jogo = jogosRound32[i];

            if (String(jogo.timeA || '').indexOf('Best 3rd') === 0) {
                slots.push({
                    chave: jogo.id + ':A',
                    ordem: slots.length,
                    gruposPermitidos: this.extrairGruposPermitidosTerceiro(jogo.timeA),
                    candidatos: this.obterCandidatosTerceiroPorGrupos(terceiros, jogo.timeA)
                });
            }

            if (String(jogo.timeB || '').indexOf('Best 3rd') === 0) {
                slots.push({
                    chave: jogo.id + ':B',
                    ordem: slots.length,
                    gruposPermitidos: this.extrairGruposPermitidosTerceiro(jogo.timeB),
                    candidatos: this.obterCandidatosTerceiroPorGrupos(terceiros, jogo.timeB)
                });
            }
        }

        if (!slots.length) {
            return {};
        }

        var slotsOrdenados = slots.slice().sort(function (a, b) {
            if (a.candidatos.length !== b.candidatos.length) {
                return a.candidatos.length - b.candidatos.length;
            }

            return a.ordem - b.ordem;
        });

        var atribuicao = {};
        var usados = {};

        var resolverRecursivo = function (indice) {
            if (indice >= slotsOrdenados.length) {
                return true;
            }

            var slot = slotsOrdenados[indice];

            for (var j = 0; j < slot.candidatos.length; j++) {
                var candidato = slot.candidatos[j];

                if (usados[candidato.selecaoId]) {
                    continue;
                }

                usados[candidato.selecaoId] = true;
                atribuicao[slot.chave] = candidato.selecaoId;

                if (resolverRecursivo(indice + 1)) {
                    return true;
                }

                delete atribuicao[slot.chave];
                delete usados[candidato.selecaoId];
            }

            return false;
        };

        if (resolverRecursivo(0)) {
            return atribuicao;
        }

        // Fallback: se a combinacao sem repeticao falhar, ainda assim nao deixa
        // o mata-mata voltar para placeholder quando houver classificado elegivel.
        atribuicao = {};
        usados = {};

        for (var k = 0; k < slots.length; k++) {
            var slotFallback = slots[k];
            var escolhidoFallback = null;

            // Primeiro tenta manter selecoes unicas.
            for (var m = 0; m < slotFallback.candidatos.length; m++) {
                var candidatoFallback = slotFallback.candidatos[m];

                if (usados[candidatoFallback.selecaoId]) {
                    continue;
                }

                escolhidoFallback = candidatoFallback;
                break;
            }

            // Ultima protecao: melhor candidato elegivel, mesmo que ja usado.
            if (!escolhidoFallback && slotFallback.candidatos.length) {
                escolhidoFallback = slotFallback.candidatos[0];
            }

            if (escolhidoFallback) {
                usados[escolhidoFallback.selecaoId] = true;
                atribuicao[slotFallback.chave] = escolhidoFallback.selecaoId;
            }
        }

        return atribuicao;
    },

    obterCandidatosTerceiroPorGrupos: function (terceiros, slotTexto) {
        var gruposPermitidos = this.extrairGruposPermitidosTerceiro(slotTexto);
        var candidatos = [];

        for (var i = 0; i < terceiros.length; i++) {
            var terceiro = terceiros[i];

            if (gruposPermitidos.indexOf(terceiro.grupo) !== -1) {
                candidatos.push(terceiro);
            }
        }

        return candidatos;
    },

    obterJogoMataMataResolvidoPorId: function (matchId) {
        var fases = this.state.mataMataResolvido || {};

        for (var faseId in fases) {
            if (!fases.hasOwnProperty(faseId)) {
                continue;
            }

            var jogos = fases[faseId] || [];

            for (var i = 0; i < jogos.length; i++) {
                if (jogos[i].id === matchId) {
                    return jogos[i];
                }
            }
        }

        return null;
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

    normalizarChaveGrupoMataMata: function (grupo) {
        return String(grupo || '').trim().replace(/\s+/g, ' ').toUpperCase();
    },

    normalizarMatchIdMataMata: function (numero) {
        var texto = String(numero || '').replace(/\D/g, '');

        while (texto.length < 3) {
            texto = '0' + texto;
        }

        return 'M' + texto;
    },

    identificarReferenciaMataMata: function (slotTexto) {
        var texto = String(slotTexto || '').trim();
        var match = texto.match(/^W(\d+)$/i);

        if (match) {
            return { tipo: 'vencedor', matchId: this.normalizarMatchIdMataMata(match[1]) };
        }

        match = texto.match(/^L(\d+)$/i);

        if (match) {
            return { tipo: 'perdedor', matchId: this.normalizarMatchIdMataMata(match[1]) };
        }

        match = texto.match(/^(VENCEDOR|GANHADOR)\s+JOGO\s+(\d+)$/i);

        if (match) {
            return { tipo: 'vencedor', grupo: 'JOGO ' + parseInt(match[2], 10) };
        }

        match = texto.match(/^(VENCEDOR|GANHADOR)\s+QUARTAS\s+(\d+)$/i);

        if (match) {
            return { tipo: 'vencedor', grupo: 'QUARTAS ' + parseInt(match[2], 10) };
        }

        match = texto.match(/^(VENCEDOR|GANHADOR)\s+SEMI\s+(\d+)$/i);

        if (match) {
            return { tipo: 'vencedor', grupo: 'SEMI ' + parseInt(match[2], 10) };
        }

        match = texto.match(/^PERDEDOR\s+SEMI\s+(\d+)$/i);

        if (match) {
            return { tipo: 'perdedor', grupo: 'SEMI ' + parseInt(match[1], 10) };
        }

        match = texto.match(/^PERDEDOR\s+JOGO\s+(\d+)$/i);

        if (match) {
            return { tipo: 'perdedor', grupo: 'JOGO ' + parseInt(match[1], 10) };
        }

        return null;
    },

    obterJogoReferenciaMataMata: function (referencia, contexto) {
        if (!referencia || !contexto) {
            return null;
        }

        if (referencia.matchId && contexto.porId && contexto.porId[referencia.matchId]) {
            return contexto.porId[referencia.matchId];
        }

        if (referencia.grupo && contexto.porGrupo) {
            return contexto.porGrupo[this.normalizarChaveGrupoMataMata(referencia.grupo)] || null;
        }

        return null;
    },

    obterValorLadoResolvidoMataMata: function (jogo, lado) {
        if (!jogo) {
            return null;
        }

        return lado === 'A'
            ? (jogo.timeAResolvido || jogo.timeA)
            : (jogo.timeBResolvido || jogo.timeB);
    },

    obterLadoVencedorMataMata: function (jogo) {
        var palpite = jogo ? this.state.palpites[jogo.id] : null;

        if (!jogo || !palpite || !palpite.vencedor) {
            return null;
        }

        var valorA = this.obterValorLadoResolvidoMataMata(jogo, 'A');
        var valorB = this.obterValorLadoResolvidoMataMata(jogo, 'B');

        if (palpite.vencedor === valorA || palpite.vencedor === jogo.timeA || palpite.vencedor === palpite.timeA) {
            return 'A';
        }

        if (palpite.vencedor === valorB || palpite.vencedor === jogo.timeB || palpite.vencedor === palpite.timeB) {
            return 'B';
        }

        if (palpite.placarA !== null && palpite.placarB !== null && palpite.placarA !== palpite.placarB) {
            return palpite.placarA > palpite.placarB ? 'A' : 'B';
        }

        return null;
    },

    obterParticipanteReferenciaMataMata: function (slotTexto, contexto) {
        var referencia = this.identificarReferenciaMataMata(slotTexto);

        if (!referencia) {
            return undefined;
        }

        var jogo = this.obterJogoReferenciaMataMata(referencia, contexto);
        var ladoVencedor = this.obterLadoVencedorMataMata(jogo);

        if (!jogo || !ladoVencedor) {
            return undefined;
        }

        if (referencia.tipo === 'vencedor') {
            return this.obterValorLadoResolvidoMataMata(jogo, ladoVencedor);
        }

        return this.obterValorLadoResolvidoMataMata(jogo, ladoVencedor === 'A' ? 'B' : 'A');
    },

    normalizarVencedorPalpiteMataMata: function (palpite, timeAResolvido, timeBResolvido) {
        if (!palpite) {
            return;
        }

        if (palpite.placarA === null || palpite.placarB === null) {
            palpite.vencedor = null;
            return;
        }

        var valorA = timeAResolvido || palpite.timeA;
        var valorB = timeBResolvido || palpite.timeB;

        if (palpite.placarA > palpite.placarB) {
            palpite.vencedor = valorA;
            return;
        }

        if (palpite.placarB > palpite.placarA) {
            palpite.vencedor = valorB;
            return;
        }

        if (palpite.vencedor === valorA || palpite.vencedor === palpite.timeA || palpite.vencedor === timeAResolvido) {
            palpite.vencedor = valorA;
            return;
        }

        if (palpite.vencedor === valorB || palpite.vencedor === palpite.timeB || palpite.vencedor === timeBResolvido) {
            palpite.vencedor = valorB;
            return;
        }

        palpite.vencedor = null;
    },

    prepararMataMataFases: function () {
        this.calcularTodasClassificacoes();

        this.state.classificados = this.obterClassificadosFaseGrupos();
        this.state.melhoresTerceiros = this.calcularMelhoresTerceiros();
        this.obterFasesMataMataDisponiveis();

        var jogosOriginaisPorFase = {};
        var jogosPorFase = {};
        var contextoMataMata = {
            porId: {},
            porGrupo: {}
        };

        this.state.mataMata = {};
        this.state.mataMataResolvido = {};

        for (var i = 0; i < this.state.jogos.length; i++) {
            var jogoOriginal = this.state.jogos[i];

            if (jogoOriginal.fase === 'grupos') {
                continue;
            }

            var faseNormalizada = this.normalizarFaseMataMata(jogoOriginal.fase);

            if (!jogosOriginaisPorFase[faseNormalizada]) {
                jogosOriginaisPorFase[faseNormalizada] = [];
            }

            jogosOriginaisPorFase[faseNormalizada].push(jogoOriginal);
        }

        var mapaMelhoresTerceiros = this.resolverMelhoresTerceirosMataMata(jogosOriginaisPorFase.round_32 || []);
        var fases = this.state.fasesMataMataDisponiveis || [];

        for (var f = 0; f < fases.length; f++) {
            var faseId = fases[f].id;
            var jogosDaFase = jogosOriginaisPorFase[faseId] || [];
            var terceirosUsados = {};

            for (var j = 0; j < jogosDaFase.length; j++) {
                var jogoOriginalFase = jogosDaFase[j];
                var timeAResolvido = this.resolverSlotMataMata(
                    jogoOriginalFase.timeA,
                    terceirosUsados,
                    mapaMelhoresTerceiros,
                    jogoOriginalFase.id + ':A',
                    contextoMataMata
                );
                var timeBResolvido = this.resolverSlotMataMata(
                    jogoOriginalFase.timeB,
                    terceirosUsados,
                    mapaMelhoresTerceiros,
                    jogoOriginalFase.id + ':B',
                    contextoMataMata
                );
                var palpiteExistente = this.state.palpites[jogoOriginalFase.id] || {};
                var palpiteAtualizado = {
                    matchId: jogoOriginalFase.id,
                    fase: faseId,
                    faseOriginal: jogoOriginalFase.fase,
                    grupo: jogoOriginalFase.grupo || null,
                    rodada: null,
                    timeA: jogoOriginalFase.timeA,
                    timeB: jogoOriginalFase.timeB,
                    timeAResolvido: timeAResolvido,
                    timeBResolvido: timeBResolvido,
                    placarA: palpiteExistente.placarA !== undefined ? palpiteExistente.placarA : null,
                    placarB: palpiteExistente.placarB !== undefined ? palpiteExistente.placarB : null,
                    vencedor: palpiteExistente.vencedor !== undefined ? palpiteExistente.vencedor : null
                };

                this.normalizarVencedorPalpiteMataMata(palpiteAtualizado, timeAResolvido, timeBResolvido);
                this.state.palpites[jogoOriginalFase.id] = palpiteAtualizado;

                var jogoResolvido = {
                    id: jogoOriginalFase.id,
                    fase: faseId,
                    faseOriginal: jogoOriginalFase.fase,
                    grupo: jogoOriginalFase.grupo || null,
                    data: jogoOriginalFase.data,
                    hora: jogoOriginalFase.hora,
                    local: jogoOriginalFase.local,
                    timeA: jogoOriginalFase.timeA,
                    timeB: jogoOriginalFase.timeB,
                    timeAResolvido: timeAResolvido,
                    timeBResolvido: timeBResolvido
                };

                if (!jogosPorFase[faseId]) {
                    jogosPorFase[faseId] = [];
                }

                jogosPorFase[faseId].push(jogoResolvido);
                contextoMataMata.porId[jogoResolvido.id] = jogoResolvido;

                if (jogoResolvido.grupo) {
                    contextoMataMata.porGrupo[this.normalizarChaveGrupoMataMata(jogoResolvido.grupo)] = jogoResolvido;
                }

                this.state.mataMata[faseId] = jogosPorFase[faseId];
                this.state.mataMataResolvido[faseId] = jogosPorFase[faseId];
            }
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
        var jogosSemPlacar = [];
        var jogosSemClassificado = [];

        for (var i = 0; i < jogos.length; i++) {
            var jogo = jogos[i];
            var palpite = this.state.palpites[jogo.id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null) {
                jogosSemPlacar.push(jogo.id);
                continue;
            }

            if (!palpite.vencedor) {
                jogosSemClassificado.push(jogo.id);
            }
        }

        if (jogosSemPlacar.length) {
            this.exibirMensagem(
                'warning',
                'Mata-mata incompleto',
                'Preencha os placares destacados antes de continuar.'
            );

            this.destacarJogosPendentes(jogosSemPlacar);
            return false;
        }

        if (jogosSemClassificado.length) {
            this.exibirMensagem(
                'warning',
                'Escolha o classificado',
                'Escolha quem avança nos jogos destacados.'
            );

            this.destacarJogosPendentes(jogosSemClassificado);
            return false;
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
        html += '   <p>Todos os palpites foram registrados em memória. No próximo passo vamos preparar o envio final.</p>';

        html += '</section>';

        $(this.getSeletor('bolaoConteudo')).html(html);
    },

    renderizarEnvioConcluido: function () {
        var html = '';

        html += '<section class="bolao-final-card bolao-envio-concluido-card">';
        html += '   <h3>Parabéns, seus palpites foram enviados!</h3>';
        html += '   <p>Recebemos o resultado do seu bolão e salvamos a planilha para conferência.</p>';
        html += '   <p>Se quiser começar uma nova simulação, seus dados anteriores já foram limpos deste navegador.</p>';
        html += '   <button type="button" class="btn btn-primary bolao-btn-primary bolao-nova-simulacao-btn">Iniciar nova simulação</button>';
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
            vencedorLabel: this.obterNomeSelecaoOuSlot(palpite.vencedor)
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

        var rodadaDesejada = opcoes.rodada !== undefined && opcoes.rodada !== null
            ? parseInt(opcoes.rodada, 10)
            : null;
        var faseDesejada = opcoes.faseMataMata ? this.normalizarFaseMataMata(opcoes.faseMataMata) : null;
        var modoGrupos = rodadaDesejada !== null || opcoes.etapa === 'grupos';
        var modoMataMata = faseDesejada !== null || opcoes.etapa === 'mata_mata';

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
                if (rodadaDesejada && parseInt(jogo.rodada, 10) !== rodadaDesejada) {
                    palpite.placarA = null;
                    palpite.placarB = null;
                    palpite.vencedor = null;
                    this.state.palpites[jogo.id] = palpite;
                    continue;
                }

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
                if (modoGrupos) {
                    palpite.placarA = null;
                    palpite.placarB = null;
                    palpite.vencedor = null;
                    this.state.palpites[jogo.id] = palpite;
                    continue;
                }

                if (faseDesejada && this.normalizarFaseMataMata(jogo.fase) !== faseDesejada) {
                    palpite.placarA = null;
                    palpite.placarB = null;
                    palpite.vencedor = null;
                    this.state.palpites[jogo.id] = palpite;
                    continue;
                }

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

        if (!modoGrupos) {
            for (var f = 0; f < fases.length; f++) {
                var faseId = fases[f].id;
                var jogosFase = this.state.mataMataResolvido[faseId] || [];

                if (faseDesejada && faseId !== faseDesejada) {
                    continue;
                }

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
        }

        this.definirCampeaoFinal();
        if (opcoes.irParaResultado === false) {
            this.state.etapaAtual = modoGrupos ? 'grupos' : 'mata_mata';
        } else if (modoGrupos) {
            this.state.etapaAtual = 'grupos';
        } else if (modoMataMata) {
            this.state.etapaAtual = 'mata_mata';
        } else {
            this.state.etapaAtual = 'resultado';
        }

        if (this.state.etapaAtual === 'grupos') {
            this.state.rodadaAtual = rodadaDesejada || 1;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            this.state.faseMataMataAtual = faseDesejada || (this.state.fasesMataMataDisponiveis.length
                ? this.state.fasesMataMataDisponiveis[0].id
                : 'round_32');
        }

        this.renderizarEtapa();
        this.salvarEstadoLocalStorage();

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
                console.error('Erro ao enviar o registro:', xhr.responseText || xhr);
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
            privateDocument: false,
            publicDocument: true,
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
                console.error('Erro ao criar o registro:', xhr.responseText || xhr);
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

    googleDriveConfigurado: function () {
        return !!(this.authConfig &&
            this.authConfig.googleDriveClientId &&
            this.authConfig.googleDriveFolderId);
    },

    gerarNomeArquivoDrive: function () {
        return this.gerarNomeArquivoExcelBolao();
    },

    converterWorkbookParaBlob: function (workbook) {
        var arrayBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        return new Blob([arrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    },

    gerarNomeArquivoExcelBolao: function () {
        var nome = this.state.participante && this.state.participante.nome
            ? this.state.participante.nome
            : 'participante';

        var nomeSanitizado = String(nome)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toUpperCase();

        if (!nomeSanitizado) {
            nomeSanitizado = 'PARTICIPANTE';
        }

        var data = new Date();
        var dataResultado = data.getFullYear().toString() +
            '-' +
            String(data.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(data.getDate()).padStart(2, '0');

        return nomeSanitizado + '_' + dataResultado + '-RESULTADO.xlsx';
    },

    montarWorkbookBolao: function (documentId) {
        if (typeof XLSX === 'undefined') {
            return null;
        }

        var registro = this.montarRegistroFinalGED();
        var workbook = XLSX.utils.book_new();
        var dataEnvio = registro.dataEnvio || new Date().toISOString();
        var participante = registro.participante || {};
        var nomeParticipante = participante.nome || this.state.participante.nome || '';
        var metas = {
            serverURL: registro.metadadosFluig ? registro.metadadosFluig.serverURL : '',
            userCode: registro.metadadosFluig ? registro.metadadosFluig.userCode : '',
            userLogin: registro.metadadosFluig ? registro.metadadosFluig.userLogin : '',
            widget: registro.metadadosFluig ? registro.metadadosFluig.widget : 'bolao_copa_2026',
            documentId: documentId || ''
        };

        var wsResumo = XLSX.utils.aoa_to_sheet([
            ['Campo', 'Valor'],
            ['Tipo de registro', registro.tipoRegistro],
            ['Versão', registro.versaoRegistro],
            ['Data de envio', dataEnvio],
            ['Nome', participante.nome || ''],
            ['E-mail', participante.email || ''],
            ['Telefone', participante.telefone || ''],
            ['Campeão previsto', registro.campeao ? registro.campeao.vencedorLabel : 'Não definido'],
            ['Total de jogos', registro.totais ? registro.totais.totalJogos : 0]
        ]);
        XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

        var palpitesRows = [[
            'Participante', 'Match ID', 'Fase', 'Grupo', 'Rodada', 'Time A', 'Time B',
            'Placar A', 'Placar B', 'Vencedor'
        ]];

        for (var i = 0; i < registro.palpites.length; i++) {
            var palpite = registro.palpites[i];
            palpitesRows.push([
                nomeParticipante,
                palpite.matchId,
                palpite.fase,
                palpite.grupo,
                palpite.rodada,
                palpite.timeA,
                palpite.timeB,
                palpite.placarA,
                palpite.placarB,
                palpite.vencedor
            ]);
        }

        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(palpitesRows), 'Palpites');

        var classificacaoRows = [[
            'Grupo', 'Posição', 'Seleção', 'Pontos', 'Jogos', 'Vitórias', 'Empates', 'Derrotas', 'Saldo'
        ]];

        for (var grupoId in registro.classificacao) {
            if (!registro.classificacao.hasOwnProperty(grupoId)) {
                continue;
            }

            var listaClassificacao = registro.classificacao[grupoId] || [];

            for (var pos = 0; pos < listaClassificacao.length; pos++) {
                var item = listaClassificacao[pos];
                classificacaoRows.push([
                    grupoId,
                    pos + 1,
                    item.nome,
                    item.pontos,
                    item.jogos,
                    item.vitorias,
                    item.empates,
                    item.derrotas,
                    item.saldo
                ]);
            }
        }

        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(classificacaoRows), 'Classificacao');

        var metadadosRows = [[
            'Campo', 'Valor'
        ]];

        for (var chave in metas) {
            if (!metas.hasOwnProperty(chave)) {
                continue;
            }

            metadadosRows.push([chave, metas[chave]]);
        }

        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(metadadosRows), 'Metadados');

        return workbook;
    },

    montarWorkbookDrive: function () {
        return this.montarWorkbookBolao();
    },

    uploadArquivoBolaoParaGED: function (fileBlob, fileName, callback) {
        var that = this;
        var baseUrl = this.authConfig.url || (typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '');

        var endpointUpload = baseUrl + '/api/public/2.0/contentfiles/upload/?fileName=' + encodeURIComponent(fileName);

        $.ajax({
            url: endpointUpload,
            type: 'POST',
            data: fileBlob,
            processData: false,
            contentType: 'application/octet-stream',
            headers: that.getOAuthData(endpointUpload, 'POST'),
            crossDomain: true,
            success: function () {
                that.criarDocumentoGED(fileName, callback);
            },
            error: function (xhr) {
                console.error('Erro ao enviar o arquivo:', xhr.responseText || xhr);
                callback(false, null, '', xhr);
            }
        });
    },

    publicarExcelBolaoNoFluig: function (fileBlob, fileName, callback) {
        this.uploadArquivoBolaoParaGED(fileBlob, fileName, callback);
    },

    inicializarGoogleDriveTokenClient: function () {
        if (this.googleDriveTokenClient || typeof window === 'undefined') {
            return !!this.googleDriveTokenClient;
        }

        if (
            typeof window.google === 'undefined' ||
            !window.google.accounts ||
            !window.google.accounts.oauth2 ||
            !this.authConfig.googleDriveClientId
        ) {
            return false;
        }

        this.googleDriveTokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: this.authConfig.googleDriveClientId,
            scope: this.authConfig.googleDriveScope || 'https://www.googleapis.com/auth/drive.file',
            callback: function () {}
        });

        return true;
    },

    obterAccessTokenGoogleDrive: function (callback) {
        var that = this;

        if (this.googleDriveAccessToken &&
            this.googleDriveTokenExpiry &&
            Date.now() < (this.googleDriveTokenExpiry - 60000)) {
            callback(null, this.googleDriveAccessToken);
            return;
        }

        var tentativas = 0;

        var tentar = function () {
            if (that.inicializarGoogleDriveTokenClient()) {
                that.googleDriveTokenClient.callback = function (response) {
                    if (!response) {
                        callback(new Error('Resposta vazia da autenticação Google.'));
                        return;
                    }

                    if (response.error) {
                        callback(new Error(response.error));
                        return;
                    }

                    that.googleDriveAccessToken = response.access_token;
                    that.googleDriveTokenExpiry = Date.now() + ((response.expires_in || 3600) * 1000);
                    callback(null, response.access_token);
                };

                that.googleDriveTokenClient.requestAccessToken({
                    prompt: that.googleDriveAccessToken ? '' : 'consent'
                });
                return;
            }

            tentativas += 1;

            if (tentativas > 20) {
                callback(new Error('Biblioteca de autenticação do Google não carregada.'));
                return;
            }

            setTimeout(tentar, 250);
        };

        tentar();
    },

    montarMultipartDrive: function (metadata, fileBlob, mimeType) {
        var boundary = '----BolaoCopa2026' + Date.now();
        var delimiter = '\r\n--' + boundary + '\r\n';
        var closeDelimiter = '\r\n--' + boundary + '--';

        return new Blob([
            delimiter,
            'Content-Type: application/json; charset=UTF-8\r\n\r\n',
            JSON.stringify(metadata),
            delimiter,
            'Content-Type: ' + mimeType + '\r\n\r\n',
            fileBlob,
            closeDelimiter
        ], {
            type: 'multipart/related; boundary=' + boundary
        });
    },

    uploadPlanilhaGoogleDrive: function (fileBlob, fileName, accessToken, callback) {
        var folderId = this.authConfig.googleDriveFolderId;
        var mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        var metadata = {
            name: fileName,
            parents: [folderId],
            mimeType: mimeType
        };

        var body = this.montarMultipartDrive(metadata, fileBlob, mimeType);
        var endpointUpload = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';

        $.ajax({
            url: endpointUpload,
            type: 'POST',
            data: body,
            processData: false,
            contentType: body.type,
            headers: {
                Authorization: 'Bearer ' + accessToken
            },
            crossDomain: true,
            success: function (response) {
                callback(true, response && response.id ? response.id : null, response && response.webViewLink ? response.webViewLink : '', response);
            },
            error: function (xhr) {
                callback(false, null, '', xhr);
            }
        });
    },

    converterBlobParaBase64: function (blob, callback) {
        if (typeof FileReader === 'undefined') {
            callback(new Error('Leitura de arquivo indisponível.'));
            return;
        }

        var reader = new FileReader();

        reader.onloadend = function () {
            var resultado = reader.result || '';
            var base64 = String(resultado).indexOf(',') >= 0
                ? String(resultado).split(',')[1]
                : String(resultado);

            callback(null, base64);
        };

        reader.onerror = function () {
            callback(new Error('Falha ao converter a planilha para envio.'));
        };

        reader.readAsDataURL(blob);
    },

    uploadPlanilhaDriveDataset: function (fileBlob, fileName, callback) {
        this.publicarExcelBolaoNoFluig(fileBlob, fileName, callback);
    },

    salvarResultadoDrive: function () {
        return this.salvarResultadoExcelFluig();
    },

    salvarRegistroGED: function () {
        return this.salvarResultadoExcelFluig();
    },

    finalizarEnvioResultado: function () {
        this.limparEstadoLocalStorage();
        this.state.etapaAtual = 'enviado';
        this.renderizarEtapa();
    },

    iniciarNovaSimulacao: function () {
        this.limparEstadoLocalStorage();

        this.state.etapaAtual = 'dados';
        this.state.rodadaAtual = 1;
        this.state.faseMataMataAtual = 'round_32';
        this.state.fasesMataMataDisponiveis = [];
        this.state.participante = {
            nome: '',
            email: '',
            telefone: ''
        };
        this.state.classificacao = {};
        this.state.melhoresTerceiros = [];
        this.state.classificados = [];
        this.state.mapaClassificados = {};
        this.state.mataMata = {};
        this.state.mataMataResolvido = {};
        this.state.campeao = null;
        this.state.documentoGED = null;

        this.inicializarDadosCopa();
        this.renderizarEtapa();
        this.atualizarSidebar();
    },

    obterPayloadEmailBolao: function (linkDocumento, documentId, fileName) {
        return {
            destinatario: this.authConfig.emailResponsavelBolao || '',
            nomeParticipante: this.state.participante.nome || '',
            emailParticipante: this.state.participante.email || '',
            telefoneParticipante: this.state.participante.telefone || '',
            campeaoPrevisto: this.state.campeao && this.state.campeao.vencedorLabel
                ? this.state.campeao.vencedorLabel
                : '',
            linkDocumento: linkDocumento || '',
            documentId: documentId || '',
            fileName: fileName || '',
            dataEnvio: new Date().toISOString()
        };
    },

    enviarEmailResponsavelBolao: function (linkDocumento, documentId, fileName, callback) {
        var datasetNames = [
            'DS_BOLAO_COPA_2026_ENVIO_EMAIL',
            'ds_bolao_copa_envio_email'
        ];
        var payload = this.obterPayloadEmailBolao(linkDocumento, documentId, fileName);

        if (!this.authConfig || !this.authConfig.emailResponsavelBolao || this.authConfig.emailResponsavelBolao === 'CONFIGURAR_EMAIL_RESPONSAVEL') {
            callback(false, {
                message: 'Configuração de e-mail pendente.'
            });
            return;
        }

        if (typeof DatasetFactory === 'undefined' || typeof DatasetFactory.getDataset !== 'function') {
            this.enviarEmailResponsavelBolaoViaAjax(datasetNames, payload, callback);
            return;
        }

        try {
            var constraints = [];

            if (typeof DatasetFactory.createConstraint === 'function') {
                constraints.push(DatasetFactory.createConstraint('payload', JSON.stringify(payload), JSON.stringify(payload), 1));
                constraints.push(DatasetFactory.createConstraint('destinatario', payload.destinatario, payload.destinatario, 1));
                constraints.push(DatasetFactory.createConstraint('nomeParticipante', payload.nomeParticipante, payload.nomeParticipante, 1));
                constraints.push(DatasetFactory.createConstraint('emailParticipante', payload.emailParticipante, payload.emailParticipante, 1));
                constraints.push(DatasetFactory.createConstraint('telefoneParticipante', payload.telefoneParticipante, payload.telefoneParticipante, 1));
                constraints.push(DatasetFactory.createConstraint('campeaoPrevisto', payload.campeaoPrevisto, payload.campeaoPrevisto, 1));
                constraints.push(DatasetFactory.createConstraint('linkDocumento', payload.linkDocumento, payload.linkDocumento, 1));
                constraints.push(DatasetFactory.createConstraint('documentId', payload.documentId, payload.documentId, 1));
                constraints.push(DatasetFactory.createConstraint('fileName', payload.fileName, payload.fileName, 1));
                constraints.push(DatasetFactory.createConstraint('dataEnvio', payload.dataEnvio, payload.dataEnvio, 1));
                constraints.push(DatasetFactory.createConstraint('emailContato', payload.destinatario, payload.destinatario, 1));
                constraints.push(DatasetFactory.createConstraint('nomeContato', payload.nomeParticipante, payload.nomeParticipante, 1));
                constraints.push(DatasetFactory.createConstraint('empresa', payload.emailParticipante, payload.emailParticipante, 1));
                constraints.push(DatasetFactory.createConstraint('scoreFinal', payload.documentId, payload.documentId, 1));
                constraints.push(DatasetFactory.createConstraint('maturidade', payload.campeaoPrevisto, payload.campeaoPrevisto, 1));
                constraints.push(DatasetFactory.createConstraint('linkPdfPublico', payload.linkDocumento, payload.linkDocumento, 1));
            }

            var primeiroRegistro = null;
            var ultimoErro = null;

            for (var i = 0; i < datasetNames.length; i++) {
                try {
                    var dataset = DatasetFactory.getDataset(datasetNames[i], null, constraints, null);

                    if (dataset && dataset.values && dataset.values.length) {
                        primeiroRegistro = dataset.values[0];
                    } else if (dataset && dataset.length && dataset.length > 0) {
                        primeiroRegistro = dataset[0];
                    }

                    if (primeiroRegistro) {
                        break;
                    }
                } catch (erroDataset) {
                    ultimoErro = erroDataset;
                }
            }

            if (!primeiroRegistro) {
                callback(false, {
                    message: ultimoErro && ultimoErro.message
                        ? ultimoErro.message
                        : 'Dataset de e-mail não retornou resposta.'
                });
                return;
            }

            var sucesso = String(primeiroRegistro.success || primeiroRegistro.SUCESSO || primeiroRegistro.sucesso || '').toLowerCase();
            var envioOk = sucesso === 'true' || sucesso === '1' || sucesso === 'sim';
            var mensagem = primeiroRegistro.message || primeiroRegistro.MENSAGEM || primeiroRegistro.mensagem || '';

            console.log('Retorno dataset e-mail bolão:', primeiroRegistro);

            callback(envioOk, primeiroRegistro, mensagem);
        } catch (e) {
            this.enviarEmailResponsavelBolaoViaAjax(datasetNames, payload, callback);
        }
    },

    limparEstadoLocalStorage: function () {
        var chave = this.obterChaveLocalStorage();

        if (!chave) {
            return;
        }

        try {
            window.localStorage.removeItem(chave);
        } catch (erro) {
            console.warn('Não foi possível limpar o estado salvo localmente.', erro);
        }
    },

    enviarEmailResponsavelBolaoViaAjax: function (datasetNames, payload, callback) {
        var that = this;
        var baseUrl = this.authConfig.url || (typeof WCMAPI !== 'undefined' ? WCMAPI.getServerURL() : '');
        var endpoint = baseUrl + '/api/public/ecm/dataset/datasets';
        var requestBody = {
            name: datasetNames[0],
            fields: [
                'success',
                'message',
                'recipient',
                'subject',
                'sentAt',
                'debugPayload'
            ],
            constraints: [
                {
                    _field: 'payload',
                    _initialValue: JSON.stringify(payload),
                    _finalValue: JSON.stringify(payload),
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'destinatario',
                    _initialValue: payload.destinatario,
                    _finalValue: payload.destinatario,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'nomeParticipante',
                    _initialValue: payload.nomeParticipante,
                    _finalValue: payload.nomeParticipante,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'emailParticipante',
                    _initialValue: payload.emailParticipante,
                    _finalValue: payload.emailParticipante,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'telefoneParticipante',
                    _initialValue: payload.telefoneParticipante,
                    _finalValue: payload.telefoneParticipante,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'campeaoPrevisto',
                    _initialValue: payload.campeaoPrevisto,
                    _finalValue: payload.campeaoPrevisto,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'linkDocumento',
                    _initialValue: payload.linkDocumento,
                    _finalValue: payload.linkDocumento,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'documentId',
                    _initialValue: payload.documentId,
                    _finalValue: payload.documentId,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'fileName',
                    _initialValue: payload.fileName,
                    _finalValue: payload.fileName,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'dataEnvio',
                    _initialValue: payload.dataEnvio,
                    _finalValue: payload.dataEnvio,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'emailContato',
                    _initialValue: payload.destinatario,
                    _finalValue: payload.destinatario,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'nomeContato',
                    _initialValue: payload.nomeParticipante,
                    _finalValue: payload.nomeParticipante,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'empresa',
                    _initialValue: payload.emailParticipante,
                    _finalValue: payload.emailParticipante,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'scoreFinal',
                    _initialValue: payload.documentId,
                    _finalValue: payload.documentId,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'maturidade',
                    _initialValue: payload.campeaoPrevisto,
                    _finalValue: payload.campeaoPrevisto,
                    _type: 1,
                    _likeSearch: false
                },
                {
                    _field: 'linkPdfPublico',
                    _initialValue: payload.linkDocumento,
                    _finalValue: payload.linkDocumento,
                    _type: 1,
                    _likeSearch: false
                }
            ],
            order: []
        };

        $.ajax({
            url: endpoint,
            type: 'POST',
            data: JSON.stringify(requestBody),
            contentType: 'application/json',
            headers: that.getOAuthData(endpoint, 'POST'),
            crossDomain: true,
            success: function (response) {
                var dataset = response && response.content ? response.content : response;
                var primeiroRegistro = null;

                if (dataset && dataset.values && dataset.values.length) {
                    primeiroRegistro = dataset.values[0];
                } else if (dataset && dataset.rows && dataset.rows.length) {
                    primeiroRegistro = dataset.rows[0];
                } else if (dataset && dataset.data && dataset.data.length) {
                    primeiroRegistro = dataset.data[0];
                }

                if (!primeiroRegistro) {
                    callback(false, {
                        message: 'Dataset de e-mail não retornou resposta.'
                    });
                    return;
                }

                var sucesso = String(primeiroRegistro.success || primeiroRegistro.SUCESSO || primeiroRegistro.sucesso || '').toLowerCase();
                var envioOk = sucesso === 'true' || sucesso === '1' || sucesso === 'sim';
                var mensagem = primeiroRegistro.message || primeiroRegistro.MENSAGEM || primeiroRegistro.mensagem || '';

                console.log('Retorno dataset e-mail bolão:', primeiroRegistro);

                callback(envioOk, primeiroRegistro, mensagem);
            },
            error: function (xhr) {
                callback(false, {
                    message: xhr && xhr.responseText ? xhr.responseText : 'Falha ao consultar dataset de e-mail.'
                });
            }
        });
    },

    salvarResultadoExcelFluig: function () {
        var that = this;

        if (!this.authConfig || !this.authConfig.gedFolderId || parseInt(this.authConfig.gedFolderId, 10) <= 0) {
            this.exibirMensagem(
                'warning',
                'Configuração pendente',
                'Algumas informações necessárias para salvar ainda não foram configuradas.'
            );

            console.log('Registro preparado:', this.montarRegistroFinalGED());
            return;
        }

        if (typeof XLSX === 'undefined') {
            this.exibirMensagem(
                'warning',
                'Planilha indisponível',
                'A biblioteca necessária para gerar a planilha ainda não foi carregada.'
            );
            return;
        }

        if (!this.oauthConfigurado()) {
            this.exibirMensagem(
                'warning',
                'Configuração pendente',
                'Algumas informações necessárias para salvar ainda não foram configuradas.'
            );

            console.log('Registro preparado:', this.montarRegistroFinalGED());
            return;
        }

        var loading = null;

        if (typeof FLUIGC !== 'undefined' && FLUIGC.loading) {
            loading = FLUIGC.loading(window, {
                textMessage: 'Salvando bolão...',
                title: 'Aguarde'
            });
            loading.show();
        }

        var registro = this.montarRegistroFinalGED();
        var fileName = this.gerarNomeArquivoExcelBolao();
        var workbook = this.montarWorkbookBolao();
        var fileBlob = workbook ? this.converterWorkbookParaBlob(workbook) : null;

        if (!fileBlob) {
            if (loading) {
                loading.hide();
            }

            this.exibirMensagem(
                'danger',
                'Erro ao gerar planilha',
                'Não foi possível preparar a planilha do bolão agora.'
            );

            return;
        }

        this.publicarExcelBolaoNoFluig(fileBlob, fileName, function (sucesso, documentId, linkDocumento, response) {
            if (!sucesso) {
                if (loading) {
                    loading.hide();
                }

                that.exibirMensagem(
                    'danger',
                    'Erro ao salvar',
                    'Não foi possível salvar o bolão agora. Tente novamente.'
                );

                console.error('Falha ao salvar o registro:', response);
                return;
            }

            that.state.documentoGED = {
                documentId: documentId,
                link: linkDocumento,
                fileName: fileName,
                dataSalvamento: new Date().toISOString(),
                tipoArquivo: 'xlsx'
            };

            that.enviarEmailResponsavelBolao(linkDocumento, documentId, fileName, function (emailOk, emailResponse) {
                if (loading) {
                    loading.hide();
                }

                if (!emailOk) {
                    that.exibirMensagem(
                        'warning',
                        'Bolão salvo',
                        'O bolão foi salvo, mas não foi possível enviar o e-mail automaticamente.'
                    );
                    console.warn('Falha ao enviar e-mail do bolão:', emailResponse);
                } else {
                    that.exibirMensagem(
                        'success',
                        'Bolão salvo',
                        'O resultado foi salvo com sucesso e a solicitação de e-mail foi enviada ao Fluig.'
                    );
                }

                that.finalizarEnvioResultado();
            });
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
        var jogoResolvido = this.obterJogoMataMataResolvidoPorId(jogo.id) || jogo;
        var palpite = this.state.palpites[jogo.id] || {};
        var timeA = this.obterDadosExibicaoMataMata(
            jogoResolvido.timeAResolvido !== undefined ? jogoResolvido.timeAResolvido : palpite.timeAResolvido,
            jogoResolvido.timeA
        );
        var timeB = this.obterDadosExibicaoMataMata(
            jogoResolvido.timeBResolvido !== undefined ? jogoResolvido.timeBResolvido : palpite.timeBResolvido,
            jogoResolvido.timeB
        );

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
        html += '           <div class="bolao-knockout-team-main">';
        html += '               <img class="bolao-flag" src="' + this.escaparHtml(timeA.bandeira) + '" alt="' + this.escaparHtml(timeA.alt) + '" onerror="this.onerror=null;this.src=\'' + this.obterPlaceholderBandeira() + '\'">';
        html += '               <div class="bolao-knockout-team-text">';
        html += '                   <span class="bolao-knockout-team-name" title="' + this.escaparHtml(timeA.nome) + '">' + this.escaparHtml(timeA.nome) + '</span>';
        if (timeA.legenda) {
            html += '                   <span class="bolao-knockout-team-origin" title="' + this.escaparHtml(timeA.legenda) + '">' + this.escaparHtml(timeA.legenda) + '</span>';
        }
        html += '               </div>';
        html += '           </div>';
        html += '       </div>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="A" value="' + placarA + '">';

        html += '       <span class="bolao-versus">x</span>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="B" value="' + placarB + '">';

        html += '       <div class="bolao-knockout-team away bolao-knockout-slot">';
        html += '           <div class="bolao-knockout-team-main">';
        html += '               <img class="bolao-flag" src="' + this.escaparHtml(timeB.bandeira) + '" alt="' + this.escaparHtml(timeB.alt) + '" onerror="this.onerror=null;this.src=\'' + this.obterPlaceholderBandeira() + '\'">';
        html += '               <div class="bolao-knockout-team-text">';
        html += '                   <span class="bolao-knockout-team-name" title="' + this.escaparHtml(timeB.nome) + '">' + this.escaparHtml(timeB.nome) + '</span>';
        if (timeB.legenda) {
            html += '                   <span class="bolao-knockout-team-origin" title="' + this.escaparHtml(timeB.legenda) + '">' + this.escaparHtml(timeB.legenda) + '</span>';
        }
        html += '               </div>';
        html += '           </div>';
        html += '       </div>';

        html += '   </div>';

        html += this.renderizarAreaVencedorMataMata(jogo, palpite);

        html += '</article>';

        return html;
    },

    renderizarAreaVencedorMataMata: function (jogo, palpite) {
        var jogoResolvido = this.obterJogoMataMataResolvidoPorId(jogo.id) || jogo;
        if (
            palpite.placarA === null ||
            palpite.placarB === null ||
            palpite.placarA === undefined ||
            palpite.placarB === undefined
        ) {
            return '';
        }

        var nomeTimeA = this.obterNomeExibicaoMataMata(
            jogoResolvido.timeAResolvido !== undefined ? jogoResolvido.timeAResolvido : palpite.timeAResolvido,
            jogoResolvido.timeA
        );
        var nomeTimeB = this.obterNomeExibicaoMataMata(
            jogoResolvido.timeBResolvido !== undefined ? jogoResolvido.timeBResolvido : palpite.timeBResolvido,
            jogoResolvido.timeB
        );
        var valorTimeA = jogoResolvido.timeAResolvido || palpite.timeAResolvido || jogoResolvido.timeA;
        var valorTimeB = jogoResolvido.timeBResolvido || palpite.timeBResolvido || jogoResolvido.timeB;

        var html = '';

        html += '<div class="bolao-winner-area">';

        if (palpite.placarA !== palpite.placarB && palpite.vencedor) {
            var vencedorLabel = palpite.vencedor === valorTimeA || palpite.vencedor === jogoResolvido.timeA
                ? nomeTimeA
                : nomeTimeB;

            html += '<span class="bolao-winner-badge">';
            html += 'Classificado: ' + this.escaparHtml(vencedorLabel);
            html += '</span>';

            html += '</div>';
            return html;
        }

        html += '<div class="bolao-winner-options">';
        html += '   <button type="button" class="bolao-winner-btn ' + (palpite.vencedor === valorTimeA ? 'active' : '') + '" data-match-id="' + this.escaparHtml(jogo.id) + '" data-vencedor="' + this.escaparHtml(valorTimeA) + '">';
        html += '       Classificar ' + this.escaparHtml(nomeTimeA);
        html += '   </button>';

        html += '   <button type="button" class="bolao-winner-btn ' + (palpite.vencedor === valorTimeB ? 'active' : '') + '" data-match-id="' + this.escaparHtml(jogo.id) + '" data-vencedor="' + this.escaparHtml(valorTimeB) + '">';
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
        this.prepararMataMataFases();

        var scrollAtual = typeof window !== 'undefined' && typeof $ !== 'undefined'
            ? $(window).scrollTop()
            : null;

        this.renderizarEtapa();
        this.salvarEstadoLocalStorage();

        if (scrollAtual !== null) {
            $(window).scrollTop(scrollAtual);
        }
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

    obterNomeSelecaoOuSlot: function (valor) {
        if (!valor) {
            return 'A definir';
        }

        var selecao = this.state.selecoes && this.state.selecoes[valor];

        if (selecao && selecao.nome) {
            return selecao.nome;
        }

        return this.formatarSlotMataMata(valor);
    },

    obterNomeExibicaoMataMata: function (slotResolvido, slotOriginal) {
        return this.obterNomeSelecaoOuSlot(slotResolvido || slotOriginal);
    },

    formatarLegendaOrigemMataMata: function (slotOriginal) {
        if (!slotOriginal) {
            return '';
        }

        var texto = String(slotOriginal).trim();
        var matchWinner = texto.match(/^W(\d+)$/i);
        var matchLoser = texto.match(/^L(\d+)$/i);

        if (matchWinner) {
            return 'Vencedor M' + matchWinner[1];
        }

        if (matchLoser) {
            return 'Perdedor M' + matchLoser[1];
        }

        if (/^VENCEDOR\s+/i.test(texto)) {
            return 'Vencedor ' + texto.replace(/^VENCEDOR\s+/i, '');
        }

        if (/^GANHADOR\s+/i.test(texto)) {
            return 'Vencedor ' + texto.replace(/^GANHADOR\s+/i, '');
        }

        if (/^PERDEDOR\s+/i.test(texto)) {
            return 'Perdedor ' + texto.replace(/^PERDEDOR\s+/i, '');
        }

        return this.formatarSlotMataMata(texto);
    },

    obterDadosExibicaoMataMata: function (slotResolvido, slotOriginal) {
        var valor = slotResolvido || slotOriginal;
        var selecao = this.state.selecoes && this.state.selecoes[valor]
            ? this.state.selecoes[valor]
            : null;
        var nome = this.obterNomeSelecaoOuSlot(valor);

        return {
            nome: nome,
            legenda: this.formatarLegendaOrigemMataMata(slotOriginal || valor),
            bandeira: this.obterUrlBandeira(selecao),
            alt: selecao && selecao.nome ? selecao.nome : nome
        };
    },

    obterRodadasGruposDisponiveis: function () {
        var rodadas = [];
        var mapa = {};

        for (var i = 0; i < this.state.jogos.length; i++) {
            var jogo = this.state.jogos[i];

            if (jogo.fase !== 'grupos') {
                continue;
            }

            var rodada = parseInt(jogo.rodada, 10);

            if (!rodada || mapa[rodada]) {
                continue;
            }

            mapa[rodada] = true;
            rodadas.push(rodada);
        }

        rodadas.sort(function (a, b) {
            return a - b;
        });

        return rodadas;
    },

    obterProximaRodadaGrupos: function () {
        var rodadas = this.obterRodadasGruposDisponiveis();
        var rodadaAtual = parseInt(this.state.rodadaAtual, 10) || 1;

        for (var i = 0; i < rodadas.length; i++) {
            if (rodadas[i] > rodadaAtual) {
                return rodadas[i];
            }
        }

        return null;
    },

    validarRodadaGruposCompleta: function (rodada) {
        var jogosRodada = this.state.jogos.filter(function (jogo) {
            return jogo.fase === 'grupos' && parseInt(jogo.rodada, 10) === parseInt(rodada, 10);
        });
        var jogosPendentes = [];

        for (var i = 0; i < jogosRodada.length; i++) {
            var jogo = jogosRodada[i];
            var palpite = this.state.palpites[jogo.id];

            if (!palpite || palpite.placarA === null || palpite.placarB === null) {
                jogosPendentes.push(jogo.id);
            }
        }

        if (!jogosPendentes.length) {
            return true;
        }

        this.exibirMensagem(
            'warning',
            'Rodada incompleta',
            'Preencha todos os placares da rodada ' + rodada + ' antes de continuar.'
        );

        this.state.rodadaAtual = rodada || 1;
        this.renderizarEtapa();
        this.destacarJogosPendentes(jogosPendentes);

        return false;
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
            var proximaRodada = this.obterProximaRodadaGrupos();

            $btnVoltar.prop('disabled', false);
            $btnAvancar.text(proximaRodada ? 'Próxima rodada' : 'Avançar para mata-mata');
            return;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            $btnVoltar.prop('disabled', false);
            $btnAvancar.text(this.obterConfigFaseMataMata(this.state.faseMataMataAtual).proximoBotao || 'Avançar');
            return;
        }

        if (this.state.etapaAtual === 'resultado') {
            $btnVoltar.prop('disabled', false);
            $btnAvancar.text('Enviar resultado');
            this.atualizarControlesMobile();
            return;
        }

        if (this.state.etapaAtual === 'enviado') {
            $btnVoltar.prop('disabled', true);
            $btnAvancar.text('Iniciar nova simulação');
        }

        this.atualizarControlesMobile();
    },

    avancarEtapa: function () {
        if (this.state.etapaAtual === 'dados') {
            if (!this.validarDadosParticipante()) {
                return;
            }

            this.state.etapaAtual = 'grupos';
            this.state.rodadaAtual = 1;
            this.renderizarEtapa();
            this.salvarEstadoLocalStorage();

            this.exibirMensagem(
                'success',
                'Dados preenchidos',
                'Agora preencha os placares da fase de grupos.'
            );

            return;
        }

        if (this.state.etapaAtual === 'grupos') {
            var proximaRodada = this.obterProximaRodadaGrupos();

            if (proximaRodada) {
                if (!this.validarRodadaGruposCompleta(this.state.rodadaAtual || 1)) {
                    return;
                }

                this.state.rodadaAtual = proximaRodada;
                this.renderizarEtapa();
                this.salvarEstadoLocalStorage();
                this.rolarParaTopoDaEtapa(this.getSeletor('bolaoConteudo') + ' .bolao-group-card:first');

                this.exibirMensagem(
                    'success',
                    'Rodada concluída',
                    'Agora preencha os jogos da rodada ' + proximaRodada + '.'
                );

                return;
            }

            if (!this.validarFaseGruposCompleta()) {
                return;
            }

            this.prepararMataMata();

            this.state.etapaAtual = 'mata_mata';
            this.state.faseMataMataAtual = 'round_32';
            this.renderizarEtapa();
            this.salvarEstadoLocalStorage();
            this.rolarParaTopoDaEtapa(this.getSeletor('bolaoConteudo') + ' .bolao-knockout-section:first');

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
                this.salvarEstadoLocalStorage();
                this.rolarParaTopoDaEtapa(this.getSeletor('bolaoConteudo') + ' .bolao-knockout-section:first');

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
            this.salvarEstadoLocalStorage();

            this.exibirMensagem(
                'success',
                'Bolão finalizado',
                'Todos os palpites foram preenchidos.'
            );

            return;
        }

        if (this.state.etapaAtual === 'resultado') {
            this.salvarResultadoDrive();
            return;
        }

        if (this.state.etapaAtual === 'enviado') {
            this.iniciarNovaSimulacao();
            return;
        }
    },
});

