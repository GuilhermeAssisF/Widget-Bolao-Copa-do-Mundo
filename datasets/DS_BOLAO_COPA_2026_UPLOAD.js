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
        if (constraint && constraint.fieldName === fieldName) {
            return getValueOrDefault(constraint.initialValue, '');
        }
    }

    return '';
}

function readAllBytes(stream) {
    var ByteArrayOutputStream = Packages.java.io.ByteArrayOutputStream;
    var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 8192);
    var output = new ByteArrayOutputStream();
    var read = 0;

    while ((read = stream.read(buffer)) !== -1) {
        output.write(buffer, 0, read);
    }

    return output.toByteArray();
}

function readResponse(connection) {
    var stream = null;

    try {
        if (connection.getResponseCode && connection.getResponseCode() >= 400) {
            stream = connection.getErrorStream();
        } else {
            stream = connection.getInputStream();
        }
    } catch (e) {
        stream = connection.getErrorStream();
    }

    if (!stream) {
        return '';
    }

    try {
        return String(new java.lang.String(readAllBytes(stream), 'UTF-8'));
    } finally {
        stream.close();
    }
}

function resolveSetting(key, fallback) {
    var value = '';

    try {
        value = Packages.java.lang.System.getProperty(key);
    } catch (e1) {}

    if (!value) {
        try {
            var envKey = String(key).replace(/\./g, '_').toUpperCase();
            value = Packages.java.lang.System.getenv(envKey);
        } catch (e2) {}
    }

    return getValueOrDefault(value, fallback || '');
}

function extractJsonValue(jsonText, key) {
    if (!jsonText) {
        return '';
    }

    try {
        var obj = JSON.parse(String(jsonText));
        if (obj && obj[key] !== undefined && obj[key] !== null) {
            return String(obj[key]);
        }
    } catch (e) {}

    return '';
}

function exchangeRefreshToken(tokenUrl, clientId, clientSecret, refreshToken) {
    var url = new Packages.java.net.URL(tokenUrl);
    var connection = url.openConnection();
    connection.setRequestMethod('POST');
    connection.setDoOutput(true);
    connection.setRequestProperty('Content-Type', 'application/x-www-form-urlencoded');

    var form = [];
    form.push('client_id=' + encodeURIComponent(clientId));
    form.push('client_secret=' + encodeURIComponent(clientSecret));
    form.push('refresh_token=' + encodeURIComponent(refreshToken));
    form.push('grant_type=refresh_token');

    var output = null;
    try {
        output = connection.getOutputStream();
        output.write(new java.lang.String(form.join('&')).getBytes('UTF-8'));
    } finally {
        if (output) {
            output.close();
        }
    }

    var responseText = readResponse(connection);
    var status = connection.getResponseCode();

    if (status < 200 || status >= 300) {
        throw new Error(responseText || ('Falha ao renovar o token OAuth. HTTP ' + status));
    }

    var accessToken = extractJsonValue(responseText, 'access_token');
    if (!accessToken) {
        throw new Error('Token de acesso não retornado pelo Google.');
    }

    return accessToken;
}

function buildMultipartBody(metadata, fileBytes, mimeType) {
    var boundary = '----BolaoCopa2026' + new Date().getTime();
    var newline = '\r\n';
    var body = new Packages.java.io.ByteArrayOutputStream();

    body.write(new java.lang.String('--' + boundary + newline).getBytes('UTF-8'));
    body.write(new java.lang.String('Content-Type: application/json; charset=UTF-8' + newline + newline).getBytes('UTF-8'));
    body.write(new java.lang.String(JSON.stringify(metadata)).getBytes('UTF-8'));
    body.write(new java.lang.String(newline + '--' + boundary + newline).getBytes('UTF-8'));
    body.write(new java.lang.String('Content-Type: ' + mimeType + newline + newline).getBytes('UTF-8'));
    body.write(fileBytes);
    body.write(new java.lang.String(newline + '--' + boundary + '--' + newline).getBytes('UTF-8'));

    return {
        body: body.toByteArray(),
        contentType: 'multipart/related; boundary=' + boundary
    };
}

