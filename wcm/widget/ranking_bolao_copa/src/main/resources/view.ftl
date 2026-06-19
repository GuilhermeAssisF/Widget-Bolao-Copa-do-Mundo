<script type="text/javascript" src="/webdesk/vcXMLRPC.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
<script type="text/javascript" src="/ranking_bolao_copa/resources/js/oauth-1.0a.js"></script>
<#--
    Carregamento server-side dos resultados.
    Motivo: em alguns ambientes Fluig a API REST pública de datasets não aceita POST
    e o DatasetFactory pode não ficar disponível no navegador em páginas WCM.
    Aqui o dataset é consultado enquanto o FTL é renderizado e o JSON é entregue
    ao JS como string segura.
-->
<#assign rankingResultadosDatasetJson = "">
<#assign rankingResultadosDatasetStatus = "nao_consultado">
<#attempt>
    <#assign rankingResultadosDataset = DatasetFactory.getDataset("ds_bolao_copa_resultados_api", null, null, null)>
    <#if rankingResultadosDataset?? && rankingResultadosDataset.values?? && (rankingResultadosDataset.values?size > 0)>
        <#assign rankingPrimeiraLinha = rankingResultadosDataset.values[0]>
        <#assign rankingResultadosDatasetJson = rankingPrimeiraLinha["json"]!rankingPrimeiraLinha["JSON"]!rankingPrimeiraLinha["response"]!rankingPrimeiraLinha["RESPONSE"]!"">
        <#assign rankingResultadosDatasetStatus = "carregado">
    <#else>
        <#assign rankingResultadosDatasetStatus = "sem_linhas">
    </#if>
<#recover>
    <#assign rankingResultadosDatasetJson = "">
    <#assign rankingResultadosDatasetStatus = "erro_ftl">
</#attempt>
<script type="text/javascript">
    window.BOLAO_RANKING_RESULTADOS_SERVER_JSON = "${rankingResultadosDatasetJson?js_string}";
    window.BOLAO_RANKING_RESULTADOS_SERVER_STATUS = "${rankingResultadosDatasetStatus?js_string}";
</script>

