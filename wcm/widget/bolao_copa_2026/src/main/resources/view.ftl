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

            <div class="bolao-sidebar-section">
                <h4>Classificação parcial</h4>

                <div id="bolaoSidebarClassificacao_${instanceId}" class="bolao-sidebar-classificacao">
                    <p class="bolao-empty-message">
                        A classificação aparecerá após preencher os jogos.
                    </p>
                </div>
            </div>
        </aside>

        <main class="bolao-main">
            <section class="bolao-hero">
                <div>
                    <span class="bolao-eyebrow" id="bolaoEtapaLabel_${instanceId}">
                        Etapa 1 de 4
                    </span>

                    <h1 id="bolaoEtapaTitulo_${instanceId}">
                        Dados do participante
                    </h1>

                    <p id="bolaoEtapaDescricao_${instanceId}">
                        Informe seus dados para iniciar a simulação do bolão.
                    </p>
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