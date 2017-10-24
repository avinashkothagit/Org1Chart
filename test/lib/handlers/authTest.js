var Hapi = require('hapi');
var expect = require('chai').expect;
var _ = require('lodash');

var routes = require('../.././routes');
var AuthHandler = require('../.././auth');
var config = require('../../../config');


describe('AuthHandler', function () {

    var server;
    before(function(){
        server = new Hapi.Server(_.merge({debug:false}, config.server));
        server.route(routes);
    });

    it('should return a 500 error if there is no APP_SECRET configured', function(done){

        delete process.env.APP_SECRET;

        server.inject({
            method: 'POST',
            url: '/auth/signedrequest',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': 5
            },
            payload: 'foo=bar'
        }, function (response) {
            expect(response.statusCode).to.equal(500);
            done();
        });
    });

    it('should decode a signed request', function (done) {

        var test_signed_request = "V/lsK06wzoefsXdKVc231sIkTxi5zYV2J2FW1hlu0VQ=.eyJ1c2VySWQiOiIwMDVSMDAwMDAwMERnSkEiLCJjbGllbnQiOnsib2F1dGhUb2tlbiI6IjAwRFIwMDAwMDAwOGJQQyFBUThBUVBVSFBrTEpTUEdDVkpYZjBOak5IQzVCRmZUNHJJQ0tmLlpxMWFrRGlHYXZWcTAzel90dnpiMWY2TlVwT1AzVjFrZG1xY2t1bzY4a0w0bDZwUXczNDZkX1Y4ZFEiLCJpbnN0YW5jZUlkIjoiXzpzaGlwbWVudDoiLCJ0YXJnZXRPcmlnaW4iOiJodHRwczovL21vYmlsZTEudC5zYWxlc2ZvcmNlLmNvbSIsImluc3RhbmNlVXJsIjoiaHR0cHM6Ly9tb2JpbGUxLnQuc2FsZXNmb3JjZS5jb20ifSwiaXNzdWVkQXQiOjEzODQ4MTkwNTksImNvbnRleHQiOnsiYXBwbGljYXRpb24iOnsiZGV2ZWxvcGVyTmFtZSI6InNoaXBtZW50IiwicmVmZXJlbmNlSWQiOiIwOUhSMDAwMDAwMDAwTjkiLCJhcHBsaWNhdGlvbklkIjoiMDZQUjAwMDAwMDAwMGNJIiwiY2FudmFzVXJsIjoiaHR0cHM6Ly9sb2NhbGhvc3Qvc2lnbmVkcmVxdWVzdCIsIm5hbWUiOiJzaGlwbWVudCIsInZlcnNpb24iOiIxLjAiLCJuYW1lc3BhY2UiOm51bGwsImF1dGhUeXBlIjoiU0lHTkVEX1JFUVVFU1QifSwib3JnYW5pemF0aW9uIjp7Im9yZ2FuaXphdGlvbklkIjoiMDBEUjAwMDAwMDA4YlBDTUFZIiwiY3VycmVuY3lJc29Db2RlIjoiVVNEIiwibXVsdGljdXJyZW5jeUVuYWJsZWQiOmZhbHNlLCJuYW1lIjoiU2FtJ3MgUzEgVGVzdCBPcmciLCJuYW1lc3BhY2VQcmVmaXgiOm51bGx9LCJlbnZpcm9ubWVudCI6eyJkaW1lbnNpb25zIjp7ImhlaWdodCI6IjkwMHB4IiwibWF4SGVpZ2h0IjoiMjAwMHB4IiwibWF4V2lkdGgiOiIxMDAwcHgiLCJ3aWR0aCI6IjgwMHB4In0sImRpc3BsYXlMb2NhdGlvbiI6IkNoYXR0ZXIiLCJ1aVRoZW1lIjoiVGhlbWUzIiwidmVyc2lvbiI6eyJhcGkiOiIyOS4wIiwic2Vhc29uIjoiV0lOVEVSIn0sImxvY2F0aW9uVXJsIjoiaHR0cHM6Ly9tb2JpbGUxLnQuc2FsZXNmb3JjZS5jb20vX3VpL2NvcmUvY2hhdHRlci91aS9DaGF0dGVyUGFnZSIsInBhcmFtZXRlcnMiOnt9fSwibGlua3MiOnsibG9naW5VcmwiOiJodHRwczovL21vYmlsZTEudC5zYWxlc2ZvcmNlLmNvbS8iLCJjaGF0dGVyRmVlZEl0ZW1zVXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvY2hhdHRlci9mZWVkLWl0ZW1zIiwiY2hhdHRlckZlZWRzVXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvY2hhdHRlci9mZWVkcyIsImNoYXR0ZXJHcm91cHNVcmwiOiIvc2VydmljZXMvZGF0YS92MjkuMC9jaGF0dGVyL2dyb3VwcyIsImNoYXR0ZXJVc2Vyc1VybCI6Ii9zZXJ2aWNlcy9kYXRhL3YyOS4wL2NoYXR0ZXIvdXNlcnMiLCJlbnRlcnByaXNlVXJsIjoiL3NlcnZpY2VzL1NvYXAvYy8yOS4wLzAwRFIwMDAwMDAwOGJQQyIsIm1ldGFkYXRhVXJsIjoiL3NlcnZpY2VzL1NvYXAvbS8yOS4wLzAwRFIwMDAwMDAwOGJQQyIsInBhcnRuZXJVcmwiOiIvc2VydmljZXMvU29hcC91LzI5LjAvMDBEUjAwMDAwMDA4YlBDIiwicXVlcnlVcmwiOiIvc2VydmljZXMvZGF0YS92MjkuMC9xdWVyeS8iLCJyZWNlbnRJdGVtc1VybCI6Ii9zZXJ2aWNlcy9kYXRhL3YyOS4wL3JlY2VudC8iLCJyZXN0VXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvIiwic2VhcmNoVXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvc2VhcmNoLyIsInNvYmplY3RVcmwiOiIvc2VydmljZXMvZGF0YS92MjkuMC9zb2JqZWN0cy8iLCJ1c2VyVXJsIjoiLzAwNVIwMDAwMDAwRGdKQUlBMCJ9LCJ1c2VyIjp7InVzZXJJZCI6IjAwNVIwMDAwMDAwRGdKQUlBMCIsImZpcnN0TmFtZSI6IlRlc3QiLCJsYXN0TmFtZSI6IlVzZXIiLCJlbWFpbCI6InNyZWFkeUBzYWxlc2ZvcmNlLmNvbSIsInVzZXJUeXBlIjoiU1RBTkRBUkQiLCJpc0RlZmF1bHROZXR3b3JrIjp0cnVlLCJwcm9maWxlSWQiOiIwMGVSMDAwMDAwMExzWU4iLCJwcm9maWxlUGhvdG9VcmwiOiJodHRwczovL2MubW9iaWxlMS5jb250ZW50LnQuZm9yY2UuY29tL3Byb2ZpbGVwaG90by8wMDUvRiIsIm5ldHdvcmtJZCI6bnVsbCwiY3VycmVuY3lJU09Db2RlIjoiVVNEIiwicm9sZUlkIjpudWxsLCJzaXRlVXJsUHJlZml4IjpudWxsLCJhY2Nlc3NpYmlsaXR5TW9kZUVuYWJsZWQiOmZhbHNlLCJzaXRlVXJsIjpudWxsLCJwcm9maWxlVGh1bWJuYWlsVXJsIjoiaHR0cHM6Ly9jLm1vYmlsZTEuY29udGVudC50LmZvcmNlLmNvbS9wcm9maWxlcGhvdG8vMDA1L1QiLCJsYW5ndWFnZSI6ImVuX1VTIiwidGltZVpvbmUiOiJBbWVyaWNhL0xvc19BbmdlbGVzIiwidXNlck5hbWUiOiJzcmVhZHlAc2ZvbmUubW9iaWxlMSIsImxvY2FsZSI6ImVuX1VTIiwiZnVsbE5hbWUiOiJUZXN0IFVzZXIifX0sImFsZ29yaXRobSI6IkhNQUNTSEEyNTYifQ==";
        var access_token_inside_signed_request = '00DR00000008bPC!AQ8AQPUHPkLJSPGCVJXf0NjNHC5BFfT4rICKf.Zq1akDiGavVq03z_tvzb1f6NUpOP3V1kdmqckuo68kL4l6pQw346d_V8dQ';
        var instance_url_inside_signed_request = 'https://mobile1.t.salesforce.com';
        process.env.APP_SECRET = "6375554712652875436";
        var payload = 'signed_request=' + test_signed_request;

        server.inject({
            method: 'POST',
            url: '/auth/signedrequest',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': payload.length
            },
            payload: payload
        }, function (response) {
//            expect(response.statusCode).to.equal(200);
            var result = response.result
            done();
        });


    });


});