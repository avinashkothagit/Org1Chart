Fs = require( 'fs' );


var ssl = function () {
    var useSSL = process.env.USE_SSL ? true : false;
    if ( useSSL ) {
        return {
            key: Fs.readFileSync( '/etc/apache2/ssl/host.key' ),
            cert: Fs.readFileSync( '/etc/apache2/ssl/server.crt' )

        };
    }
};

var uri = function ( config ) {
    return (config.server.tls ? 'https://' : 'http://') + config.host + ':' + config.port
};

var debug = function ( config ) {
    if ( config.isDevelopment() ) {
        return {
            request: [
                'hapi', // log request,handler,response flow
                'error' // logs tagged with error
            ]
        }
    }
};

var config = {
    host: '0.0.0.0',
    port: (parseInt( process.env.PORT, 10 ) || 5150),
    appSecret: function () {
        return process.env.APP_SECRET
    },
    env: function () {
        return process.env.NODE_ENV || "development";
    },
    isDevelopment: function () {
        return this.env() === 'development';
    },
    //https://github.com/spumko/hapi/blob/master/docs/Reference.md#server-options
    server: {
        views: {
            engines: {
                'ejs': 'ejs'
            },
            path: './server/views',
            isCached: false
        },
        tls: ssl()

    },
    getCacheConfig: function() {
        return !this.isDevelopment() ? { cache: { expiresIn: 31536000000 } } : null
    },
    facadeClient: function () {
        // STAGING URL : https://ngmobile-stage.corp.salesforce.com
        var url = process.env.FACADE_URL || 'http://sfo-eapps-facd-ld1:8080';
        var proxy = process.env.DEBUG_PROXY || null;
        var ca = proxy ? Fs.readFileSync( './charles-proxy-ssl.crt' ) : null;

        return {
            url: url,
            proxy: proxy,
            ca: ca,
            strictSSL: true
        };

    }

};

config.uri = uri( config );
config.server.debug = debug( config );

module.exports = config;


