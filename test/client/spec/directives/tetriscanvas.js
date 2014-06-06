'use strict';

describe('Directive: tetrisCanvas', function () {

  // load the directive's module
  beforeEach(module('gameRtcApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<tetris-canvas></tetris-canvas>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the tetrisCanvas directive');
  }));
});
