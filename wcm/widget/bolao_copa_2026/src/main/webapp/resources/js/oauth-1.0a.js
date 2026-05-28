(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.OAuth = factory();
    }
}(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    function OAuth(options) {
        if (!(this instanceof OAuth)) {
            return new OAuth(options);
        }

        options = options || {};

        this.consumer = options.consumer || {};
        this.signature_method = options.signature_method || 'HMAC-SHA1';
        this.hash_function = options.hash_function || function () {
            throw new Error('hash_function is required');
        };
        this.nonce_length = options.nonce_length || 6;
        this.version = options.version || '1.0';
    }

    OAuth.prototype.percentEncode = function (value) {
        return encodeURIComponent(value)
            .replace(/[!'()*]/g, function (c) {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
    };

    OAuth.prototype.getNonce = function (length) {
        var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var nonce = '';
        var size = length || this.nonce_length;

        for (var i = 0; i < size; i++) {
            nonce += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return nonce;
    };

    OAuth.prototype.getTimestamp = function () {
        return String(Math.floor(Date.now() / 1000));
    };

    OAuth.prototype.normalizeUrl = function (url) {
        try {
            var parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
            var port = parsed.port;
            var protocol = parsed.protocol.toLowerCase();
            var hostname = parsed.hostname.toLowerCase();

            if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
                port = '';
            }

            return protocol + '//' + hostname + (port ? ':' + port : '') + parsed.pathname;
        } catch (e) {
            return url;
        }
    };

    OAuth.prototype.collectParameters = function (requestData, oauthData) {
        var params = [];
        var source = requestData && requestData.data ? requestData.data : {};

        for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined && source[key] !== null) {
                params.push([key, String(source[key])]);
            }
        }

        try {
            var parsed = new URL(requestData.url || '', typeof window !== 'undefined' ? window.location.href : undefined);
            parsed.searchParams.forEach(function (value, key) {
                params.push([key, String(value)]);
            });
        } catch (e) {
            // Ignore URL parsing failures and continue with body parameters only.
        }

        for (var oauthKey in oauthData) {
            if (Object.prototype.hasOwnProperty.call(oauthData, oauthKey)) {
                params.push([oauthKey, String(oauthData[oauthKey])]);
            }
        }

        params.sort(function (a, b) {
            var keyA = a[0];
            var keyB = b[0];

            if (keyA === keyB) {
                return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
            }

            return keyA < keyB ? -1 : 1;
        });

        return params;
    };

    OAuth.prototype.buildParameterString = function (params) {
        var encoded = [];

        for (var i = 0; i < params.length; i++) {
            encoded.push(this.percentEncode(params[i][0]) + '=' + this.percentEncode(params[i][1]));
        }

        return encoded.join('&');
    };

    OAuth.prototype.buildBaseString = function (requestData, oauthData) {
        var method = String(requestData.method || 'GET').toUpperCase();
        var url = this.normalizeUrl(requestData.url || '');
        var params = this.collectParameters(requestData, oauthData);
        var paramString = this.buildParameterString(params);

        return [
            this.percentEncode(method),
            this.percentEncode(url),
            this.percentEncode(paramString)
        ].join('&');
    };

    OAuth.prototype.buildSigningKey = function (tokenSecret) {
        return this.percentEncode(this.consumer.secret || '') + '&' + this.percentEncode(tokenSecret || '');
    };

    OAuth.prototype.authorize = function (requestData, tokenData) {
        tokenData = tokenData || {};

        var oauthData = {
            oauth_consumer_key: this.consumer.key || '',
            oauth_nonce: this.getNonce(),
            oauth_signature_method: this.signature_method,
            oauth_timestamp: this.getTimestamp(),
            oauth_token: tokenData.key || '',
            oauth_version: this.version
        };

        var baseString = this.buildBaseString(requestData || {}, oauthData);
        var signingKey = this.buildSigningKey(tokenData.secret || '');
        var signature = this.hash_function(baseString, signingKey);

        oauthData.oauth_signature = signature;

        return oauthData;
    };

    OAuth.prototype.toHeader = function (oauthData) {
        var header = [];

        for (var key in oauthData) {
            if (Object.prototype.hasOwnProperty.call(oauthData, key) && key.indexOf('oauth_') === 0) {
                header.push(this.percentEncode(key) + '="' + this.percentEncode(oauthData[key]) + '"');
            }
        }

        return {
            Authorization: 'OAuth ' + header.join(', ')
        };
    };

    return function (options) {
        return new OAuth(options);
    };
}));
