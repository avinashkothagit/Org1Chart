var _ = require( 'lodash' );
var Config = require( '../../config' );

var route = {
    method: 'GET',
    path: '/dist/{param*}',
    handler: {
        directory: {
            path: './dist',
            lookupCompressed: true
        }
    }
};

// add in caching config based on ENV
cacheConfig = Config.getCacheConfig();
if ( cacheConfig ) {
    _.merge( route, { config: cacheConfig } );
}

exports.routes = [ route ];