var Hapi = require( 'hapi' ),
    routes = require( './server/routes/routes.js' ),
    config = require( './config.js' ),
    util = require( 'util' ),
    onPreResponse = require( './server/extensions/onPreResponse' ),
    cacheScheduler = require( './server/cache/cacheScheduler' );

//prime the cache and set up the automatic refresh of data
cacheScheduler.run();

var server = new Hapi.Server( config.host, config.port, config.server );

// routes
server.route( routes );

// extensions
server.ext( 'onPreResponse', onPreResponse );

// start
server.start();

server.log( [ 'debug', 'hapi' ], util.format( 'Server running with config: %j facadeClient: %j', config, config.facadeClient() ) );
