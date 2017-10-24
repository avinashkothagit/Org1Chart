var orgchartModel = require( './orgchartModel' );
var orgchartDataConfig = {
    users: {
        tableName: 'salesforce.user',
        getData: function ( data ) {
            return new orgchartModel( data );
        }
    },
    contacts: {
        tableName: 'salesforce.contact',
        getData: function ( data ) {
            return new orgchartModel( data );
        }
    }
};

module.exports = orgchartDataConfig;