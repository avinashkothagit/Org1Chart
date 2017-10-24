/**
 * Created by casakawa on 8/14/15.
 */
//this file holds the cached users array
var cache = require( '../cache/cache' );

var searchHandler = function ( request, reply ) {

    //return array
    var returnArray = [];
    cache.getOrgchartData( function ( people ) {
        //catch the search term and convert to lowercase
        var searchTerm = request.payload.search.toLowerCase();

        //loop through all users looking for matches
        for ( var i = 0; i < people.length; i++ ) {
            //also convert the names in the array to lowercase.
            var compareString = people[ i ].name.toLowerCase();

            //adds any matches to the return array, this also handles partial matches
            if ( compareString.indexOf( searchTerm ) > -1 ) {
                returnArray.push( people[ i ] );
            }
        }

        reply( returnArray );
    } );
};

module.exports = searchHandler;
