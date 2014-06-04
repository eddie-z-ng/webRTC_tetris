'use strict';

describe('Service: PeerConnect', function () {

  // load the service's module
  beforeEach(module('gameRtcApp'));

  // instantiate service
  var PeerConnect;
  beforeEach(inject(function (_PeerConnect_) {
    PeerConnect = _PeerConnect_;
  }));

  it('should do something', function () {
    expect(!!PeerConnect).toBe(true);
  });

});
