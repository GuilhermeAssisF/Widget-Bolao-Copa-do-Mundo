function getValueOrDefault(value, defaultValue) {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    var str = String(value);
    return str && str.trim() ? str.trim() : defaultValue;
}

function getConstraintValue(constraints, fieldName) {
    if (!constraints || !constraints.length) {
        return '';
    }
    for (var i = 0; i < constraints.length; i++) {
        var constraint = constraints[i];
        if (!constraint) {
            continue;
        }

        // Converte explicitamente para String nativa do JS
        var constraintField = String(constraint.fieldName || constraint._field || constraint.name || '');

        if (constraintField === String(fieldName)) {
            return getValueOrDefault(
                constraint.initialValue !== undefined ? constraint.initialValue : constraint._initialValue,
                ''
            );
        }
    }
    return '';
}

function resolveSetting(keys, fallback) {
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = '';

        try {
            value = Packages.java.lang.System.getProperty(key);
        } catch (e1) { }

        if (!value) {
            try {
                var envKey = String(key).replace(/\./g, '_').replace(/\//g, '_').toUpperCase();
                value = Packages.java.lang.System.getenv(envKey);
            } catch (e2) { }
        }

        value = getValueOrDefault(value, '');
        if (value) {
            return value;
        }
    }

    return getValueOrDefault(fallback, '');
}

function readPayload(constraints) {
    var payloadConstraints = {
        destinatario: getConstraintValue(constraints, 'destinatario') || getConstraintValue(constraints, 'emailContato'),
        nomeParticipante: getConstraintValue(constraints, 'nomeParticipante') || getConstraintValue(constraints, 'nomeContato'),
        emailParticipante: getConstraintValue(constraints, 'emailParticipante') || getConstraintValue(constraints, 'empresa'),
        telefoneParticipante: getConstraintValue(constraints, 'telefoneParticipante'),
        campeaoPrevisto: getConstraintValue(constraints, 'campeaoPrevisto') || getConstraintValue(constraints, 'maturidade'),
        linkDocumento: getConstraintValue(constraints, 'linkDocumento') || getConstraintValue(constraints, 'linkPdfPublico'),
        documentId: getConstraintValue(constraints, 'documentId') || getConstraintValue(constraints, 'scoreFinal'),
        fileName: getConstraintValue(constraints, 'fileName'),
        dataEnvio: getConstraintValue(constraints, 'dataEnvio') || getConstraintValue(constraints, 'dataAtual')
    };

    var payloadText = getConstraintValue(constraints, 'payload');
    var payloadJson = {};

    if (payloadText) {
        try {
            payloadJson = JSON.parse(String(payloadText));
        } catch (e) {
            payloadJson = {};
        }
    }

    return {
        destinatario: getValueOrDefault(payloadJson.destinatario, payloadConstraints.destinatario),
        nomeParticipante: getValueOrDefault(payloadJson.nomeParticipante, payloadConstraints.nomeParticipante),
        emailParticipante: getValueOrDefault(payloadJson.emailParticipante, payloadConstraints.emailParticipante),
        telefoneParticipante: getValueOrDefault(payloadJson.telefoneParticipante, payloadConstraints.telefoneParticipante),
        campeaoPrevisto: getValueOrDefault(payloadJson.campeaoPrevisto, payloadConstraints.campeaoPrevisto),
        linkDocumento: getValueOrDefault(payloadJson.linkDocumento, payloadConstraints.linkDocumento),
        documentId: getValueOrDefault(payloadJson.documentId, payloadConstraints.documentId),
        fileName: getValueOrDefault(payloadJson.fileName, payloadConstraints.fileName),
        dataEnvio: getValueOrDefault(payloadJson.dataEnvio, payloadConstraints.dataEnvio)
    };
}

