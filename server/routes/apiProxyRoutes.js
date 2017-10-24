var searchHandler = require( '../handlers/searchHandler' );
var orgchartHandler = require( '../handlers/orgchartHandler' );

var routes = [
    {
        method: 'GET',
        path: '/services/orgchart/{id}',
        handler: orgchartHandler
    },
    {
        method: 'POST',
        path: '/services/orgchart',
        handler: searchHandler
    }
];

exports.routes = routes;
