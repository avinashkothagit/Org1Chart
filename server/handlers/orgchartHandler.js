/**
 * Created by casakawa on 8/25/15.
 */
var cache = require( '../cache/cache' );
var _ = require( 'lodash' );

/**
 * first grab the user configuration, then use that config to refer
 * either the contactCache or the userCache.
 */

var orgchartHandler = function ( request, reply ) {
    //search for a by email.
    var requestedUser = request.params.id;

    cache.getOrgchartData( function ( people ) {
        var currentUser = null;

        //search for currentUser
        for ( var i = 0; i < people.length; i++ ) {
            var person = people[ i ];
            if ( person.email == requestedUser ) {
                currentUser = people[ i ];
                break;
            }
        }

        var neighborhood = currentUser.getNeighborhood( people );

        reply( _.merge( currentUser, neighborhood ) );
    } );
};

module.exports = orgchartHandler;