function uploadToDrive(accessToken, folderId, fileName, fileBytes, mimeType, uploadUrl) {
    var metadata = {
        name: fileName,
        mimeType: mimeType
    };

    if (folderId) {
        metadata.parents = [folderId];
    }

    var multipart = buildMultipartBody(metadata, fileBytes, mimeType);
    var url = new Packages.java.net.URL(uploadUrl);
    var connection = url.openConnection();
    connection.setRequestMethod('POST');
    connection.setDoOutput(true);
    connection.setRequestProperty('Authorization', 'Bearer ' + accessToken);
    connection.setRequestProperty('Content-Type', multipart.contentType);
    connection.setRequestProperty('Content-Length', String(multipart.body.length));

    var output = null;
    try {
        output = connection.getOutputStream();
        output.write(multipart.body);
    } finally {
        if (output) {
            output.close();
        }
    }

    var responseText = readResponse(connection);
    var status = connection.getResponseCode();

    if (status < 200 || status >= 300) {
        throw new Error(responseText || ('Falha ao enviar o arquivo para o Drive. HTTP ' + status));
    }

    return JSON.parse(responseText);
}

function decodeBase64ToBytes(base64Text) {
    var raw = getValueOrDefault(base64Text, '');
    var commaIndex = raw.indexOf(',');

    if (commaIndex >= 0) {
        raw = raw.substring(commaIndex + 1);
    }

    raw = raw.replace(/\s+/g, '');
    return Packages.java.util.Base64.getDecoder().decode(raw);
}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn('success');
    dataset.addColumn('fileId');
    dataset.addColumn('webViewLink');
    dataset.addColumn('fileName');
    dataset.addColumn('message');

    try {
        var action = getConstraintValue(constraints, 'action') || 'upload';
        if (action !== 'upload') {
            throw new Error('Ação inválida para o dataset.');
        }

        var fileName = getConstraintValue(constraints, 'fileName') || 'Bolao_Copa_2026.xlsx';
        var fileBase64 = getConstraintValue(constraints, 'fileBase64');
        var mimeType = getConstraintValue(constraints, 'mimeType') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        var folderId = resolveSetting('googleDriveFolderId', '1LXt_ofQpB7QJufgwtlD37XOKuBnizojJ');
        var clientId = resolveSetting('googleDriveClientId', '');
        var clientSecret = resolveSetting('googleDriveClientSecret', '');
        var refreshToken = resolveSetting('googleDriveRefreshToken', '');
        var tokenUrl = resolveSetting('googleDriveTokenUrl', 'https://oauth2.googleapis.com/token');
        var uploadUrl = resolveSetting('googleDriveUploadUrl', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink');

        if (!clientId || !clientSecret || !refreshToken) {
            throw new Error('Configuração Google Drive incompleta no servidor.');
        }

        if (!fileBase64) {
            throw new Error('Arquivo vazio recebido pelo dataset.');
        }

        var fileBytes = decodeBase64ToBytes(fileBase64);
        var accessToken = exchangeRefreshToken(tokenUrl, clientId, clientSecret, refreshToken);
        var uploadResponse = uploadToDrive(accessToken, folderId, fileName, fileBytes, mimeType, uploadUrl);
        var fileId = uploadResponse && uploadResponse.id ? String(uploadResponse.id) : '';
        var webViewLink = uploadResponse && uploadResponse.webViewLink ? String(uploadResponse.webViewLink) : '';

        if (!webViewLink && fileId) {
            webViewLink = 'https://drive.google.com/file/d/' + fileId + '/view';
        }

        dataset.addRow([
            'true',
            fileId,
            webViewLink,
            fileName,
            'Upload concluído com sucesso.'
        ]);
    } catch (e) {
        dataset.addRow([
            'false',
            '',
            '',
            '',
            String(e && e.message ? e.message : e)
        ]);
    }

    return dataset;
}
