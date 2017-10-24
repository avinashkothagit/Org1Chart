var Config = require( './../../config' );
var Boom = require( 'hapi' ).error;

function setViewContext( request, reply ) {
    var assetManifest = require( '../../dist/compiled/assetManifest.json' );

    var response = request.response;
    if ( !assetManifest ) {
        // 500 error
        return reply( Boom.badImplementation( 'Missing assetManifest.json' ) );
    }
    // Set default view context
    if ( response.variety === 'view' ) {
        var context = response.source.context;
        context.assetManifest = assetManifest;
        context.config = Config;
    }

    return reply();
}

module.exports = setViewContext;
