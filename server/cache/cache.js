var pg = require( 'pg' );
var connectionString = process.env.DATABASE_URL;
var dataConfig = require( './orgchartDataConfig' );
var orgConfig = require( './orgchartCacheConfig' );

//this file holds the cached data
var people = [];

/**
 * Initializes a temp array to hold the queried data, then
 * once the query is complete assigns it to the people cache
 */
var prime = function ( config, callback ) {
    console.log( 'Populating people cache' );

    var tempUsers = [];

    pg.connect( connectionString, function ( err, client, done ) {
        if ( err ) {
            console.log( err );
        }

        //create a query to grab all contacts from the org
        var query = client.query( 'SELECT * FROM ' + config.tableName );
        query.on( 'row', function ( row ) {
            /** grab all the data **/
            var orgChartNode = config.getData( row );

            //one orgChart node is now complete, push orgChartNode into the contacts list
            tempUsers.push( orgChartNode );
        } );

        query.on( 'end', function ( result ) {
            console.log( 'User cache populated, size: ', tempUsers.length );
            people = tempUsers;
            done(); //call `done()` to release the client back to the pool
            callback( people );
        } );
    } );
};

module.exports = {
    getOrgchartData: function ( callback ) {
        if ( people.length > 0 ) {
            callback( people );
        } else {
            var type = orgConfig.isUserHierachy() ? 'users' : 'contacts';
            prime( dataConfig[ type ], function ( people ) {
                callback( people );
            } );
        }
    },
    flush: function () {
        console.log( 'Flushed people' );
        people = [];
    }
};