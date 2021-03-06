
/**
 * @fileoverview The configuration.
 */

(function(util, data, fn, global) {

  var config = data.config;
  var noCacheTimeStamp = 'seajs-ts=' + util.now();


  // Async inserted script.
  var loaderScript = document.getElementById('seajsnode');

  // Static script.
  if (!loaderScript) {
    var scripts = document.getElementsByTagName('script');
    loaderScript = scripts[scripts.length - 1];
  }

  var loaderSrc = util.getScriptAbsoluteSrc(loaderScript), loaderDir;
  if (loaderSrc) {
    var base = loaderDir = util.dirname(loaderSrc);
    // When src is "http://test.com/libs/seajs/1.0.0/sea.js", redirect base
    // to "http://test.com/libs/"
    var match = base.match(/^(.+\/)seajs\/[\d\.]+\/$/);
    if (match) {
      base = match[1];
    }
    config.base = base;
  }
  // When script is inline code, src is empty.


  var mainAttr = loaderScript.getAttribute('data-main');
  if (mainAttr) {
    // data-main="abc" is equivalent to data-main="./abc"
    if (util.isTopLevel(mainAttr)) {
      mainAttr = './' + mainAttr;
    }
    config.main = mainAttr;
  }


  // The max time to load a script file.
  config.timeout = 20000;


  // seajs-debug
  if (loaderDir &&
      (global.location.search.indexOf('seajs-debug') !== -1 ||
          document.cookie.indexOf('seajs=1') !== -1)) {
    config.debug = true;
    config.preload.push(loaderDir + 'plugin-map');
  }


  /**
   * The function to configure the framework.
   * config({
   *   'base': 'path/to/base',
   *   'alias': {
   *     'app': 'biz/xx',
   *     'jquery': 'jquery-1.5.2',
   *     'cart': 'cart?t=20110419'
   *   },
   *   'map': [
   *     ['test.cdn.cn', 'localhost']
   *   ],
   *   preload: [],
   *   charset: 'utf-8',
   *   timeout: 20000, // 20s
   *   debug: false,
   *   main: './init'
   * });
   *
   * @param {Object} o The config object.
   */
  fn.config = function(o) {
    for (var k in o) {
      var previous = config[k];
      var current = o[k];

      if (previous && k === 'alias') {
        for (var p in current) {
          if (current.hasOwnProperty(p)) {
            checkConflict(previous[p], current[p]);
            previous[p] = current[p];
          }
        }
      }
      else if (previous && (k === 'map' || k === 'preload')) {
        // for config({ preload: 'some-module' })
        if (!util.isArray(current)) {
          current = [current];
        }
        util.forEach(current, function(item) {
          if (item) { // Ignore empty string.
            previous.push(item);
          }
        });
        // NOTICE: no need to check conflict for map and preload.
      }
      else {
        config[k] = current;
      }
    }

    // Make sure config.base is absolute path.
    var base = config.base;
    if (!util.isAbsolute(base)) {
      config.base = util.id2Uri(base + '#');
    }

    // use map to implement nocache
    if (config.debug === 2) {
      config.debug = 1;
      fn.config({
        map: [
          [/.*/, function(url) {
            return url +
                (url.indexOf('?') === -1 ? '?' : '&') +
                noCacheTimeStamp;
          }, -1]
        ]
      });
    }

    return this;
  };


  function checkConflict(previous, current) {
    if (previous !== undefined && previous !== current) {
      util.error({
        'message': 'config is conflicted',
        'previous': previous,
        'current': current,
        'from': 'config',
        'type': 'error'
      });
    }
  }

})(seajs._util, seajs._data, seajs._fn, this);