<div
    id="WidgetRankingBolaoCopa_${instanceId}"
    class="fluig-style-guide wcm-widget-class super-widget bolao-copa-widget bolao-ranking-widget"
    data-params="WidgetRankingBolaoCopa.instance()"
    data-ranking-base-url="/ranking_bolao_copa">

    <div class="bolao-wrapper">

        <aside class="bolao-sidebar">
            <div class="bolao-sidebar-brand">
                <div class="bolao-logo-mark bolao-worldcup-logo-box">
                    <img
                        class="bolao-logo-image bolao-worldcup-logo"
                        src="/ranking_bolao_copa/resources/images/logos/logo_copa_2026.png"
                        alt="Copa 2026" />
                </div>

                <div class="bolao-sidebar-brand-copy">
                    <h2>Bolão da Copa</h2>
                    <img
                        class="bolao-brand-interhativa bolao-interhativa-logo"
                        src="/ranking_bolao_copa/resources/images/logos/logo_interhativa_branca.png"
                        alt="Interhativa" />
                </div>

                <button
                    type="button"
                    class="bolao-sidebar-mobile-toggle"
                    id="btnRankingSidebarToggle_${instanceId}"
                    aria-label="Abrir menu da sidebar"
                    aria-expanded="false">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            <div class="bolao-sidebar-body" id="rankingSidebarBody_${instanceId}">
                <div class="bolao-user-card ranking-leader-card-original">
                    <span>Líder atual</span>
                    <strong id="rankingLiderNome_${instanceId}">Calculando...</strong>
                    <small id="rankingLiderPontos_${instanceId}">0 pontos</small>
                </div>

                <div class="bolao-sidebar-current-step">
                    <span class="bolao-eyebrow" id="rankingResumoLabel_${instanceId}">
                        Ranking oficial
                    </span>

                    <h3 id="rankingResumoTitulo_${instanceId}">
                        Classificação geral
                    </h3>

                    <p id="rankingResumoDescricao_${instanceId}">
                        Pontuação calculada automaticamente com base nos palpites carregados da planilha.
                    </p>
                </div>

                <div class="bolao-sidebar-section ranking-sidebar-stats-card">
                    <h4>Resumo</h4>

                    <div class="ranking-stat-row primeiro">
                        <span>Participantes</span>
                        <strong id="rankingTotalParticipantes_${instanceId}">0</strong>
                    </div>

                    <div class="ranking-stat-row segundo">
                        <span>Palpites</span>
                        <strong id="rankingTotalPalpites_${instanceId}">0</strong>
                    </div>

                    <div class="ranking-stat-row terceiro">
                        <span>Jogos finalizados</span>
                        <strong id="rankingJogosFinalizados_${instanceId}">0</strong>
                    </div>

                    <div class="ranking-stat-row quarto">
                        <span>Jogos ao vivo</span>
                        <strong id="rankingJogosAoVivo_${instanceId}">0</strong>
                    </div>
                </div>

                <div class="bolao-sidebar-section">
                    <h4>Navegação</h4>

                    <ul class="bolao-step-list ranking-nav-list">
                        <li class="active" data-ranking-nav="ranking">
                            <span>1</span>
                            Ranking geral
                        </li>

                        <li data-ranking-nav="participantes">
                            <span>2</span>
                            Participantes
                        </li>

                        <li data-ranking-nav="ao-vivo">
                            <span>3</span>
                            Jogo ao vivo
                        </li>

                        <li data-ranking-nav="detalhe">
                            <span>4</span>
                            Detalhe do participante
                        </li>
                    </ul>
                </div>

                <div class="bolao-sidebar-section ranking-sidebar-rules-card">
                    <h4>Pontuação</h4>
                    <div class="ranking-rule-line">
                        <span>Placar exato</span>
                        <strong>3 pts</strong>
                    </div>
                    <div class="ranking-rule-line">
                        <span>Vencedor/empate</span>
                        <strong>1 pt</strong>
                    </div>
                    <p>O ranking oficial considera apenas jogos finalizados.</p>
                </div>
            </div>
        </aside>

        <main class="bolao-main">
            <section class="bolao-hero bolao-main-summary">
                <div>
                    <span class="bolao-eyebrow">Resumo do ranking</span>
                    <h1>Ranking do Bolão</h1>
                    <p>Acompanhe a classificação geral, o jogo atual e os palpites individuais dos participantes.</p>
                </div>

                <div class="bolao-hero-badge ranking-hero-badge">
                    <span id="rankingPontosDistribuidos_${instanceId}">0</span>
                    <small>pontos distribuídos</small>
                </div>
            </section>

            <section
                id="rankingConteudo_${instanceId}"
                class="bolao-content ranking-content-shell">

                <div class="ranking-content-header">
                    <div>
                        <span class="bolao-eyebrow">Planilha carregada</span>
                        <h2>Ranking geral</h2>
                    </div>
                    <div class="ranking-content-actions" style="display:none;">
                        <button type="button" class="btn btn-default bolao-btn-secondary" id="btnRankingAtualizar_${instanceId}">
                            Atualizar ranking
                        </button>
                    </div>
                </div>

                <div class="ranking-live-strip" id="rankingLiveCard_${instanceId}"></div>

                <div class="ranking-panels-grid">
                    <section class="ranking-panel ranking-panel-ranking" id="rankingSecaoGeral_${instanceId}">
                        <div class="ranking-panel-header">
                            <div>
                                <span class="bolao-eyebrow">Classificação</span>
                                <h3>Ranking geral</h3>
                            </div>
                            <span class="ranking-chip" id="rankingTotalLinhas_${instanceId}">0 palpites</span>
                        </div>

                        <div class="ranking-table-wrap ranking-classificacao-wrap">
                            <div id="rankingTabelaBody_${instanceId}" class="ranking-classificacao-lista">
                                <div class="ranking-empty-card ranking-empty-cell">Carregando ranking...</div>
                            </div>
                        </div>
                    </section>

                    <section class="ranking-panel ranking-panel-participantes" id="rankingSecaoParticipantes_${instanceId}">
                        <div class="ranking-panel-header">
                            <div>
                                <span class="bolao-eyebrow">Consulta</span>
                                <h3>Participantes</h3>
                            </div>
                        </div>

                        <div id="rankingParticipantesLista_${instanceId}" class="ranking-participantes-lista">
                            <p class="ranking-empty-message">Carregando participantes...</p>
                        </div>
                    </section>
                </div>
            </section>

            <section class="bolao-classificacao-footer ranking-detalhe-footer" id="rankingDetalheParticipante_${instanceId}">
                <div class="bolao-classificacao-footer-header">
                    <span class="bolao-eyebrow">Detalhe individual</span>
                    <h3>Selecione um participante</h3>
                    <p>Clique em uma linha do ranking ou em um nome da lista para visualizar todos os palpites e a pontuação por jogo.</p>
                </div>

                <div class="ranking-empty-state">
                    <span class="ranking-empty-icon">🏆</span>
                    <h3>Nenhum participante selecionado</h3>
                    <p>A lista de palpites aparecerá aqui.</p>
                </div>
            </section>
        </main>

    </div>
</div>