function buildTextBody(payload) {
    var linhas = [];
    linhas.push('Bolao Copa 2026');
    linhas.push('');
    linhas.push('Um novo resultado foi enviado.');
    linhas.push('');
    linhas.push('Nome: ' + getValueOrDefault(payload.nomeParticipante, ''));
    linhas.push('E-mail: ' + getValueOrDefault(payload.emailParticipante, ''));
    linhas.push('Telefone: ' + getValueOrDefault(payload.telefoneParticipante, ''));
    linhas.push('Campeao previsto: ' + getValueOrDefault(payload.campeaoPrevisto, ''));
    linhas.push('Arquivo: ' + getValueOrDefault(payload.fileName, ''));
    linhas.push('Link: ' + getValueOrDefault(payload.linkDocumento, ''));

    return linhas.join('\n');
}

function escapeHtml(text) {
    return getValueOrDefault(text, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildHtmlBody(payload) {
    var linkDocumento = getValueOrDefault(payload.linkDocumento, '');
    var fileName = getValueOrDefault(payload.fileName, '');

    return [
        '<html><body style="font-family: Arial, sans-serif; color:#1f2937;">',
        '<h2 style="margin:0 0 12px 0;">Bolao Copa 2026</h2>',
        '<p style="margin:0 0 16px 0;">Um novo resultado foi enviado.</p>',
        '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">',
        rowHtml('Nome', payload.nomeParticipante),
        rowHtml('E-mail', payload.emailParticipante),
        rowHtml('Telefone', payload.telefoneParticipante),
        rowHtml('Campeao previsto', payload.campeaoPrevisto),
        rowHtml('Arquivo', fileName),
        rowHtml('Link', linkDocumento ? '<a href="' + escapeHtml(linkDocumento) + '">' + escapeHtml(linkDocumento) + '</a>' : ''),
        '</table>',
        '</body></html>'
    ].join('');
}

function buildHtmlInsights(payload) {
    var linkDocumento = getValueOrDefault(payload.linkDocumento, '');
    return [
        rowHtml('Participante', payload.nomeParticipante),
        rowHtml('E-mail', payload.emailParticipante),
        rowHtml('Telefone', payload.telefoneParticipante),
        rowHtml('Campeao previsto', payload.campeaoPrevisto),
        rowHtml('Arquivo', payload.fileName),
        rowHtml('Documento GED', payload.documentId),
        rowHtml('Link da planilha', linkDocumento),
        rowHtml('Data de envio', payload.dataEnvio)
    ].join('');
}

function rowHtml(label, value) {
    return '<tr>' +
        '<td style="padding:6px 12px 6px 0; font-weight:bold; vertical-align:top;">' + escapeHtml(label) + '</td>' +
        '<td style="padding:6px 0; vertical-align:top;">' + escapeHtml(value) + '</td>' +
        '</tr>';
}

function buildParametrosNotifier(payload) {
    var linkDocumento = getValueOrDefault(payload.linkDocumento, '');
    var htmlBody = buildHtmlBody(payload);
    var textBody = buildTextBody(payload);
    var htmlInsights = buildHtmlInsights(payload);

    var parametros = new java.util.HashMap();
    putParametro(parametros, 'subject', 'Bolao Copa 2026 - resultado publicado');
    putParametro(parametros, 'nomeParticipante', payload.nomeParticipante);
    putParametro(parametros, 'emailParticipante', payload.emailParticipante);
    putParametro(parametros, 'telefoneParticipante', payload.telefoneParticipante);
    putParametro(parametros, 'campeaoPrevisto', payload.campeaoPrevisto);
    putParametro(parametros, 'nome', payload.nomeParticipante);
    putParametro(parametros, 'email', payload.emailParticipante);
    putParametro(parametros, 'telefone', payload.telefoneParticipante);
    putParametro(parametros, 'campeao', payload.campeaoPrevisto);
    putParametro(parametros, 'linkDocumento', linkDocumento);
    putParametro(parametros, 'linkPlanilha', linkDocumento);
    putParametro(parametros, 'linkPdfPublico', linkDocumento);
    putParametro(parametros, 'LINK_DOCUMENTO', linkDocumento);
    putParametro(parametros, 'LINK_PLANILHA', linkDocumento);
    putParametro(parametros, 'link', linkDocumento);
    putParametro(parametros, 'documentId', payload.documentId);
    putParametro(parametros, 'fileName', payload.fileName);
    putParametro(parametros, 'dataEnvio', payload.dataEnvio);
    putParametro(parametros, 'htmlBody', htmlBody);
    putParametro(parametros, 'textBody', textBody);
    putParametro(parametros, 'message', htmlBody);
    putParametro(parametros, 'MESSAGE', htmlBody);

    putParametro(parametros, 'emailContato', payload.destinatario);
    putParametro(parametros, 'nomeContato', payload.nomeParticipante);
    putParametro(parametros, 'empresa', payload.emailParticipante);
    putParametro(parametros, 'scoreFinal', payload.documentId);
    putParametro(parametros, 'maturidade', payload.campeaoPrevisto);
    putParametro(parametros, 'dataAtual', payload.dataEnvio);
    putParametro(parametros, 'htmlInsights', htmlInsights);
    putParametro(parametros, 'linkPdfPublico', linkDocumento);

    return parametros;
}

function putParametro(parametros, chave, valor) {
    parametros.put(String(chave), String(getValueOrDefault(valor, '')));
}

function buildDebugPayload(payload) {
    return [
        'nome=' + getValueOrDefault(payload.nomeParticipante, ''),
        'email=' + getValueOrDefault(payload.emailParticipante, ''),
        'telefone=' + getValueOrDefault(payload.telefoneParticipante, ''),
        'campeao=' + getValueOrDefault(payload.campeaoPrevisto, ''),
        'documentId=' + getValueOrDefault(payload.documentId, ''),
        'fileName=' + getValueOrDefault(payload.fileName, ''),
        'link=' + getValueOrDefault(payload.linkDocumento, '')
    ].join(' | ');
}

function buildDestinatarios(payload) {
    var destinatarios = new java.util.ArrayList();
    destinatarios.add(getValueOrDefault(payload.destinatario, 'marketing@interhativaoperacional.com'));
    return destinatarios;
}

function sendEmailViaNotifier(payload) {
    var remetente = resolveSetting([
        'bolao.notifier.sender',
        'fluig.bolao.notifier.sender',
        'mail.notifier.sender'
    ], 'guilherme-af');

    var template = resolveSetting([
        'bolao.notifier.template',
        'fluig.bolao.notifier.template',
        'mail.notifier.template'
    ], 'TPL_BOLAO_COPA_2026_ENVIO');

    var parametros = buildParametrosNotifier(payload);
    var destinatarios = buildDestinatarios(payload);

    notifier.notify(remetente, template, parametros, destinatarios, 'text/html');
}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn('success');
    dataset.addColumn('message');
    dataset.addColumn('recipient');
    dataset.addColumn('subject');
    dataset.addColumn('sentAt');
    dataset.addColumn('debugPayload');

    try {
        var payload = readPayload(constraints);

        // Se o payload vier sem o link externo, mas trouxer o ID do GED,
        // interceptamos e geramos o link com o token de visualização pública
        if (!payload.linkDocumento && payload.documentId) {
            try {
                var docService = fluigAPI.getDocumentService();
                // Recupera a URL pública (Compartilhamento externo) para download
                payload.linkDocumento = String(docService.getDownloadURL(parseInt(payload.documentId)));
            } catch (e) {
                log.warn("Bolao Copa 2026: Falha ao gerar link publico do GED: " + e);
            }
        }

        if (!payload.destinatario) {
            payload.destinatario = 'marketing@interhativaoperacional.com';
        }

        sendEmailViaNotifier(payload);

        dataset.addRow([
            'true',
            'Solicitação de e-mail enviada ao Notifier do Fluig.',
            getValueOrDefault(payload.destinatario, ''),
            'Bolao Copa 2026 - resultado publicado',
            new Date().toISOString(),
            buildDebugPayload(payload)
        ]);
    } catch (e) {
        dataset.addRow([
            'false',
            String(e && e.message ? e.message : e),
            getValueOrDefault(getConstraintValue(constraints, 'destinatario'), 'marketing@interhativaoperacional.com'),
            'Bolao Copa 2026 - resultado publicado',
            String(new java.util.Date()),
            ''
        ]);
    }

    return dataset;
}
