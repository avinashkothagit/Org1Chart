var expect = require('chai').expect;
var _ = require('lodash');
var routes = require('.././routes.js');
var Auth = require('.././authHandler.js');

describe('Routes', function(){

    it('should export an array', function(){
        expect(routes).to.be.a('array');
    });

    describe('/auth/signedrequest', function(){

        var route;

        beforeEach(function(){
            route = _.find(routes, {path: '/auth/signedrequest'})
        });

        it('should be defined', function()
        {
            expect(route).to.not.be.undefined;
        });

        it('should be configured for POSTs', function(){
            expect(route).to.have.property('method', 'POST')
        });

        it('should be handled by Auth#signedRequest', function(){
            expect(route.handler).to.equal(Auth.signedRequest);
        });
    });

    describe('/eapps_facade/services/', function(){

        it('should have a /orgchart/{id} route', function(){
            var route = _.find(routes, {path: '/eapps_facade/services/orgchart/{id}'});
            expect(route).to.exist;
            expect(route.method).to.equal('GET');
        });

        it('should have /orgchart route', function(){
            var route = _.find(routes, {path: '/eapps_facade/services/orgchart'});
            expect(route).to.exist;
        });


    });

});

