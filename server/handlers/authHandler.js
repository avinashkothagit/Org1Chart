var decode = require( 'salesforce-signed-request' );
var Config = require( '../../config.js' );
var Boom = require( 'hapi' ).error;

var authHandlers = {
    // POST /auth/signedrequest
    signedRequest: function ( request, reply ) {

        if ( !Config.appSecret() ) {
            return reply( Boom.badImplementation( 'Missing AppSecret configuration' ) );
        }
        var canvasContext = decode( request.payload.signed_request, Config.appSecret() );

        if ( canvasContext instanceof Error ) {
            return reply( Boom.badRequest( canvasContext.message ) );
        }

        var data = {
            canvasContext: canvasContext,
            config: Config
        };

        reply.view( 'home', data );
    },

    // GET /auth/signedRequest
    badRequest: function ( request, reply ) {
        Boom.methodNotAllowed( 'signedrequest must be an HTTP POST' );
    }
};

module.exports = authHandlers;