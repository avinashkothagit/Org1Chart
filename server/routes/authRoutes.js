var Auth = require( '../handlers/authHandler' );

var routes = [
    {
        method: 'POST',
        path: '/auth/signedrequest',
        handler: Auth.signedRequest
    },
    {
        method: 'GET',
        path: '/auth/signedrequest',
        handler: Auth.badRequest
    }
];

exports.routes = routes;