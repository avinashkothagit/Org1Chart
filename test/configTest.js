var expect = require('chai').expect;
var config = require('../config');


describe('Config', function(){

    it('should return app secret from ENV var', function(){
        process.env.APP_SECRET = 'foo';
        expect(config.appSecret()).to.equal('foo');
    });

    describe('facadeClient', function(){

        it('should return facade url from ENV var', function () {

            var facadeurl = 'http://test.com';
            process.env.FACADE_URL = facadeurl;
            expect(config.facadeClient().url).to.equal(facadeurl);
            delete process.env.FACADE_URL;
        });

        it('should default to dev facade when no ENV var is set', function () {

            delete process.env.FACADE_URL;
            expect(config.facadeClient().url).to.equal('http://sfo-eapps-facd-ld1:8080');

        });

        it('should return a proxy URL based on ENV var', function(){

            var proxy = 'http://localhost:8888';
            process.env.DEBUG_PROXY = proxy;

            expect(config.facadeClient().proxy).to.equal(proxy);

            delete process.env.DEBUG_PROXY;
        });
    });


});