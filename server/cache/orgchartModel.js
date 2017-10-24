'use strict';

var OrgchartModel = function ( data ) {
    this.id = data.sfid;
    this.name = data.name;
    this.firstName = data.firstname;
    this.lastName = data.lastname;
    this.title = data.title;
    this.phones = buildPhoneArray( {
        'desk': data.phone || null,
        'mobilePhone': data.mobilephone || null,
        'otherPhone': data.otherPhone || null
    } );
    this.email = data.email;
    this.photo = {
        largePhotoUrl: data.photourl || data.fullphotourl || null,
        smallPhotoUrl: data.photourl || data.smallphotourl || null
    };
    this.reportsToId = data.reportstoid || data.managerid;
    this.peers = [];
    this.directReports = [];
    this.reportsTo = [];
};

function buildPhoneArray( phones ) {
    var phoneArray = [];

    for ( var i in phones ) {
        if ( phones[ i ] != null ) {
            var phoneObject = {
                type: i,
                value: phones[ i ]
            };
            phoneArray.push( phoneObject );
        }
    }

    return phoneArray;
}

function getManagerChain( currentPerson, orgchartData ) {
    var reportsTo = [];
    if ( !currentPerson.reportsTo ) {
        return;
    }

    function getManager( current, orgData ) {
        for ( var i = 0; i < orgData.length; i++ ) {
            var person = orgData[ i ];
            if ( current.reportsToId === person.id ) {
                reportsTo.push( person );
                getManager( person, orgData )
            } else {
                clearNeighborhood( person );
            }
        }
    }

    getManager( currentPerson, orgchartData );

    return reportsTo.reverse();
}

function getPeers( currentPerson, orgchartData ) {
    var peers = [];

    for ( var i = 0; i < orgchartData.length; i++ ) {
        var person = orgchartData[ i ];
        //build peersArray (not sorted), all share the same boss.
        //The top of the hierarchy has no peers.
        if ( currentPerson.reportsToId != null && currentPerson.reportsToId === person.reportsToId && currentPerson.email != person.email ) {
            clearNeighborhood( person );
            peers.push( person );
        }
    }

    return peers;
}

function getDirectReports( currentPerson, orgchartData ) {
    var directReports = [];

    //build directReports list (not sorted), these are ones minions
    for ( var i = 0; i < orgchartData.length; i++ ) {
        var person = orgchartData[ i ];

        if ( currentPerson.id === person.reportsToId ) {
            clearNeighborhood( person );
            directReports.push( person );
        }
    }

    return directReports;
}

function clearNeighborhood( person ) {
    person.peers = [];
    person.directReports = [];
    person.reportsTo = [];
}

OrgchartModel.prototype.getNeighborhood = function ( orgchartData ) {
    return {
        reportsTo: getManagerChain( this, orgchartData ),
        peers: getPeers( this, orgchartData ),
        directReports: getDirectReports( this, orgchartData )
    }
};

module.exports = OrgchartModel;