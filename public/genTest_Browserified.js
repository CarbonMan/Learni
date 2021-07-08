(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var genTest = require("genTest");
},{"genTest":2}],2:[function(require,module,exports){
exports.sample = require('./lib/sample');
exports.types = require('./lib/types');

var errors = require('./lib/errors');
exports.FailureError = errors.FailureError;
exports.GentestError = errors.GentestError;

},{"./lib/errors":5,"./lib/sample":6,"./lib/types":8}],3:[function(require,module,exports){
// Lazy rose trees and functions to operate on them.
//
// A rose tree consists of a value and an array of children,
// all of which are themselves rose trees. To make them lazy,
// the array of children is represented by a thunk.

var Thunk = require('./Thunk');

var emptyThunk = new Thunk(function() { return []; });

// Constructor. Takes root value and a zero-argument function
// to call to produce the children. If childrenFunc is not
// provided, the root has no children.
// data RoseTree a = RoseTree a (RoseTree a)
var RoseTree = function(root, childrenFunc) {
  if (!(this instanceof RoseTree)) {
    return new RoseTree(root, childrenFunc);
  }
  this.root = root;
  this._children = childrenFunc ? new Thunk(childrenFunc) : emptyThunk;
};

// "Flatten" a tree one level. (Monadic join.)
// RoseTree (RoseTree a) -> RoseTree a
function flatten(tree) {
  if (!(tree.root instanceof RoseTree)) {
    throw new TypeError("Can't call flatten when elements aren't trees");
  }

  return new RoseTree(
    tree.root.root,
    function() {
      var innerChildren = tree.root.children();
      var outerChildren = tree.children().map(flatten);
      return outerChildren.concat(innerChildren);
    }
  );
}

// (a -> b) -> RoseTree a -> RoseTree b
function fmap(f, tree) {
  return new RoseTree(
    f(tree.root),
    function() {
      return tree.children().map(fmap.bind(null, f));
    }
  );
}

// RoseTree a -> (a -> Bool) -> RoseTree a
function filterSubtrees(pred, tree) {
  return new RoseTree(
    tree.root,
    function() {
      return tree.children().filter(function(subtree) {
        return pred(subtree.root);
      }).map(filterSubtrees.bind(null, pred));
    }
  );
}

RoseTree.prototype = {
  // Returns the node's immediate children, realizing them if necessary.
  // RoseTree a -> [RoseTree a]
  children: function() {
    return this._children.get();
  },

  // Map a function over each element's value. This is fmap, but with
  // arguments reversed in keeping with the faux-OO method interface:
  // RoseTree a -> (a -> b) -> RoseTree b
  map: function(f) {
    return fmap(f, this);
  },

  // Monadic bind. Same as map but here the function is assumed to yield
  // a rose tree for each element. In Haskell, the type would be:
  // RoseTree a -> (a -> RoseTree b) -> RoseTree b
  // I didn't call this 'bind' to avoid confusion with Function#bind.
  flatmap: function(f) {
    return flatten(fmap(f, this));
  },

  // Filters out all descendants whose roots do not satisfy the predicate.
  // Does not check the root against the predicate.
  // RoseTree a -> (a -> Bool) -> RoseTree a
  filterSubtrees: function(pred) {
    return filterSubtrees(pred, this);
  }
};

module.exports = RoseTree;

},{"./Thunk":4}],4:[function(require,module,exports){
// A small wrapper for thunks that caches the realized value.
//
// Public API:
//  .get(): Forces evaluation and returns the value.

var Thunk = function(f) {
  if (!(this instanceof Thunk)) {
    return new Thunk(f);
  }

  this._f = f;
  this._realized = false;
  return this;
};

Thunk.prototype = {
  get: function() {
    if (!this._realized) {
      this._value = this._f();
      this._realized = true;
      this._f = null;  // Allow closure to be garbage-collected.
    }
    return this._value;
  }
};

module.exports = Thunk;

},{}],5:[function(require,module,exports){
var ErrorSubclass = function ErrorSubclass() {};
ErrorSubclass.prototype = Error.prototype;

var GentestError = function GentestError() {
  if (!this instanceof GentestError) {
    throw new TypeError('GentestError must be called via new');
  }
  var tmp = Error.prototype.constructor.apply(this, arguments);
  if (tmp.stack) {
    this.stack = tmp.stack.replace(/^Error/, 'GentestError');
  }
  if (tmp.message) {
    this.message = tmp.message;
  }
  this.name = 'GentestError';
  return this;
};
GentestError.prototype = new ErrorSubclass();
GentestError.prototype.constructor = GentestError;

var FailureError = function FailureError() {
  GentestError.prototype.constructor.apply(this, arguments);
  if (this.stack) {
    this.stack = this.stack.replace(/^GentestError/, 'FailureError');
  }
  this.name = 'FailureError';
};
FailureError.prototype = new GentestError();
FailureError.prototype.constructor = FailureError;

exports.GentestError = GentestError;
exports.FailureError = FailureError;

},{}],6:[function(require,module,exports){
var PRNG = require('burtleprng');

var DEFAULT_COUNT = 10;

function getRoot(tree) {
  return tree.root;
}

// TODO: should this have a size parameter? Should gentest.run be modified
// to use this routine instead of doing its own sampling?
// raw is a secret undocumented option to enable debugging gentest itself.
// If true, this returns the entire tree for each generated value so shrunk
// versions can be examined.
function sample(gen, count, raw) {
  if (arguments.length < 2) {
    count = DEFAULT_COUNT;
  }

  var rng = new PRNG(Date.now() & 0xffffffff);
  var results = new Array(count);
  for (var i = 0; i < count; i++) {
    results[i] = gen(rng, Math.floor(i/2) + 1);
  }
  return raw ? results : results.map(getRoot);
}

module.exports = sample;

},{"burtleprng":9}],7:[function(require,module,exports){
// Routines to shrink primitive types, returning a rose tree of
// "smaller" values of that type, with more drastic shrinking
// possibilities appearing first.

var RoseTree = require('./RoseTree');


// Bear with me... the next two functions may look a little
// confusing, but they enable the individual shrink functions
// to avoid dealing directly with rose trees.
//
// XXX: Is this approach still worthwhile given I only ended up
// using these on one shrink function?


// Given array and fun, returns an array of rose trees where each
// tree's root is the element and its children are fun(element).
// [a] -> (a -> [a]) -> RoseTree a
function arrayToRoseTrees(array, fun) {
  return array.map(function(element) {
    return new RoseTree(element, function() { return fun(element); });
  });
}

// Takes a shrink function that returns a list of smaller values,
// and returns a shrink function that returns a rose tree, with
// the same shrink function used for further shrinks.
//
// (a -> [a]) -> (a -> [RoseTree a])
// ... with a caveat:
//
// If f takes 2 or more args, we assume the first arg is the value
// to shrink and we replace that in recursive calls while propagating
// the rest.
function roseify(f) {
  var roseified = function() {
    var restArgs = [].slice.call(arguments, 1);
    return arrayToRoseTrees(
      f.apply(null, arguments),
      function(value) {
        return roseified.apply(null, [value].concat(restArgs));
      }
    );
  };
  return roseified;
}


// Now that we have roseify, we'll write all our shrink functions
// to simply return lists, then wrap each shrink function with
// roseify.

function roundTowardZero(x) {
  if (x < 0) {
    return Math.ceil(x);
  }
  return Math.floor(x);
}

// Shrink integer n towards center.
// If n !== center, at least center and the integer one closer to center
// are guaranteed to be tried.
exports.int = roseify(function(n, center) {
  var diff = center - n;
  var out = [];
  while (Math.abs(diff) >= 1) {
    out.push(n + roundTowardZero(diff));
    diff /= 2;
  }
  return out;
});

// Array shrinking takes an array of rose trees, so we can use the
// shrunken versions of each individual element.
// If tryRemoving is falsy, we will only shrink individual elements,
// not attempt removing elements. This makes the same shrink function
// suitable for tuples (i.e. fixed-length, heterogeneous arrays).
// shrink.array :: [RoseTree a] -> Bool -> [RoseTree [a]]
exports.array = function(xtrees, tryRemoving) {
  var withElemsRemoved = []; // [[RoseTree a]]
  var withElemsShrunk = []; // [[RoseTree a]]
  var i;

  // For each element, push a modified array with that element removed
  // to withElemsRemoved, and potentially many modified arrays with that
  // element shrunk to withElemsShrunk.
  xtrees.forEach(function(xtree, index) {
    var xtreesBefore = xtrees.slice(0, index);
    var xtreesAfter  = xtrees.slice(index + 1);

    if (tryRemoving) {
      withElemsRemoved.push(xtreesBefore.concat(xtreesAfter));
    }

    xtree.children().forEach(function(childNode) {
      var withAnElemShrunk = xtreesBefore.concat([childNode])
                                         .concat(xtreesAfter);
      withElemsShrunk.push(withAnElemShrunk);
    });
  });

  // xtreesToArray :: [RoseTree a] -> RoseTree [a]
  // FIXME: This is duplication of code in types.arrayOf.
  var xtreesToArray = function(xts) {
    return new RoseTree(
      xts.map(function(tree) { return tree.root; }),
      function() {
        return exports.array(xts, tryRemoving);
      }
    );
  };

  return withElemsRemoved.concat(withElemsShrunk).map(xtreesToArray);
};

},{"./RoseTree":3}],8:[function(require,module,exports){
// Basic generators and functions to combine them.

var RoseTree = require('./RoseTree');
var errors = require('./errors');
var shrink = require('./shrink');

var t = {};

// Returns a generator that ignores size and generates integers
// from low to high, inclusive, shrinking towards center, if
// provided.
t.choose = function(low, high, center) {
  if (arguments.length < 3) {
    center = low;
  }

  return function(rng, _size) {
    var n = Math.floor(rng.float() * (high - low + 1) + low);
    return new RoseTree(
      n,
      function() { return shrink.int(n, center); }
    );
  };
};

t.int = function(rng, size) {
  return t.choose(-size, size, 0)(rng, size);
};

t.int.nonNegative = function(rng, size) {
  return t.choose(0, size)(rng, size);
};

t.int.positive = function(rng, size) {
  return t.choose(1, size + 1)(rng, size);
};

t.suchThat = function(pred, gen, maxTries) {
  if (arguments.length < 3) maxTries = 10;

  return function(rng, size) {
    var triesLeft = maxTries;
    var tree;
    do {
      tree = gen(rng, size);
      if (pred(tree.root)) {
        return tree.filterSubtrees(pred);
      }
    } while(--triesLeft > 0);
    throw new errors.GentestError('suchThat: could not find a suitable value');
  };
};

function isNonzero(x) {
  return x !== 0;
}

t.int.nonZero = t.suchThat(isNonzero, t.int);

// FIXME: This should eventually generate non-ASCII characters, I guess.
t.char = function(rng, _size) {
  return t.choose(32, 126)(rng, _size).map(function(n) {
    return String.fromCharCode(n);
  });
};

t.arrayOf = function(elemGen) {
  return function(rng, size) {
    var len = t.int.nonNegative(rng, size).root;

    var elemTrees = new Array(len);
    for (var i = 0; i < len; i++) {
      elemTrees[i] = elemGen(rng, size);
    }

    return new RoseTree(
      elemTrees.map(function(tree) { return tree.root; }),
      function() {
        return shrink.array(elemTrees, true);
      }
    );
  };
};

t.tuple = function(gens) {
  var len = gens.length;
  return function(rng, size) {
    var elemTrees = new Array(len);
    for (var i = 0; i < len; i++) {
      elemTrees[i] = gens[i](rng, size);
    }

    return new RoseTree(
      elemTrees.map(function(tree) { return tree.root; }),
      function() {
        return shrink.array(elemTrees, false);
      }
    );
  };
};

// (a -> b) -> Gen a -> Gen b
// or
// (a -> b) -> (PRNG -> Int -> RoseTree a) -> (PRNG -> Int -> RoseTree b)
t.fmap = function(fun, gen) {
  return function(rng, size) {
    return gen(rng, size).map(fun);
  };
};

// Gen a -> (a -> Gen b) -> Gen b
// or
// (PRNG -> Int -> RoseTree a)
//  -> (a -> (PRNG -> Int -> RoseTree b))
//  -> (PRNG -> Int -> RoseTree b)
t.bind = function(gen, fun) {
  return function(rng, size) {
    return gen(rng, size).flatmap(function(value) {
      return fun(value)(rng, size);
    });
  };
};

t.string = t.fmap(function(chars) {
  return chars.join('');
}, t.arrayOf(t.char));

t.constantly = function(x) {
  return function(_rng, _size) {
    return new RoseTree(x);
  };
};

t.oneOf = function(gens) {
  if (gens.length < 1) {
    throw new errors.GentestError('Empty array passed to oneOf');
  }
  if (gens.length === 1) {
    return gens[0];
  }
  return t.bind(
    t.choose(0, gens.length-1),
    function(genIndex) {
      return gens[genIndex];
    }
  );
};

t.elements = function(elems) {
  if (elems.length < 1) {
    throw new errors.GentestError('Empty array passed to elements');
  }
  return t.oneOf(elems.map(t.constantly));
};

t.bool = t.elements([false, true]);

// Creates objects resembling the template `obj`, where each
// value in `obj` is a type generator.
t.shape = function(obj) {
  var attributeNames = [];
  var gens = [];

  Object.keys(obj).forEach(function(key) {
    attributeNames.push(key);
    gens.push(obj[key]);
  });

  var shapeify = function(tuple) {
    var obj = {};
    for (var i = 0; i < tuple.length; i++) {
      obj[attributeNames[i]] = tuple[i];
    }
    return obj;
  };

  return t.fmap(shapeify, t.tuple(gens));
};

module.exports = t;

},{"./RoseTree":3,"./errors":5,"./shrink":7}],9:[function(require,module,exports){
function BurtlePRNG(seed) {
  if (arguments.length < 1) {
    throw new TypeError('BurtlePRNG constructor requires a seed');
  }
  seed >>>= 0;
  var ctx = this.ctx = new Array(4);
  ctx[0] = 0xf1ea5eed;
  ctx[1] = ctx[2] = ctx[3] = seed;
  for (var i = 0; i < 20; i++) {
    this.next();
  }
  return this;
}

function rot(x, k) {
  return (x << k) | (x >> (32-k));
}

BurtlePRNG.prototype.next = function() {
  var ctx = this.ctx;
  var e =           (ctx[0] - rot(ctx[1], 27))>>>0;
  ctx[0] = (ctx[1] ^ rot(ctx[2], 17))>>>0;
  ctx[1] = (ctx[2] + ctx[3])>>>0;
  ctx[2] = (ctx[3] + e)>>>0;
  ctx[3] = (e      + ctx[0])>>>0;
  return ctx[3];
};

BurtlePRNG.prototype['float'] = function() {
  return this.next() / 4294967296.0;
};

if (typeof module === 'object') {
  module.exports = BurtlePRNG;
}

},{}]},{},[1]);
