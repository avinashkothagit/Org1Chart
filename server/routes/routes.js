var staticRoutes = require( './staticRoutes' ).routes;
var authRoutes = require( './authRoutes' ).routes;
var apiProxyRoutes = require( './apiProxyRoutes' ).routes;

/**
 * Export all routes
 * @type {Array}
 */
module.exports = staticRoutes.concat( authRoutes ).concat( apiProxyRoutes );
