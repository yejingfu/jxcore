// Copyright & License details are available under JXCORE_LICENSE file

var common = require('../common');
var assert = require('assert');
var util = require('util');

// test the internal isDate implementation
var Date2 = require('vm').runInNewContext('Date');
var d = new Date2();
var orig = util.inspect(d);
Date2.prototype.foo = 'bar';
var after = util.inspect(d);
assert.equal(orig, after);

// test for sparse array
var a = ['foo', 'bar', 'baz'];
assert.equal(util.inspect(a), '[ \'foo\', \'bar\', \'baz\' ]');
delete a[1];
assert.equal(util.inspect(a), '[ \'foo\', , \'baz\' ]');
assert.equal(util.inspect(a, true), '[ \'foo\', , \'baz\', [length]: 3 ]');
assert.equal(util.inspect(new Array(5)), '[ , , , ,  ]');

// test for property descriptors
var getter = Object.create(null, {
  a: {
    get: function() { return 'aaa'; }
  }
});
var setter = Object.create(null, {
  b: {
    set: function() {}
  }
});
var getterAndSetter = Object.create(null, {
  c: {
    get: function() { return 'ccc'; },
    set: function() {}
  }
});
assert.equal(util.inspect(getter, true), '{ [a]: [Getter] }');
assert.equal(util.inspect(setter, true), '{ [b]: [Setter] }');
assert.equal(util.inspect(getterAndSetter, true), '{ [c]: [Getter/Setter] }');

// exceptions should print the error message, not '{}'
assert.equal(util.inspect(new Error()), '[Error]');
assert.equal(util.inspect(new Error('FAIL')), '[Error: FAIL]');
assert.equal(util.inspect(new TypeError('FAIL')), '[TypeError: FAIL]');
assert.equal(util.inspect(new SyntaxError('FAIL')), '[SyntaxError: FAIL]');
try {
  undef();
} catch (e) {
  if (process.versions.ch)
    assert.equal(util.inspect(e), '[ReferenceError: \'undef\' is undefined]');
  else
    assert.equal(util.inspect(e), '[ReferenceError: undef is not defined]');
}
var ex = util.inspect(new Error('FAIL'), true);
assert.ok(ex.indexOf('[Error: FAIL]') != -1);
assert.ok(ex.indexOf('[stack]') != -1);
assert.ok(ex.indexOf('[message]') != -1);

// GH-1941
// should not throw:
assert.equal(util.inspect(Object.create(Date.prototype)), '{}');

// GH-1944
assert.doesNotThrow(function() {
  var d = new Date();
  d.toUTCString = null;
  util.inspect(d);
});

assert.doesNotThrow(function() {
  var r = /regexp/;
  r.toString = null;
  util.inspect(r);
});

// bug with user-supplied inspect function returns non-string
assert.doesNotThrow(function() {
  util.inspect([{
    inspect: function() { return 123; }
  }]);
});

// GH-2225
var x = { inspect: util.inspect };
assert.ok(util.inspect(x).indexOf('inspect') != -1);

// util.inspect.styles and util.inspect.colors
function test_color_style(style, input, implicit) {
  var color_name = util.inspect.styles[style];
  var color = ['', ''];
  if(util.inspect.colors[color_name])
    color = util.inspect.colors[color_name];

  var without_color = util.inspect(input, false, 0, false);
  var with_color = util.inspect(input, false, 0, true);
  var expect = '\u001b[' + color[0] + 'm' + without_color +
               '\u001b[' + color[1] + 'm';
  assert.equal(with_color, expect, 'util.inspect color for style '+style);
}

test_color_style('special', function(){});
test_color_style('number', 123.456);
test_color_style('boolean', true);
test_color_style('undefined', undefined);
test_color_style('null', null);
test_color_style('string', 'test string');
test_color_style('date', new Date);
test_color_style('regexp', /regexp/);

// an object with "hasOwnProperty" overwritten should not throw
assert.doesNotThrow(function() {
  util.inspect({
    hasOwnProperty: null
  });
});

// new API, accepts an "options" object
var subject = { foo: 'bar', hello: 31, a: { b: { c: { d: 0 } } } };
Object.defineProperty(subject, 'hidden', { enumerable: false, value: null });

assert(util.inspect(subject, { showHidden: false }).indexOf('hidden') === -1);
assert(util.inspect(subject, { showHidden: true }).indexOf('hidden') !== -1);
assert(util.inspect(subject, { colors: false }).indexOf('\u001b[32m') === -1);
assert(util.inspect(subject, { colors: true }).indexOf('\u001b[32m') !== -1);
assert(util.inspect(subject, { depth: 2 }).indexOf('c: [Object]') !== -1);
assert(util.inspect(subject, { depth: 0 }).indexOf('a: [Object]') !== -1);
assert(util.inspect(subject, { depth: null }).indexOf('{ d: 0 }') !== -1);

// "customInspect" option can enable/disable calling inspect() on objects
subject = { inspect: function() { return 123; } };

assert(util.inspect(subject, { customInspect: true }).indexOf('123') !== -1);
assert(util.inspect(subject, { customInspect: true }).indexOf('inspect') === -1);
assert(util.inspect(subject, { customInspect: false }).indexOf('123') === -1);
assert(util.inspect(subject, { customInspect: false }).indexOf('inspect') !== -1);