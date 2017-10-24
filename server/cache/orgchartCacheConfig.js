var pg = require( 'pg' );
var isUser;
var connectionString = process.env.DATABASE_URL;

function getConfig( callback ) {
    console.log( 'Retrieving the org chart config' );
    var hierarchyType = null;
    pg.connect( connectionString, function ( err, client, done ) {
        if ( err )
            console.log( err );

        //creates a query to grab the config for users or contacts
        var query = client.query( 'SELECT * FROM salesforce.orgchartconfig__c LIMIT 1' );
        query.on( 'row', function ( row ) {
            hierarchyType = row.orghierarchytype__c;
        } );

        query.on( 'end', function ( result ) {
            //true if config is users, or false if contacts. default to users if config is not set
            if ( hierarchyType ) {
                isUser = hierarchyType != 'Contacts';
            } else {
                isUser = true;
            }

            console.log( 'Org Chart configured for user hierarchy? ', isUser );

            done();
            callback();
        } );
    } );
}

module.exports = {
    getConfig: getConfig,
    isUserHierachy: function () {
        return isUser;
    }
};
