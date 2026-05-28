var WidgetBolaoCopa2026 = SuperWidget.extend({
    instanceId: null,

    state: {
        etapaAtual: 'dados',
        rodadaAtual: 1,
        faseMataMataAtual: 'round_32',

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
        campeao: null
    },

    init: function () {
        this.instanceId = this.instanceId || this.getInstanceIdByElement();

        this.inicializarDadosCopa();

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
            .off('click', '.bolao-copa-widget .bolao-round-tab')
            .on('click', '.bolao-copa-widget .bolao-round-tab', function () {
                var rodada = parseInt($(this).data('rodada'), 10);
                that.state.rodadaAtual = rodada;
                that.renderizarEtapa();
            });

        $(document)
            .off('input', '.bolao-copa-widget .bolao-score-input')
            .on('input', '.bolao-copa-widget .bolao-score-input', function () {
                that.atualizarPlacarGrupo($(this));
            });

        $(document)
            .off('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-winner-btn')
            .on('click', '#WidgetBolaoCopa2026_' + this.instanceId + ' .bolao-winner-btn', function () {
                that.atualizarVencedorMataMata($(this));
            });
    },

    renderizarFaseGrupos: function () {
        this.calcularTodasClassificacoes();

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
        html += '       <span class="bolao-match-id">' + this.escaparHtml(jogo.id) + '</span>';
        html += '       <span>' + this.formatarDataJogo(jogo.data) + ' • ' + this.escaparHtml(jogo.hora || '') + '</span>';
        html += '   </div>';

        html += '   <div class="bolao-match-teams">';

        html += '       <div class="bolao-team home">';
        html += '           <img class="bolao-flag" src="' + this.obterUrlBandeira(selecaoA) + '" alt="' + this.escaparHtml(selecaoA.nome) + '">';
        html += '           <span class="bolao-team-name" title="' + this.escaparHtml(selecaoA.nome) + '">' + this.escaparHtml(selecaoA.nome) + '</span>';
        html += '       </div>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="A" value="' + placarA + '">';

        html += '       <span class="bolao-versus">x</span>';

        html += '       <input type="number" min="0" max="99" class="bolao-score-input" data-match-id="' + this.escaparHtml(jogo.id) + '" data-lado="B" value="' + placarB + '">';

        html += '       <div class="bolao-team away">';
        html += '           <span class="bolao-team-name" title="' + this.escaparHtml(selecaoB.nome) + '">' + this.escaparHtml(selecaoB.nome) + '</span>';
        html += '           <img class="bolao-flag" src="' + this.obterUrlBandeira(selecaoB) + '" alt="' + this.escaparHtml(selecaoB.nome) + '">';
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

    atualizarSidebar: function () {
        var nome = this.state.participante.nome && this.state.participante.nome.trim()
            ? this.state.participante.nome.trim()
            : 'Ainda não informado';

        $(this.getSeletor('bolaoNomeParticipante')).text(nome);

        if (!this.state.classificacao || Object.keys(this.state.classificacao).length === 0) {
            $(this.getSeletor('bolaoSidebarClassificacao')).html(
                '<p class="bolao-empty-message">A classificação aparecerá após preencher os jogos.</p>'
            );
            return;
        }

        var html = '';

        for (var grupoId in this.state.classificacao) {
            if (!this.state.classificacao.hasOwnProperty(grupoId)) {
                continue;
            }

            var classificacao = this.state.classificacao[grupoId];

            html += '<div class="bolao-sidebar-group">';
            html += '   <h5>Grupo ' + this.escaparHtml(grupoId) + '</h5>';

            for (var i = 0; i < classificacao.length; i++) {
                var item = classificacao[i];
                var classe = i < 2 ? ' classificado' : '';

                html += '   <div class="bolao-sidebar-team' + classe + '">';
                html += '       <span>' + (i + 1) + '. ' + this.escaparHtml(item.nome) + '</span>';
                html += '       <strong>' + item.pontos + ' pts</strong>';
                html += '   </div>';
            }

            html += '</div>';
        }

        $(this.getSeletor('bolaoSidebarClassificacao')).html(html);
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
        var basePath = '/resources/images/bandeiras/';

        if (this.state.dadosCopa && this.state.dadosCopa.bandeirasBasePath) {
            basePath = this.state.dadosCopa.bandeirasBasePath;
        }

        if (!selecao || !selecao.bandeira) {
            return basePath + 'placeholder.svg';
        }

        return basePath + selecao.bandeira;
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

        this.atualizarCabecalho();
        this.atualizarBotoes();
        this.atualizarMenuEtapas();
        this.atualizarSidebar();
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

        html += '   <span class="bolao-helper">';
        html += '       Nesta primeira versão, os dados ficam apenas na tela. Depois vamos preparar o salvamento da simulação no Fluig.';
        html += '   </span>';

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
            $(this.getSeletor('bolaoEtapaLabel')).text('Etapa 3 de 4');
            $(this.getSeletor('bolaoEtapaTitulo')).text('Mata-mata');
            $(this.getSeletor('bolaoEtapaDescricao')).text('Confira os classificados e preencha os resultados da primeira fase eliminatória.');
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
            $btnAvancar.text('Confirmar primeira fase');
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

            this.exibirMensagem(
                'success',
                'Primeira fase preenchida',
                'No próximo passo vamos avançar os vencedores para as oitavas.'
            );

            console.log('Palpites do mata-mata:', this.state.palpites);
        }
    },

    voltarEtapa: function () {
        if (this.state.etapaAtual === 'grupos') {
            this.state.etapaAtual = 'dados';
            this.renderizarEtapa();
            return;
        }

        if (this.state.etapaAtual === 'mata_mata') {
            this.state.etapaAtual = 'grupos';
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

    renderizarMataMata: function () {
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
                html += '           <img class="bolao-flag" src="' + this.obterUrlBandeira(selecao) + '" alt="' + this.escaparHtml(selecao.nome) + '">';
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
            html += '               <img class="bolao-flag" src="' + this.obterUrlBandeira(selecao) + '" alt="' + this.escaparHtml(selecao.nome) + '">';
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