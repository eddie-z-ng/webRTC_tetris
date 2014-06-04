'use strict';

describe('Service: HeadTrackerMedia', function () {

  // load the service's module
  beforeEach(module('gameRtcApp'));

  // instantiate service
  var HeadTrackerMedia;
  beforeEach(inject(function (_HeadTrackerMedia_) {
    HeadTrackerMedia = _HeadTrackerMedia_;
  }));

  it('should do something', function () {
    expect(!!HeadTrackerMedia).toBe(true);
  });

});
