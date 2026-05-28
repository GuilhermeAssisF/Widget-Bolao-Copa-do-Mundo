<!-- Se a CDN estiver bloqueada no ambiente, baixe crypto-js.min.js para resources/js/crypto-js.min.js e carregue localmente aqui. -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
<script type="text/javascript" src="/bolao_copa_2026/resources/js/oauth-1.0a.js"></script>

<div 
    id="WidgetBolaoCopa2026_${instanceId}" 
    class="fluig-style-guide wcm-widget-class super-widget bolao-copa-widget" 
    data-params="WidgetBolaoCopa2026.instance()">

    <div class="bolao-wrapper">

        <aside class="bolao-sidebar">
            <div class="bolao-sidebar-brand">
                <div class="bolao-logo-mark">
                    <span>26</span>
                </div>

                <div>
                    <h2>Bolão Copa</h2>
                    <p>Simulador 2026</p>
                </div>
            </div>

            <div class="bolao-user-card">
                <span>Participante</span>
                <strong id="bolaoNomeParticipante_${instanceId}">Ainda não informado</strong>
            </div>

            <div class="bolao-sidebar-current-step">
                <span class="bolao-eyebrow" id="bolaoEtapaLabel_${instanceId}">
                    Etapa 1 de 4
                </span>

                <h3 id="bolaoEtapaTitulo_${instanceId}">
                    Dados do participante
                </h3>

                <p id="bolaoEtapaDescricao_${instanceId}">
                    Informe seus dados para iniciar a simulação do bolão.
                </p>
            </div>

            <div class="bolao-sidebar-section bolao-premiacao-card">
                <h4>Premiação</h4>

                <div class="bolao-premio-item primeiro">
                    <span>1º lugar</span>
                    <strong>R$ 1.000,00</strong>
                </div>

                <div class="bolao-premio-item segundo">
                    <span>2º lugar</span>
                    <strong>R$ 500,00</strong>
                </div>

                <div class="bolao-premio-item terceiro">
                    <span>3º lugar</span>
                    <strong>R$ 300,00</strong>
                </div>
            </div>

            <div class="bolao-sidebar-section">
                <h4>Etapas</h4>

                <ul class="bolao-step-list">
                    <li class="active" data-step-menu="dados">
                        <span>1</span>
                        Dados
                    </li>

                    <li data-step-menu="grupos">
                        <span>2</span>
                        Fase de grupos
                    </li>

                    <li data-step-menu="mata_mata">
                        <span>3</span>
                        Mata-mata
                    </li>

                    <li data-step-menu="resultado">
                        <span>4</span>
                        Resultado
                    </li>
                </ul>
            </div>
        </aside>

        <main class="bolao-main">
            <section class="bolao-hero bolao-main-summary">
                <div>
                    <span class="bolao-eyebrow">Resumo da etapa</span>
                    <h1>Bolão Copa 2026</h1>
                    <p>Acompanhe os jogos, a pontuação rodada a rodada e o andamento da simulação.</p>
                </div>

                <div class="bolao-hero-badge">
                    <span>2026</span>
                    <small>World Cup Pool</small>
                </div>
            </section>

            <section 
                id="bolaoConteudo_${instanceId}" 
                class="bolao-content">

                <!-- O conteúdo das etapas será renderizado via JavaScript -->

            </section>

            <section class="bolao-classificacao-footer">
                <div class="bolao-classificacao-footer-header">
                    <span class="bolao-eyebrow">Resumo da simulação</span>
                    <h3>Classificação parcial</h3>
                    <p>Acompanhe a classificação dos grupos conforme os placares forem preenchidos.</p>
                </div>

                <div id="bolaoMainClassificacao_${instanceId}" class="bolao-main-classificacao">
                    <p class="bolao-empty-message">
                        A classificação aparecerá após preencher os jogos.
                    </p>
                </div>
            </section>

            <footer class="bolao-actions">
                <button 
                    type="button" 
                    id="btnBolaoVoltar_${instanceId}" 
                    class="btn btn-default bolao-btn-secondary">
                    Voltar
                </button>

                <button 
                    type="button" 
                    id="btnBolaoAvancar_${instanceId}" 
                    class="btn btn-primary bolao-btn-primary">
                    Avançar
                </button>
            </footer>
        </main>

    </div>
</div>
