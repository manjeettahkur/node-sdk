'use strict';

var expect = require('chai').use(require('dirty-chai')).expect;
var nock = require('nock');
var util = require('../lib/util');
var config = require('../lib/config');

var VALID_TOKEN = 'valid-token';
var VALID_AUTHORIZATION = 'Bearer ' + VALID_TOKEN;
var VALID_VID = 'valid-vid';
var VALID_ENDPOINT = 'valid-endpoint';
var VALID_ACTION = 'valid-action';
var IMPERIAL_DATA = 'imperial-data';
var API_URL = config.api + '/v' + config.version;
var SUCCESS = { status: 'success' };

suite('Util', function() {
  suiteSetup(function() {
    var apiNock = nock(config.api + '/v' + config.version).persist();

    apiNock
      .get('/vehicles')
      .matchHeader('Authorization', VALID_AUTHORIZATION)
      .reply(200, { vehicles: ['fakecar'] });

    apiNock
      .get('/vehicles/'+ VALID_VID + '/barometer')
      .matchHeader('Authorization', VALID_AUTHORIZATION)
      .reply(200, {pressure: 1000});

    apiNock
      .post('/vehicles/' + VALID_VID + '/sunroof')
      .matchHeader('Authorization', VALID_AUTHORIZATION)
      .reply(200, SUCCESS);

    apiNock
      .post('/vehicles/' + VALID_VID + '/panic')
      .matchHeader('Authorization', VALID_AUTHORIZATION)
      .reply(200, SUCCESS);

    apiNock
      .post('/vehicles/' + VALID_VID + '/' + VALID_ENDPOINT)
      .matchHeader('smartcar-unit', 'imperial')
      .reply(200, IMPERIAL_DATA);

    apiNock
      .get('/vehicles/' + VALID_VID + '/' + VALID_ENDPOINT)
      .matchHeader('smartcar-unit', 'imperial')
      .reply(200, IMPERIAL_DATA);
  });

  suiteTeardown(function() {
    nock.cleanAll();
  });

  test('getUrl with id and endpoint', function() {
    var url = util.getUrl(VALID_VID, 'odometer');
    expect(url).to
    .equal(API_URL + '/vehicles/' + VALID_VID + '/odometer');
  });

  test('getUrl with no id or endpoint', function() {
    var url = util.getUrl();
    expect(url).to.equal(API_URL + '/vehicles');
  });

  test('get vehicles', function(done) {
    return util.get({
      token: VALID_TOKEN,
      endpoint: null,
      vid: null,
      key: null,
    })()
    .then(function(response) {
      expect(response).to.have.all.keys('vehicles');
      expect(response.vehicles).to.have.length(1);
      done();
    });
  });

  test('get with a key and vid', function(done) {
    return util.get({
      token: VALID_TOKEN,
      endpoint: 'barometer',
      vid: VALID_VID,
      key: 'pressure',
    })()
    .then(function(response) {
      expect(response).to.be.a('number');
      done();
    });
  });

  test('get with imperial', function(done){
    return util.get({
      token: VALID_TOKEN,
      endpoint: VALID_ENDPOINT,
      vid: VALID_VID
    })({imperial: true})
    .then(function(response){
      expect(response).to.equal(IMPERIAL_DATA);
      done();
    });
  });

  test('action with a key and argument', function(done) {
    return util.action({
      token: VALID_TOKEN,
      endpoint: 'sunroof',
      vid: VALID_VID,
      action: 'OPEN',
      key: 'percentOpen',
    })(0.5)
    .then(function(response) {
      expect(response).to.have.all.keys('status');
      expect(response.status).to.equal('success');
      done();
    });
  });

  test('action with no key or argument', function(done) {
    return util.action({
      token: VALID_TOKEN,
      endpoint: 'panic',
      vid: VALID_VID,
      action: 'START',
    })()
    .then(function(response) {
      expect(response).to.have.all.keys('status');
      expect(response.status).to.equal('success');
      done();
    });
  });

  test('action with imperial', function(done){
    return util.action({
      token: VALID_TOKEN,
      endpoint: VALID_ENDPOINT,
      vid: VALID_VID,
      action: VALID_ACTION,
    })('fakearg', {imperial: true})
    .then(function(response){
      expect(response).to.equal(IMPERIAL_DATA);
      done();
    });
  });
});
