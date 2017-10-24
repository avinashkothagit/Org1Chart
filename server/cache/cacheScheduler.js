var orgConfig = require( './orgchartCacheConfig' );
var cache = require( './cache' );
var schedule = require( 'node-schedule' );
var pg = require( 'pg' );

function run() {
    console.log( 'Running the cache scheduler' );
    //only allows for one client connection at a time.
    //(herokuConnect free tier only allows one connection at a time)
    pg.defaults.poolSize = 1;

    /** this queries the configuration settings, and then uses this information to
     *  initiate and periodically refresh the cache.
     */
    orgConfig.getConfig( buildCache );

    //scheduler runs every ten mins
    var rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range( 0, 0, 10 );

    schedule.scheduleJob( rule, function () {
        orgConfig.getConfig( buildCache );
    } );
}

//initiate the cache, and flush the other cache if it exists
function buildCache() {

    cache.flush();
    cache.getOrgchartData( function () {
    } );
}

module.exports.run = run;