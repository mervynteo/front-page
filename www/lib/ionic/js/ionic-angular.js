/*!
 * Copyright 2014 Drifty Co.
 * http://drifty.com/
 *
 * Ionic, v1.0.0-beta.13
 * A powerful HTML5 mobile app framework.
 * http://ionicframework.com/
 *
 * By @maxlynch, @benjsperry, @adamdbradley <3
 *
 * Licensed under the MIT license. Please see LICENSE for more information.
 *
 */

(function() {
/*
 * deprecated.js
 * https://github.com/wearefractal/deprecated/
 * Copyright (c) 2014 Fractal <contact@wearefractal.com>
 * License MIT
 */
//Interval object
var deprecated = {
  method: function(msg, log, fn) {
    var called = false;
    return function deprecatedMethod(){
      if (!called) {
        called = true;
        log(msg);
      }
      return fn.apply(this, arguments);
    };
  },

  field: function(msg, log, parent, field, val) {
    var called = false;
    var getter = function(){
      if (!called) {
        called = true;
        log(msg);
      }
      return val;
    };
    var setter = function(v) {
      if (!called) {
        called = true;
        log(msg);
      }
      val = v;
      return v;
    };
    Object.defineProperty(parent, field, {
      get: getter,
      set: setter,
      enumerable: true
    });
    return;
  }
};


var IonicModule = angular.module('ionic', ['ngAnimate', 'ngSanitize', 'ui.router']),
  extend = angular.extend,
  forEach = angular.forEach,
  isDefined = angular.isDefined,
  isNumber = angular.isNumber,
  isString = angular.isString,
  jqLite = angular.element;


/**
 * @ngdoc service
 * @name $ionicActionSheet
 * @module ionic
 * @description
 * The Action Sheet is a slide-up pane that lets the user choose from a set of options.
 * Dangerous options are highlighted in red and made obvious.
 *
 * There are easy ways to cancel out of the action sheet, such as tapping the backdrop or even
 * hitting escape on the keyboard for desktop testing.
 *
 * ![Action Sheet](http://ionicframework.com.s3.amazonaws.com/docs/controllers/actionSheet.gif)
 *
 * @usage
 * To trigger an Action Sheet in your code, use the $ionicActionSheet service in your angular controllers:
 *
 * ```js
 * angular.module('mySuperApp', ['ionic'])
 * .controller(function($scope, $ionicActionSheet, $timeout) {
 *
 *  // Triggered on a button click, or some other target
 *  $scope.show = function() {
 *
 *    // Show the action sheet
 *    var hideSheet = $ionicActionSheet.show({
 *      buttons: [
 *        { text: '<b>Share</b> This' },
 *        { text: 'Move' }
 *      ],
 *      destructiveText: 'Delete',
 *      titleText: 'Modify your album',
 *      cancelText: 'Cancel',
 *      cancel: function() {
          // add cancel code..
        },
 *      buttonClicked: function(index) {
 *        return true;
 *      }
 *    });
 *
 *    // For example's sake, hide the sheet after two seconds
 *    $timeout(function() {
 *      hideSheet();
 *    }, 2000);
 *
 *  };
 * });
 * ```
 *
 */
IonicModule
.factory('$ionicActionSheet', [
  '$rootScope',
  '$compile',
  '$animate',
  '$timeout',
  '$ionicTemplateLoader',
  '$ionicPlatform',
  '$ionicBody',
function($rootScope, $compile, $animate, $timeout, $ionicTemplateLoader, $ionicPlatform, $ionicBody) {

  return {
    show: actionSheet
  };

  /**
   * @ngdoc method
   * @name $ionicActionSheet#show
   * @description
   * Load and return a new action sheet.
   *
   * A new isolated scope will be created for the
   * action sheet and the new element will be appended into the body.
   *
   * @param {object} options The options for this ActionSheet. Properties:
   *
   *  - `[Object]` `buttons` Which buttons to show.  Each button is an object with a `text` field.
   *  - `{string}` `titleText` The title to show on the action sheet.
   *  - `{string=}` `cancelText` the text for a 'cancel' button on the action sheet.
   *  - `{string=}` `destructiveText` The text for a 'danger' on the action sheet.
   *  - `{function=}` `cancel` Called if the cancel button is pressed, the backdrop is tapped or
   *     the hardware back button is pressed.
   *  - `{function=}` `buttonClicked` Called when one of the non-destructive buttons is clicked,
   *     with the index of the button that was clicked and the button object. Return true to close
   *     the action sheet, or false to keep it opened.
   *  - `{function=}` `destructiveButtonClicked` Called when the destructive button is clicked.
   *     Return true to close the action sheet, or false to keep it opened.
   *  -  `{boolean=}` `cancelOnStateChange` Whether to cancel the actionSheet when navigating
   *     to a new state.  Default true.
   *
   * @returns {function} `hideSheet` A function which, when called, hides & cancels the action sheet.
   */
  function actionSheet(opts) {
    var scope = $rootScope.$new(true);

    angular.extend(scope, {
      cancel: angular.noop,
      destructiveButtonClicked: angular.noop,
      buttonClicked: angular.noop,
      $deregisterBackButton: angular.noop,
      buttons: [],
      cancelOnStateChange: true
    }, opts || {});


    // Compile the template
    var element = scope.element = $compile('<ion-action-sheet buttons="buttons"></ion-action-sheet>')(scope);

    // Grab the sheet element for animation
    var sheetEl = jqLite(element[0].querySelector('.action-sheet-wrapper'));

    var stateChangeListenDone = scope.cancelOnStateChange ?
      $rootScope.$on('$stateChangeSuccess', function() { scope.cancel(); }) :
      angular.noop;

    // removes the actionSheet from the screen
    scope.removeSheet = function(done) {
      if (scope.removed) return;

      scope.removed = true;
      sheetEl.removeClass('action-sheet-up');
      $timeout(function(){
        // wait to remove this due to a 300ms delay native
        // click which would trigging whatever was underneath this
        $ionicBody.removeClass('action-sheet-open');
      }, 400);
      scope.$deregisterBackButton();
      stateChangeListenDone();

      $animate.removeClass(element, 'active').then(function() {
        scope.$destroy();
        element.remove();
        // scope.cancel.$scope is defined near the bottom
        scope.cancel.$scope = sheetEl = null;
        (done || angular.noop)();
      });
    };

    scope.showSheet = function(done) {
      if (scope.removed) return;

      $ionicBody.append(element)
                .addClass('action-sheet-open');

      $animate.addClass(element, 'active').then(function() {
        if (scope.removed) return;
        (done || angular.noop)();
      });
      $timeout(function(){
        if (scope.removed) return;
        sheetEl.addClass('action-sheet-up');
      }, 20, false);
    };

    // registerBackButtonAction returns a callback to deregister the action
    scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(
      function() {
        $timeout(scope.cancel);
      },
      PLATFORM_BACK_BUTTON_PRIORITY_ACTION_SHEET
    );

    // called when the user presses the cancel button
    scope.cancel = function() {
      // after the animation is out, call the cancel callback
      scope.removeSheet(opts.cancel);
    };

    scope.buttonClicked = function(index) {
      // Check if the button click event returned true, which means
      // we can close the action sheet
      if (opts.buttonClicked(index, opts.buttons[index]) === true) {
        scope.removeSheet();
      }
    };

    scope.destructiveButtonClicked = function() {
      // Check if the destructive button click event returned true, which means
      // we can close the action sheet
      if (opts.destructiveButtonClicked() === true) {
        scope.removeSheet();
      }
    };

    scope.showSheet();

    // Expose the scope on $ionicActionSheet's return value for the sake
    // of testing it.
    scope.cancel.$scope = scope;

    return scope.cancel;
  }
}]);


jqLite.prototype.addClass = function(cssClasses) {
  var x, y, cssClass, el, splitClasses, existingClasses;
  if (cssClasses && cssClasses != 'ng-scope' && cssClasses != 'ng-isolate-scope') {
    for(x=0; x<this.length; x++) {
      el = this[x];
      if(el.setAttribute) {

        if(cssClasses.indexOf(' ') < 0 && el.classList.add) {
          el.classList.add(cssClasses);
        } else {
          existingClasses = (' ' + (el.getAttribute('class') || '') + ' ')
            .replace(/[\n\t]/g, " ");
          splitClasses = cssClasses.split(' ');

          for (y=0; y<splitClasses.length; y++) {
            cssClass = splitClasses[y].trim();
            if (existingClasses.indexOf(' ' + cssClass + ' ') === -1) {
              existingClasses += cssClass + ' ';
            }
          }
          el.setAttribute('class', existingClasses.trim());
        }
      }
    }
  }
  return this;
};

jqLite.prototype.removeClass = function(cssClasses) {
  var x, y, splitClasses, cssClass, el;
  if (cssClasses) {
    for(x=0; x<this.length; x++) {
      el = this[x];
      if(el.getAttribute) {
        if(cssClasses.indexOf(' ') < 0 && el.classList.remove) {
          el.classList.remove(cssClasses);
        } else {
          splitClasses = cssClasses.split(' ');

          for (y=0; y<splitClasses.length; y++) {
            cssClass = splitClasses[y];
            el.setAttribute('class', (
                (" " + (el.getAttribute('class') || '') + " ")
                .replace(/[\n\t]/g, " ")
                .replace(" " + cssClass.trim() + " ", " ")).trim()
            );
          }
        }
      }
    }
  }
  return this;
};


/**
 * @private
 */
IonicModule
.factory('$$ionicAttachDrag', [function() {

  return attachDrag;

  function attachDrag(scope, element, options) {
    var opts = extend({}, {
      getDistance: function() { return opts.element.prop('offsetWidth'); },
      onDragStart: angular.noop,
      onDrag: angular.noop,
      onDragEnd: angular.noop,
    }, options);

    var dragStartGesture = ionic.onGesture('dragstart', handleDragStart, element[0]);
    var dragGesture = ionic.onGesture('drag', handleDrag, element[0]);
    var dragEndGesture = ionic.onGesture('dragend', handleDragEnd, element[0]);

    scope.$on('$destroy', function() {
      ionic.offGesture(dragStartGesture, 'dragstart', handleDragStart);
      ionic.offGesture(dragGesture, 'drag', handleDrag);
      ionic.offGesture(dragEndGesture, 'dragend', handleDragEnd);
    });

    element.on('touchmove pointermove mousemove', function(ev) {
      if (dragState && dragState.dragging) ev.preventDefault();
    });

    var dragState;
    function handleDragStart(ev) {
      if (dragState) return;
      dragState = {
        startX: ev.gesture.center.pageX,
        startY: ev.gesture.center.pageY,
        distance: opts.getDistance()
      };
      opts.onDragStart();
    }
    function handleDrag(ev) {
      if (!dragState) return;
      var deltaX = dragState.startX - ev.gesture.center.pageX;
      var deltaY = dragState.startY - ev.gesture.center.pageY;
      var isVertical = ev.gesture.direction === 'up' || ev.gesture.direction === 'down';

      if (isVertical && Math.abs(deltaY) > Math.abs(deltaX) * 2) {
        handleDragEnd(ev);
        return;
      }
      dragState.dragging = true;

      var percent = getDragPercent(ev.gesture.center.pageX);
      opts.onDrag(percent);
    }
    function handleDragEnd(ev) {
      if (!dragState) return;
      var percent = getDragPercent(ev.gesture.center.pageX);
      options.onDragEnd(percent, ev.gesture.velocityX);

      dragState = null;
    }

    function getDragPercent(x) {
      var delta = dragState.startX - x;
      var percent = delta / dragState.distance;
      return percent;
    }
  }

}]);

/**
 * @ngdoc service
 * @name $ionicBackdrop
 * @module ionic
 * @description
 * Shows and hides a backdrop over the UI.  Appears behind popups, loading,
 * and other overlays.
 *
 * Often, multiple UI components require a backdrop, but only one backdrop is
 * ever needed in the DOM at a time.
 *
 * Therefore, each component that requires the backdrop to be shown calls
 * `$ionicBackdrop.retain()` when it wants the backdrop, then `$ionicBackdrop.release()`
 * when it is done with the backdrop.
 *
 * For each time `retain` is called, the backdrop will be shown until `release` is called.
 *
 * For example, if `retain` is called three times, the backdrop will be shown until `release`
 * is called three times.
 *
 * @usage
 *
 * ```js
 * function MyController($scope, $ionicBackdrop, $timeout) {
 *   //Show a backdrop for one second
 *   $scope.action = function() {
 *     $ionicBackdrop.retain();
 *     $timeout(function() {
 *       $ionicBackdrop.release();
 *     }, 1000);
 *   };
 * }
 * ```
 */
IonicModule
.factory('$ionicBackdrop', [
  '$document', '$timeout',
function($document, $timeout) {

  var el = jqLite('<div class="backdrop">');
  var backdropHolds = 0;

  $document[0].body.appendChild(el[0]);

  return {
    /**
     * @ngdoc method
     * @name $ionicBackdrop#retain
     * @description Retains the backdrop.
     */
    retain: retain,
    /**
     * @ngdoc method
     * @name $ionicBackdrop#release
     * @description
     * Releases the backdrop.
     */
    release: release,

    getElement: getElement,

    // exposed for testing
    _element: el
  };

  function retain() {
    if ( (++backdropHolds) === 1 ) {
      el.addClass('visible');
      ionic.requestAnimationFrame(function() {
        backdropHolds && el.addClass('active');
      });
    }
  }
  function release() {
    if ( (--backdropHolds) === 0 ) {
      el.removeClass('active');
      $timeout(function() {
        !backdropHolds && el.removeClass('visible');
      }, 400, false);
    }
  }

  function getElement() {
    return el;
  }

}]);

/**
 * @private
 */
IonicModule
.factory('$ionicBind', ['$parse', '$interpolate', function($parse, $interpolate) {
  var LOCAL_REGEXP = /^\s*([@=&])(\??)\s*(\w*)\s*$/;
  return function(scope, attrs, bindDefinition) {
    forEach(bindDefinition || {}, function (definition, scopeName) {
      //Adapted from angular.js $compile
      var match = definition.match(LOCAL_REGEXP) || [],
        attrName = match[3] || scopeName,
        mode = match[1], // @, =, or &
        parentGet,
        unwatch;

      switch(mode) {
        case '@':
          if (!attrs[attrName]) {
            return;
          }
          attrs.$observe(attrName, function(value) {
            scope[scopeName] = value;
          });
          // we trigger an interpolation to ensure
          // the value is there for use immediately
          if (attrs[attrName]) {
            scope[scopeName] = $interpolate(attrs[attrName])(scope);
          }
          break;

        case '=':
          if (!attrs[attrName]) {
            return;
          }
          unwatch = scope.$watch(attrs[attrName], function(value) {
            scope[scopeName] = value;
          });
          //Destroy parent scope watcher when this scope is destroyed
          scope.$on('$destroy', unwatch);
          break;

        case '&':
          /* jshint -W044 */
          if (attrs[attrName] && attrs[attrName].match(RegExp(scopeName + '\(.*?\)'))) {
            throw new Error('& expression binding "' + scopeName + '" looks like it will recursively call "' +
                          attrs[attrName] + '" and cause a stack overflow! Please choose a different scopeName.');
          }
          parentGet = $parse(attrs[attrName]);
          scope[scopeName] = function(locals) {
            return parentGet(scope, locals);
          };
          break;
      }
    });
  };
}]);

/**
 * @ngdoc service
 * @name $ionicBody
 * @module ionic
 * @description An angular utility service to easily and efficiently
 * add and remove CSS classes from the document's body element.
 */
IonicModule
.factory('$ionicBody', ['$document', function($document) {
  return {
    /**
     * @ngdoc method
     * @name $ionicBody#add
     * @description Add a class to the document's body element.
     * @param {string} class Each argument will be added to the body element.
     * @returns {$ionicBody} The $ionicBody service so methods can be chained.
     */
    addClass: function() {
      for(var x=0; x<arguments.length; x++) {
        $document[0].body.classList.add(arguments[x]);
      }
      return this;
    },
    /**
     * @ngdoc method
     * @name $ionicBody#removeClass
     * @description Remove a class from the document's body element.
     * @param {string} class Each argument will be removed from the body element.
     * @returns {$ionicBody} The $ionicBody service so methods can be chained.
     */
    removeClass: function() {
      for(var x=0; x<arguments.length; x++) {
        $document[0].body.classList.remove(arguments[x]);
      }
      return this;
    },
    /**
     * @ngdoc method
     * @name $ionicBody#enableClass
     * @description Similar to the `add` method, except the first parameter accepts a boolean
     * value determining if the class should be added or removed. Rather than writing user code,
     * such as "if true then add the class, else then remove the class", this method can be
     * given a true or false value which reduces redundant code.
     * @param {boolean} shouldEnableClass A true/false value if the class should be added or removed.
     * @param {string} class Each remaining argument would be added or removed depending on
     * the first argument.
     * @returns {$ionicBody} The $ionicBody service so methods can be chained.
     */
    enableClass: function(shouldEnableClass) {
      var args = Array.prototype.slice.call(arguments).slice(1);
      if(shouldEnableClass) {
        this.addClass.apply(this, args);
      } else {
        this.removeClass.apply(this, args);
      }
      return this;
    },
    /**
     * @ngdoc method
     * @name $ionicBody#append
     * @description Append a child to the document's body.
     * @param {element} element The element to be appended to the body. The passed in element
     * can be either a jqLite element, or a DOM element.
     * @returns {$ionicBody} The $ionicBody service so methods can be chained.
     */
    append: function(ele) {
      $document[0].body.appendChild( ele.length ? ele[0] : ele );
      return this;
    },
    /**
     * @ngdoc method
     * @name $ionicBody#get
     * @description Get the document's body element.
     * @returns {element} Returns the document's body element.
     */
    get: function() {
      return $document[0].body;
    }
  };
}]);

IonicModule
.factory('$ionicClickBlock', [
  '$document',
  '$ionicBody',
  '$timeout',
function($document, $ionicBody, $timeout) {
  var fallbackTimer, isAttached, isShowing;
  var CSS_HIDE = 'click-block-hide';

  var cb = $document[0].createElement('div');
  cb.className = 'click-block';

  return {
    show: function() {
      if (isShowing) return;

      // cancel the fallback timer
      $timeout.cancel( fallbackTimer );

      ionic.requestAnimationFrame(function(){
        isShowing = true;
        if(isAttached) {
          cb.classList.remove(CSS_HIDE);
        } else {
          $ionicBody.append(cb);
          isAttached = true;
        }
      });

      fallbackTimer = $timeout(function(){
        cb.classList.add(CSS_HIDE);
      }, 750);
    },
    hide: function() {
      if (!isShowing) return;

      // cancel the fallback timer
      $timeout.cancel( fallbackTimer );

      // should be a minimum time it should hide
      ionic.requestAnimationFrame(function(){
        cb.classList.add(CSS_HIDE);
        isShowing = false;
      });
    }
  };
}]);

IonicModule
.factory('$collectionDataSource', [
  '$cacheFactory',
  '$parse',
  '$rootScope',
function($cacheFactory, $parse, $rootScope) {
  function hideWithTransform(element) {
    element.css(ionic.CSS.TRANSFORM, 'translate3d(-2000px,-2000px,0)');
  }

  function CollectionRepeatDataSource(options) {
    var self = this;
    this.scope = options.scope;
    this.transcludeFn = options.transcludeFn;
    this.transcludeParent = options.transcludeParent;
    this.element = options.element;

    this.keyExpr = options.keyExpr;
    this.listExpr = options.listExpr;
    this.trackByExpr = options.trackByExpr;

    this.heightGetter = options.heightGetter;
    this.widthGetter = options.widthGetter;

    this.dimensions = [];
    this.data = [];

    this.attachedItems = {};
    this.BACKUP_ITEMS_LENGTH = 20;
    this.backupItemsArray = [];
  }
  CollectionRepeatDataSource.prototype = {
    setup: function() {
      if (this.isSetup) return;
      this.isSetup = true;
      for (var i = 0; i < this.BACKUP_ITEMS_LENGTH; i++) {
        this.detachItem(this.createItem());
      }
    },
    destroy: function() {
      this.dimensions.length = 0;
      this.data = null;
      this.backupItemsArray.length = 0;
      this.attachedItems = {};
    },
    calculateDataDimensions: function() {
      var locals = {};
      this.dimensions = this.data.map(function(value, index) {
        locals[this.keyExpr] = value;
        locals.$index = index;
        return {
          width: this.widthGetter(this.scope, locals),
          height: this.heightGetter(this.scope, locals)
        };
      }, this);
      this.dimensions = this.beforeSiblings.concat(this.dimensions).concat(this.afterSiblings);
      this.dataStartIndex = this.beforeSiblings.length;
    },
    createItem: function() {
      var item = {};

      item.scope = this.scope.$new();
      this.transcludeFn(item.scope, function(clone) {
        clone.css('position', 'absolute');
        item.element = clone;
      });
      this.transcludeParent.append(item.element);

      return item;
    },
    getItem: function(index) {
      var item;
      if ( (item = this.attachedItems[index]) ) {
        //do nothing, the item is good
      } else if ( (item = this.backupItemsArray.pop()) ) {
        ionic.Utils.reconnectScope(item.scope);
      } else {
        item = this.createItem();
      }
      return item;
    },
    attachItemAtIndex: function(index) {
      if (index < this.dataStartIndex) {
        return this.beforeSiblings[index];
      }
      // Subtract so we start at the beginning of this.data, after
      // this.beforeSiblings.
      index -= this.dataStartIndex;

      if (index > this.data.length - 1) {
        return this.afterSiblings[index - this.dataStartIndex];
      }

      var item = this.getItem(index);
      var value = this.data[index];

      if (item.index !== index || item.scope[this.keyExpr] !== value) {
        item.index = item.scope.$index = index;
        item.scope[this.keyExpr] = value;
        item.scope.$first = (index === 0);
        item.scope.$last = (index === (this.getLength() - 1));
        item.scope.$middle = !(item.scope.$first || item.scope.$last);
        item.scope.$odd = !(item.scope.$even = (index&1) === 0);

        //We changed the scope, so digest if needed
        if (!$rootScope.$$phase) {
          item.scope.$digest();
        }
      }
      this.attachedItems[index] = item;

      return item;
    },
    destroyItem: function(item) {
      item.element.remove();
      item.scope.$destroy();
      item.scope = null;
      item.element = null;
    },
    detachItem: function(item) {
      delete this.attachedItems[item.index];

      //If it's an outside item, only hide it. These items aren't part of collection
      //repeat's list, only sit outside
      if (item.isOutside) {
        hideWithTransform(item.element);
      // If we are at the limit of backup items, just get rid of the this element
      } else if (this.backupItemsArray.length >= this.BACKUP_ITEMS_LENGTH) {
        this.destroyItem(item);
      // Otherwise, add it to our backup items
      } else {
        this.backupItemsArray.push(item);
        hideWithTransform(item.element);
        //Don't .$destroy(), just stop watchers and events firing
        ionic.Utils.disconnectScope(item.scope);
      }

    },
    getLength: function() {
      return this.dimensions && this.dimensions.length || 0;
    },
    setData: function(value, beforeSiblings, afterSiblings) {
      this.data = value || [];
      this.beforeSiblings = beforeSiblings || [];
      this.afterSiblings = afterSiblings || [];
      this.calculateDataDimensions();

      this.afterSiblings.forEach(function(item) {
        item.element.css({position: 'absolute', top: '0', left: '0' });
        hideWithTransform(item.element);
      });
    },
  };

  return CollectionRepeatDataSource;
}]);


IonicModule
.factory('$collectionRepeatManager', [
  '$rootScope',
  '$timeout',
function($rootScope, $timeout) {
  /**
   * Vocabulary: "primary" and "secondary" size/direction/position mean
   * "y" and "x" for vertical scrolling, or "x" and "y" for horizontal scrolling.
   */
  function CollectionRepeatManager(options) {
    var self = this;
    this.dataSource = options.dataSource;
    this.element = options.element;
    this.scrollView = options.scrollView;

    this.isVertical = !!this.scrollView.options.scrollingY;
    this.renderedItems = {};
    this.dimensions = [];
    this.setCurrentIndex(0);

    //Override scrollview's render callback
    this.scrollView.__$callback = this.scrollView.__callback;
    this.scrollView.__callback = angular.bind(this, this.renderScroll);

    function getViewportSize() { return self.viewportSize; }
    //Set getters and setters to match whether this scrollview is vertical or not
    if (this.isVertical) {
      this.scrollView.options.getContentHeight = getViewportSize;

      this.scrollValue = function() {
        return this.scrollView.__scrollTop;
      };
      this.scrollMaxValue = function() {
        return this.scrollView.__maxScrollTop;
      };
      this.scrollSize = function() {
        return this.scrollView.__clientHeight;
      };
      this.secondaryScrollSize = function() {
        return this.scrollView.__clientWidth;
      };
      this.transformString = function(y, x) {
        return 'translate3d('+x+'px,'+y+'px,0)';
      };
      this.primaryDimension = function(dim) {
        return dim.height;
      };
      this.secondaryDimension = function(dim) {
        return dim.width;
      };
    } else {
      this.scrollView.options.getContentWidth = getViewportSize;

      this.scrollValue = function() {
        return this.scrollView.__scrollLeft;
      };
      this.scrollMaxValue = function() {
        return this.scrollView.__maxScrollLeft;
      };
      this.scrollSize = function() {
        return this.scrollView.__clientWidth;
      };
      this.secondaryScrollSize = function() {
        return this.scrollView.__clientHeight;
      };
      this.transformString = function(x, y) {
        return 'translate3d('+x+'px,'+y+'px,0)';
      };
      this.primaryDimension = function(dim) {
        return dim.width;
      };
      this.secondaryDimension = function(dim) {
        return dim.height;
      };
    }
  }

  CollectionRepeatManager.prototype = {
    destroy: function() {
      this.renderedItems = {};
      this.render = angular.noop;
      this.calculateDimensions = angular.noop;
      this.dimensions = [];
    },

    /*
     * Pre-calculate the position of all items in the data list.
     * Do this using the provided width and height (primarySize and secondarySize)
     * provided by the dataSource.
     */
    calculateDimensions: function() {
      /*
       * For the sake of explanations below, we're going to pretend we are scrolling
       * vertically: Items are laid out with primarySize being height,
       * secondarySize being width.
       */
      var primaryPos = 0;
      var secondaryPos = 0;
      var secondaryScrollSize = this.secondaryScrollSize();
      var previousItem;

      this.dataSource.beforeSiblings && this.dataSource.beforeSiblings.forEach(calculateSize, this);
      var beforeSize = primaryPos + (previousItem ? previousItem.primarySize : 0);

      primaryPos = secondaryPos = 0;
      previousItem = null;

      var dimensions = this.dataSource.dimensions.map(calculateSize, this);
      var totalSize = primaryPos + (previousItem ? previousItem.primarySize : 0);

      return {
        beforeSize: beforeSize,
        totalSize: totalSize,
        dimensions: dimensions
      };

      function calculateSize(dim) {

        //Each dimension is an object {width: Number, height: Number} provided by
        //the dataSource
        var rect = {
          //Get the height out of the dimension object
          primarySize: this.primaryDimension(dim),
          //Max out the item's width to the width of the scrollview
          secondarySize: Math.min(this.secondaryDimension(dim), secondaryScrollSize)
        };

        //If this isn't the first item
        if (previousItem) {
          //Move the item's x position over by the width of the previous item
          secondaryPos += previousItem.secondarySize;
          //If the y position is the same as the previous item and
          //the x position is bigger than the scroller's width
          if (previousItem.primaryPos === primaryPos &&
              secondaryPos + rect.secondarySize > secondaryScrollSize) {
            //Then go to the next row, with x position 0
            secondaryPos = 0;
            primaryPos += previousItem.primarySize;
          }
        }

        rect.primaryPos = primaryPos;
        rect.secondaryPos = secondaryPos;

        previousItem = rect;
        return rect;
      }
    },
    resize: function() {
      var result = this.calculateDimensions();
      this.dimensions = result.dimensions;
      this.viewportSize = result.totalSize;
      this.beforeSize = result.beforeSize;
      this.setCurrentIndex(0);
      this.render(true);
      this.dataSource.setup();
    },
    /*
     * setCurrentIndex sets the index in the list that matches the scroller's position.
     * Also save the position in the scroller for next and previous items (if they exist)
     */
    setCurrentIndex: function(index, height) {
      var currentPos = (this.dimensions[index] || {}).primaryPos || 0;
      this.currentIndex = index;

      this.hasPrevIndex = index > 0;
      if (this.hasPrevIndex) {
        this.previousPos = Math.max(
          currentPos - this.dimensions[index - 1].primarySize,
          this.dimensions[index - 1].primaryPos
        );
      }
      this.hasNextIndex = index + 1 < this.dataSource.getLength();
      if (this.hasNextIndex) {
        this.nextPos = Math.min(
          currentPos + this.dimensions[index + 1].primarySize,
          this.dimensions[index + 1].primaryPos
        );
      }
    },
    /**
     * override the scroller's render callback to check if we need to
     * re-render our collection
     */
    renderScroll: ionic.animationFrameThrottle(function(transformLeft, transformTop, zoom, wasResize) {
      if (this.isVertical) {
        this.renderIfNeeded(transformTop);
      } else {
        this.renderIfNeeded(transformLeft);
      }
      return this.scrollView.__$callback(transformLeft, transformTop, zoom, wasResize);
    }),

    renderIfNeeded: function(scrollPos) {
      if ((this.hasNextIndex && scrollPos >= this.nextPos) ||
          (this.hasPrevIndex && scrollPos < this.previousPos)) {
           // Math.abs(transformPos - this.lastRenderScrollValue) > 100) {
        this.render();
      }
    },
    /*
     * getIndexForScrollValue: Given the most recent data index and a new scrollValue,
     * find the data index that matches that scrollValue.
     *
     * Strategy (if we are scrolling down): keep going forward in the dimensions list,
     * starting at the given index, until an item with height matching the new scrollValue
     * is found.
     *
     * This is a while loop. In the worst case it will have to go through the whole list
     * (eg to scroll from top to bottom).  The most common case is to scroll
     * down 1-3 items at a time.
     *
     * While this is not as efficient as it could be, optimizing it gives no noticeable
     * benefit.  We would have to use a new memory-intensive data structure for dimensions
     * to fully optimize it.
     */
    getIndexForScrollValue: function(i, scrollValue) {
      var rect;
      //Scrolling up
      if (scrollValue <= this.dimensions[i].primaryPos) {
        while ( (rect = this.dimensions[i - 1]) && rect.primaryPos > scrollValue) {
          i--;
        }
      //Scrolling down
      } else {
        while ( (rect = this.dimensions[i + 1]) && rect.primaryPos < scrollValue) {
          i++;
        }
      }
      return i;
    },
    /*
     * render: Figure out the scroll position, the index matching it, and then tell
     * the data source to render the correct items into the DOM.
     */
    render: function(shouldRedrawAll) {
      var self = this;
      var i;
      var isOutOfBounds = ( this.currentIndex >= this.dataSource.getLength() );
      // We want to remove all the items and redraw everything if we're out of bounds
      // or a flag is passed in.
      if (isOutOfBounds || shouldRedrawAll) {
        for (i in this.renderedItems) {
          this.removeItem(i);
        }
        // Just don't render anything if we're out of bounds
        if (isOutOfBounds) return;
      }

      var rect;
      var scrollValue = this.scrollValue();
      // Scroll size = how many pixels are visible in the scroller at one time
      var scrollSize = this.scrollSize();
      // We take the current scroll value and add it to the scrollSize to get
      // what scrollValue the current visible scroll area ends at.
      var scrollSizeEnd = scrollSize + scrollValue;
      // Get the new start index for scrolling, based on the current scrollValue and
      // the most recent known index
      var startIndex = this.getIndexForScrollValue(this.currentIndex, scrollValue);

      // If we aren't on the first item, add one row of items before so that when the user is
      // scrolling up he sees the previous item
      var renderStartIndex = Math.max(startIndex - 1, 0);
      // Keep adding items to the 'extra row above' until we get to a new row.
      // This is for the case where there are multiple items on one row above
      // the current item; we want to keep adding items above until
      // a new row is reached.
      while (renderStartIndex > 0 &&
         (rect = this.dimensions[renderStartIndex]) &&
         rect.primaryPos === this.dimensions[startIndex - 1].primaryPos) {
        renderStartIndex--;
      }

      // Keep rendering items, adding them until we are past the end of the visible scroll area
      i = renderStartIndex;
      while ((rect = this.dimensions[i]) && (rect.primaryPos - rect.primarySize < scrollSizeEnd)) {
        doRender(i, rect);
        i++;
      }

      // Render two extra items at the end as a buffer
      if (self.dimensions[i]) {
        doRender(i, self.dimensions[i]);
        i++;
      }
      if (self.dimensions[i]) {
        doRender(i, self.dimensions[i]);
      }
      var renderEndIndex = i;

      // Remove any items that were rendered and aren't visible anymore
      for (var renderIndex in this.renderedItems) {
        if (renderIndex < renderStartIndex || renderIndex > renderEndIndex) {
          this.removeItem(renderIndex);
        }
      }

      this.setCurrentIndex(startIndex);

      function doRender(dataIndex, rect) {
        if (dataIndex < self.dataSource.dataStartIndex) {
          // do nothing
        } else {
          self.renderItem(dataIndex, rect.primaryPos - self.beforeSize, rect.secondaryPos);
        }
      }
    },
    renderItem: function(dataIndex, primaryPos, secondaryPos) {
      // Attach an item, and set its transform position to the required value
      var item = this.dataSource.attachItemAtIndex(dataIndex);
      //console.log(dataIndex, item);
      if (item && item.element) {
        if (item.primaryPos !== primaryPos || item.secondaryPos !== secondaryPos) {
          item.element.css(ionic.CSS.TRANSFORM, this.transformString(
            primaryPos, secondaryPos
          ));
          item.primaryPos = primaryPos;
          item.secondaryPos = secondaryPos;
        }
        // Save the item in rendered items
        this.renderedItems[dataIndex] = item;
      } else {
        // If an item at this index doesn't exist anymore, be sure to delete
        // it from rendered items
        delete this.renderedItems[dataIndex];
      }
    },
    removeItem: function(dataIndex) {
      // Detach a given item
      var item = this.renderedItems[dataIndex];
      if (item) {
        item.primaryPos = item.secondaryPos = null;
        this.dataSource.detachItem(item);
        delete this.renderedItems[dataIndex];
      }
    }
  };

  return CollectionRepeatManager;
}]);


function delegateService(methodNames) {
  return ['$log', function($log) {
    var delegate = this;

    var instances = this._instances = [];
    this._registerInstance = function(instance, handle) {
      instance.$$delegateHandle = handle;
      instances.push(instance);

      return function deregister() {
        var index = instances.indexOf(instance);
        if (index !== -1) {
          instances.splice(index, 1);
        }
      };
    };

    this.$getByHandle = function(handle) {
      if (!handle) {
        return delegate;
      }
      return new InstanceForHandle(handle);
    };

    /*
     * Creates a new object that will have all the methodNames given,
     * and call them on the given the controller instance matching given
     * handle.
     * The reason we don't just let $getByHandle return the controller instance
     * itself is that the controller instance might not exist yet.
     *
     * We want people to be able to do
     * `var instance = $ionicScrollDelegate.$getByHandle('foo')` on controller
     * instantiation, but on controller instantiation a child directive
     * may not have been compiled yet!
     *
     * So this is our way of solving this problem: we create an object
     * that will only try to fetch the controller with given handle
     * once the methods are actually called.
     */
    function InstanceForHandle(handle) {
      this.handle = handle;
    }
    methodNames.forEach(function(methodName) {
      InstanceForHandle.prototype[methodName] = function() {
        var handle = this.handle;
        var args = arguments;
        var matchingInstancesFound = 0;
        var finalResult;
        var result;

        //This logic is repeated below; we could factor some of it out to a function
        //but don't because it lets this method be more performant (one loop versus 2)
        instances.forEach(function(instance) {
          if (instance.$$delegateHandle === handle) {
            matchingInstancesFound++;
            result = instance[methodName].apply(instance, args);
            //Only return the value from the first call
            if (matchingInstancesFound === 1) {
              finalResult = result;
            }
          }
        });

        if (!matchingInstancesFound) {
          return $log.warn(
            'Delegate for handle "'+this.handle+'" could not find a ' +
            'corresponding element with delegate-handle="'+this.handle+'"! ' +
            methodName + '() was not called!\n' +
            'Possible cause: If you are calling ' + methodName + '() immediately, and ' +
            'your element with delegate-handle="' + this.handle + '" is a child of your ' +
            'controller, then your element may not be compiled yet. Put a $timeout ' +
            'around your call to ' + methodName + '() and try again.'
          );
        }

        return finalResult;
      };
      delegate[methodName] = function() {
        var args = arguments;
        var finalResult;
        var result;

        //This logic is repeated above
        instances.forEach(function(instance, index) {
          result = instance[methodName].apply(instance, args);
          //Only return the value from the first call
          if (index === 0) {
            finalResult = result;
          }
        });

        return finalResult;
      };

      function callMethod(instancesToUse, methodName, args) {
        var finalResult;
        var result;
        instancesToUse.forEach(function(instance, index) {
          result = instance[methodName].apply(instance, args);
          //Make it so the first result is the one returned
          if (index === 0) {
            finalResult = result;
          }
        });
        return finalResult;
      }
    });
  }];
}

/**
 * @ngdoc service
 * @name $ionicGesture
 * @module ionic
 * @description An angular service exposing ionic
 * {@link ionic.utility:ionic.EventController}'s gestures.
 */
IonicModule
.factory('$ionicGesture', [function() {
  return {
    /**
     * @ngdoc method
     * @name $ionicGesture#on
     * @description Add an event listener for a gesture on an element. See {@link ionic.utility:ionic.EventController#onGesture}.
     * @param {string} eventType The gesture event to listen for.
     * @param {function(e)} callback The function to call when the gesture
     * happens.
     * @param {element} $element The angular element to listen for the event on.
     * @returns {ionic.Gesture} The gesture object (use this to remove the gesture later on).
     */
    on: function(eventType, cb, $element, options) {
      return window.ionic.onGesture(eventType, cb, $element[0], options);
    },
    /**
     * @ngdoc method
     * @name $ionicGesture#off
     * @description Remove an event listener for a gesture on an element. See {@link ionic.utility:ionic.EventController#offGesture}.
     * @param {ionic.Gesture} gesture The gesture that should be removed.
     * @param {string} eventType The gesture event to remove the listener for.
     * @param {function(e)} callback The listener to remove.
     */
    off: function(gesture, eventType, cb) {
      return window.ionic.offGesture(gesture, eventType, cb);
    }
  };
}]);

/**
 * @private
 * TODO document
 */
IonicModule
.run([
  '$rootScope',
  '$state',
  '$location',
  '$document',
  '$ionicPlatform',
  '$ionicHistory',
function($rootScope, $state, $location, $document, $ionicPlatform, $ionicHistory) {

  // always reset the keyboard state when change stage
  $rootScope.$on('$stateChangeStart', function(){
    ionic.keyboard.hide();
  });

  $rootScope.$on('$ionicHistory.change', function(e, data) {
    if (!data) return;

    var viewHistory = $ionicHistory.viewHistory();

    var hist = (data.historyId ? viewHistory.histories[ data.historyId ] : null );
    if (hist && hist.cursor > -1 && hist.cursor < hist.stack.length) {
      // the history they're going to already exists
      // go to it's last view in its stack
      var view = hist.stack[ hist.cursor ];
      return view.go(data);
    }

    // this history does not have a URL, but it does have a uiSref
    // figure out its URL from the uiSref
    if (!data.url && data.uiSref) {
      data.url = $state.href(data.uiSref);
    }

    if (data.url) {
      // don't let it start with a #, messes with $location.url()
      if (data.url.indexOf('#') === 0) {
        data.url = data.url.replace('#', '');
      }
      if (data.url !== $location.url()) {
        // we've got a good URL, ready GO!
        $location.url(data.url);
      }
    }
  });

  // Set the document title when a new view is shown
  $rootScope.$on('viewState.viewEnter', function(e, data) {
    if (data && data.title) {
      $document[0].title = data.title;
    }
  });

  // Triggered when devices with a hardware back button (Android) is clicked by the user
  // This is a Cordova/Phonegap platform specifc method
  function onHardwareBackButton(e) {
    if (viewHistory.backView) {
      // there is a back view, go to it
      viewHistory.backView.go();
    } else {
      // there is no back view, so close the app instead
      ionic.Platform.exitApp();
    }
    e.preventDefault();
    return false;
  }
  $ionicPlatform.registerBackButtonAction(
    onHardwareBackButton,
    PLATFORM_BACK_BUTTON_PRIORITY_VIEW
  );

}])

.factory('$ionicHistory', [
  '$rootScope',
  '$state',
  '$location',
  '$window',
function($rootScope, $state, $location, $window) {

  // history actions while navigating views
  var ACTION_INITIAL_VIEW = 'initialView';
  var ACTION_NEW_VIEW = 'newView';
  var ACTION_MOVE_BACK = 'moveBack';
  var ACTION_MOVE_FORWARD = 'moveForward';

  // direction of navigation
  var DIRECTION_BACK = 'back';
  var DIRECTION_FORWARD = 'forward';
  var DIRECTION_ENTER = 'enter';
  var DIRECTION_EXIT = 'exit';
  var DIRECTION_SWAP = 'swap';
  var DIRECTION_NONE = 'none';

  var stateChangeCounter = 0;
  var lastStateId;

  var viewHistory = {
    histories: { root: { historyId: 'root', parentHistoryId: null, stack: [], cursor: -1 } },
    views: {},
    backView: null,
    forwardView: null,
    currentView: null
  };

  var View = function(){};
  View.prototype.initialize = function(data) {
    if (data) {
      for(var name in data) this[name] = data[name];
      return this;
    }
    return null;
  };
  View.prototype.go = function() {

    if (this.stateName) {
      return $state.go(this.stateName, this.stateParams);
    }

    if (this.url && this.url !== $location.url()) {

      if (viewHistory.backView === this) {
        return $window.history.go(-1);
      } else if (viewHistory.forwardView === this) {
        return $window.history.go(1);
      }

      $location.url(this.url);
      return;
    }

    return null;
  };
  View.prototype.destroy = function() {
    if (this.scope) {
      this.scope.$destroy && this.scope.$destroy();
      this.scope = null;
    }
  };


  function getViewById(viewId) {
    return (viewId ? viewHistory.views[ viewId ] : null );
  }

  function getBackView(view) {
    return (view ? getViewById(view.backViewId) : null );
  }

  function getForwardView(view) {
    return (view ? getViewById(view.forwardViewId) : null );
  }

  function getHistoryById(historyId) {
    return (historyId ? viewHistory.histories[ historyId ] : null );
  }

  function getHistory(scope) {
    var histObj = getParentHistoryObj(scope);

    if ( !viewHistory.histories[ histObj.historyId ] ) {
      // this history object exists in parent scope, but doesn't
      // exist in the history data yet
      viewHistory.histories[ histObj.historyId ] = {
        historyId: histObj.historyId,
        parentHistoryId: getParentHistoryObj(histObj.scope.$parent).historyId,
        stack: [],
        cursor: -1
      };
    }
    return getHistoryById(histObj.historyId);
  }

  function getParentHistoryObj(scope) {
    var parentScope = scope;
    while(parentScope) {
      if (parentScope.hasOwnProperty('$historyId')) {
        // this parent scope has a historyId
        return { historyId: parentScope.$historyId, scope: parentScope };
      }
      // nothing found keep climbing up
      parentScope = parentScope.$parent;
    }
    // no history for for the parent, use the root
    return { historyId: 'root', scope: $rootScope };
  }

  function setNavViews(viewId) {
    viewHistory.currentView = getViewById(viewId);
    viewHistory.backView = getBackView(viewHistory.currentView);
    viewHistory.forwardView = getForwardView(viewHistory.currentView);
  }

  function getCurrentStateId() {
    var id;
    if ($state && $state.current && $state.current.name) {
      id = $state.current.name;
      if ($state.params) {
        for(var key in $state.params) {
          if ($state.params.hasOwnProperty(key) && $state.params[key]) {
            id += "_" + key + "=" + $state.params[key];
          }
        }
      }
      return id;
    }
    // if something goes wrong make sure its got a unique stateId
    return ionic.Utils.nextUid();
  }

  function getCurrentStateParams() {
    var rtn;
    if ($state && $state.params) {
      for(var key in $state.params) {
        if ($state.params.hasOwnProperty(key)) {
          rtn = rtn || {};
          rtn[key] = $state.params[key];
        }
      }
    }
    return rtn;
  }


  return {

    register: function(parentScope, viewLocals) {

      var currentStateId = getCurrentStateId(),
          hist = getHistory(parentScope),
          currentView = viewHistory.currentView,
          backView = viewHistory.backView,
          forwardView = viewHistory.forwardView,
          viewId = null,
          action = null,
          direction = DIRECTION_NONE,
          historyId = hist.historyId,
          tmp;

      if ( viewLocals && viewLocals.$$state && viewLocals.$$state.self && viewLocals.$$state.self.abstract ) {
        // abstract states should not register themselves in the history stack
        return {
          action: 'abstractView',
          direction: DIRECTION_NONE
        };
      }

      if (lastStateId !== currentStateId) {
        lastStateId = currentStateId;
        stateChangeCounter++;
      }

      if (viewHistory.forcedNav) {
        // we've previously set exactly what to do
        ionic.Utils.extend(rsp, viewHistory.forcedNav);
        viewHistory.forcedNav = null;

      } else if (backView && backView.stateId === currentStateId) {
        // they went back one, set the old current view as a forward view
        viewId = backView.viewId;
        historyId = backView.historyId;
        action = ACTION_MOVE_BACK;
        if (backView.historyId === currentView.historyId) {
          // went back in the same history
          direction = DIRECTION_BACK;

        } else if (currentView) {
          direction = DIRECTION_EXIT;

          tmp = getHistoryById(backView.historyId);
          if (tmp && tmp.parentHistoryId === currentView.historyId) {
            direction = DIRECTION_ENTER;

          } else {
            tmp = getHistoryById(currentView.historyId);
            if (tmp && tmp.parentHistoryId === hist.parentHistoryId) {
              direction = DIRECTION_SWAP;
            }
          }
        }

      } else if (forwardView && forwardView.stateId === currentStateId) {
        // they went to the forward one, set the forward view to no longer a forward view
        viewId = forwardView.viewId;
        historyId = forwardView.historyId;
        action = ACTION_MOVE_FORWARD;
        if (forwardView.historyId === currentView.historyId) {
          direction = DIRECTION_FORWARD;

        } else if (currentView) {
          direction = DIRECTION_EXIT;

          if (currentView.historyId === hist.parentHistoryId) {
            direction = DIRECTION_ENTER;

          } else {
            tmp = getHistoryById(currentView.historyId);
            if (tmp && tmp.parentHistoryId === hist.parentHistoryId) {
              direction = DIRECTION_SWAP;
            }
          }
        }

        tmp = getParentHistoryObj(parentScope);
        if (forwardView.historyId && tmp.scope) {
          // if a history has already been created by the forward view then make sure it stays the same
          tmp.scope.$historyId = forwardView.historyId;
          historyId = forwardView.historyId;
        }

      } else if (currentView && currentView.historyId !== historyId &&
                hist.cursor > -1 && hist.stack.length > 0 && hist.cursor < hist.stack.length &&
                hist.stack[hist.cursor].stateId === currentStateId) {
        // they just changed to a different history and the history already has views in it
        var switchToView = hist.stack[hist.cursor];
        viewId = switchToView.viewId;
        historyId = switchToView.historyId;
        action = ACTION_MOVE_BACK;
        direction = DIRECTION_SWAP;

        tmp = getHistoryById(currentView.historyId);
        if (tmp && tmp.parentHistoryId === historyId) {
          direction = DIRECTION_EXIT;

        } else {
          tmp = getHistoryById(historyId);
          if (tmp && tmp.parentHistoryId === currentView.historyId) {
            direction = DIRECTION_ENTER;
          }
        }

        // if switching to a different history, and the history of the view we're switching
        // to has an existing back view from a different history than itself, then
        // it's back view would be better represented using the current view as its back view
        tmp = getViewById(switchToView.backViewId);
        if (tmp && switchToView.historyId !== tmp.historyId) {
          hist.stack[hist.cursor].backViewId = currentView.viewId;
        }

      } else {

        // set a new unique viewId
        viewId = ionic.Utils.nextUid();

        if (currentView) {
          // set the forward view if there is a current view (ie: if its not the first view)
          currentView.forwardViewId = viewId;

          action = ACTION_NEW_VIEW;

          // check if there is a new forward view within the same history
          if (forwardView && currentView.stateId !== forwardView.stateId &&
             currentView.historyId === forwardView.historyId) {
            // they navigated to a new view but the stack already has a forward view
            // since its a new view remove any forwards that existed
            tmp = getHistoryById(forwardView.historyId);
            if (tmp) {
              // the forward has a history
              for(var x=tmp.stack.length - 1; x >= forwardView.index; x--) {
                // starting from the end destroy all forwards in this history from this point
                tmp.stack[x].destroy();
                tmp.stack.splice(x);
              }
              historyId = forwardView.historyId;
            }
          }

          // its only moving forward if its in the same history
          if (hist.historyId === currentView.historyId) {
            direction = DIRECTION_FORWARD;

          } else if (currentView.historyId !== hist.historyId) {
            direction = DIRECTION_ENTER;

            tmp = getHistoryById(currentView.historyId);
            if (tmp && tmp.parentHistoryId === hist.parentHistoryId) {
              direction = DIRECTION_SWAP;

            } else {
              tmp = getHistoryById(tmp.parentHistoryId);
              if (tmp && tmp.historyId === hist.historyId) {
                direction = DIRECTION_EXIT;
              }
            }
          }

        } else {
          // there's no current view, so this must be the initial view
          action = ACTION_INITIAL_VIEW;
        }

        if (stateChangeCounter < 2) {
          // views that were spun up on the first load should not animate
          direction = DIRECTION_NONE;
        }

        // add the new view
        viewHistory.views[viewId] = this.createView({
          viewId: viewId,
          index: hist.stack.length,
          historyId: hist.historyId,
          backViewId: (currentView && currentView.viewId ? currentView.viewId : null),
          forwardViewId: null,
          stateId: currentStateId,
          stateName: this.currentStateName(),
          stateParams: getCurrentStateParams(),
          url: $location.url()
        });

        // add the new view to this history's stack
        hist.stack.push(viewHistory.views[viewId]);
      }

      setNavViews(viewId);

      hist.cursor = viewHistory.currentView.index;

      console.log('VIEW:', viewId, (viewHistory.views[viewId] && viewHistory.views[viewId].url), '  history:', historyId, '  action:', action, '  direction:', direction);

      return {
        viewId: viewId,
        action: action,
        direction: direction,
        historyId: historyId,
        showBack: !!(viewHistory.backView && viewHistory.backView.historyId === viewHistory.currentView.historyId)
      };
    },

    registerHistory: function(scope) {
      scope.$historyId = ionic.Utils.nextUid();
    },

    viewHistory: function() {
      return viewHistory;
    },

    createView: function(data) {
      var newView = new View();
      return newView.initialize(data);
    },

    currentView: function() {
      return viewHistory.currentView;
    },

    currentTitle: function(val) {
      if (arguments.length) {
        viewHistory.currentView.title = val;
      }
      return viewHistory.currentView.title;
    },

    backView: function() {
      return viewHistory.backView;
    },

    backTitle: function() {
      if (viewHistory.backView) {
        return viewHistory.backView.title;
      }
    },

    forwardView: function() {
      return viewHistory.forwardView;
    },

    getViewById: getViewById,

    currentStateName: function() {
      return ($state && $state.current ? $state.current.name : null);
    },

    isCurrentStateNavView: function(navView) {
      return !!($state && $state.current && $state.current.views && $state.current.views[navView]);
    },

    goToHistoryRoot: function(historyId) {
      if (historyId) {
        var hist = getHistoryById(historyId);
        if (hist && hist.stack.length) {
          if (viewHistory.currentView && viewHistory.currentView.viewId === hist.stack[0].viewId) {
            return;
          }
          viewHistory.forcedNav = {
            viewId: hist.stack[0].viewId,
            action: ACTION_MOVE_BACK,
            direction: DIRECTION_BACK
          };
          hist.stack[0].go();
        }
      }
    },

    clearHistory: function() {
      var
      histories = viewHistory.histories,
      currentView = viewHistory.currentView;

      if (histories) {
        for(var historyId in histories) {

          if (histories[historyId].stack) {
            histories[historyId].stack = [];
            histories[historyId].cursor = -1;
          }

          if (currentView && currentView.historyId === historyId) {
            currentView.backViewId = currentView.forwardViewId = null;
            histories[historyId].stack.push(currentView);
          } else if (histories[historyId].destroy) {
            histories[historyId].destroy();
          }

        }
      }

      for(var viewId in viewHistory.views) {
        if (viewId !== currentView.viewId) {
          delete viewHistory.views[viewId];
        }
      }

      if (currentView) {
        setNavViews(currentView.viewId);
      }
    }

  };

}]);

/**
 * @ngdoc provider
 * @name $ionicConfigProvider
 * @module ionic
 * @description $ionicConfigProvider can be used during the configuration phase of your app
 * to change how Ionic works.
 *
 * @usage
 * ```js
 * var myApp = angular.module('reallyCoolApp', ['ionic']);
 *
 * myApp.config(function($ionicConfigProvider) {
 *   $ionicConfigProvider.templates.prefetch(false);
 * });
 * ```
 */

/**
 * @ngdoc method
 * @name $ionicConfigProvider#views.transition
 * @description Animation style when transitioning between views. Default `platform`.
 *
 * @param {string} transition Which style of view transitioning to use.
 *
 * * `platform`: Dynamically choose the correct transition style depending on
 *               the platform the app is running from. If the platform is
 *               not `ios` or `android` then it will default to `ios-transition`.
 * * `ios-transition`: iOS style transition.
 * * `android-transition`: Android style transition.
 * * `none`: Do not preform animated transitions.
 *
 * @returns {string} View animation.
 */

/**
 * @ngdoc method
 * @name $ionicConfigProvider#views.maxCache
 * @description Maximum number of view elements to cache in the DOM. When the max number is
 * exceeded, the `viewRemovePolicy` determines which view to remove. Views which stay in the
 * DOM essentially caches the view's scope, current state and scroll position. When the
 * maximum cached is `0`, then after each view transition, the view's element will
 * be removed from the DOM, and the next time the same view is shown it will have to
 * re-compile, attach to the DOM, and link the element again.
 * @param {number} maxNumber Maximum number of views to retain. Default `10`.
 * @returns {number} How many views Ionic will hold onto until the a view is removed.
 */

/**
 * @ngdoc method
 * @name $ionicConfigProvider#views.forwardCache
 * @description When navigating between views, by default, views that were recently visited
 * are cached, and the same data and DOM elements are referenced when navigating back. However,
 * when navigating back in the history, the "forward" view is removed so its not cached. If
 * you navigate forward to the same view again it'll create a new DOM element, re-compiled and
 * linked. Basically any forward views are reset each time. Set this config to `true` to have
 * forward views are cached and not reset on each load.
 * @param {boolean} value `false`.
 * @returns {boolean}
 */

/**
 * @ngdoc method
 * @name $ionicConfigProvider#templates.prefetch
 * @description Set whether Ionic should prefetch all templateUrls defined in
 * $stateProvider.state. If set to false, the user will have to wait
 * for a template to be fetched the first time when navigating to a new page. Default `true`.
 * @param {boolean} shouldPrefetch Whether Ionic should prefetch templateUrls defined in
 * `$stateProvider.state()`.
 * @returns {boolean} Whether Ionic will prefetch templateUrls defined in $stateProvider.state.
 */

IonicModule
.provider('$ionicConfig', function() {

  var provider = this;
  provider.platform = {};
  var PLATFORM = 'platform';

  var configProperties = {
    views: {
      transition: PLATFORM,
      maxCache: PLATFORM,
      forwardCache: PLATFORM
    },
    navBar: {
      alignTitle: PLATFORM,
      positionPrimaryButtons: PLATFORM,
      positionSecondaryButtons: PLATFORM,
      transition: PLATFORM,
      transitionFn: PLATFORM
    },
    backButton: {
      enabled: PLATFORM,
      icon: PLATFORM,
      text: PLATFORM,
      previousTitleText: PLATFORM
    },
    tabs: {
      position: PLATFORM,
      type: PLATFORM
    },
    templates: {
      prefetch: PLATFORM
    },
    platform: {}
  };
  createConfig(configProperties, provider, '');



  // Default
  // -------------------------
  setPlatformConfig('default', {
    views: {
      transition: 'ios-transition',
      maxCache: 10,
      forwardCache: false
    },
    navBar: {
      alignTitle: 'center',
      positionPrimaryButtons: 'left',
      positionSecondaryButtons: 'right',
      transition: 'ios-nav-bar',

      transitionFn: function(enteringCtrl, leavingCtrl) {

        function setStyles(ctrl, opacity, titleX, backTextX) {
          var css = { opacity: opacity };

          ctrl.setCss('buttons-a', css);
          ctrl.setCss('buttons-b', css);
          ctrl.setCss('back-button', css);

          css[ionic.CSS.TRANSFORM] = 'translate3d(' + titleX + 'px,0,0)';
          ctrl.setCss('title', css);

          css[ionic.CSS.TRANSFORM] = 'translate3d(' + backTextX + 'px,0,0)';
          ctrl.setCss('back-text', css);
        }

        function enter(ctrlA, ctrlB, value) {
          if (!ctrlA) return;
          var titleX = (ctrlA.titleTextX() + ctrlA.titleWidth()) * (1 - value);
          var backTextX = (ctrlB.titleTextX() - ctrlA.backButtonTextLeft()) * (1 - value);
          setStyles(ctrlA, value, titleX, backTextX);
        }

        function leave(ctrlA, ctrlB, value) {
          if (!ctrlA) return;
          var titleX = (-(ctrlA.titleTextX() - ctrlB.backButtonTextLeft()) - (ctrlA.titleLeftRight())) * value;
          setStyles(ctrlA, 1 - value, titleX, 0);
        }

        return {
          forward: {
            enter: function(value) {
              enter(enteringCtrl, leavingCtrl, value);
            },
            leave: function(value) {
              leave(leavingCtrl, enteringCtrl, value);
            }
          },
          back: {
            enter: function(value) {
              leave(enteringCtrl, leavingCtrl, 1-value);
            },
            leave: function(value) {
              enter(leavingCtrl, enteringCtrl, 1-value);
            }
          }
        };
      }

    },
    backButton: {
      icon: 'ion-ios7-arrow-back',
      text: 'Back',
      previousTitleText: true
    },
    tabs: {
      position: '',
      type: ''
    },
    templates: {
      prefetch: true
    }
  });



  // iOS
  // -------------------------
  setPlatformConfig('ios', {
    backButton: {
      icon: 'ion-ios7-arrow-back'
    }
  });



  // Android
  // -------------------------
  setPlatformConfig('android', {
    views: {
      transition: 'android-transition'
    },
    navBar: {
      alignTitle: 'left',
      positionPrimaryButtons: 'right',
      positionSecondaryButtons: 'right',
      transition: 'android-transition',
      transitionFn: 'none'
    },
    backButton: {
      icon: 'ion-android-arrow-back',
      text: '',
      previousTitleText: false
    },
    tabs: {
      type: 'tabs-striped'
    }
  });




  function setPlatformConfig(platformName, platformConfigs) {
    configProperties.platform[platformName] = platformConfigs;
    provider.platform[platformName] = {};

    addConfig(configProperties, configProperties.platform[platformName]);

    createConfig(configProperties.platform[platformName], provider.platform[platformName], '');
  }

  function addConfig(configObj, platformObj) {
    for (var n in configObj) {
      if (n != PLATFORM && configObj.hasOwnProperty(n)) {
        if ( angular.isObject(configObj[n]) ) {
          if (!isDefined(platformObj[n])) {
            platformObj[n] = {};
          }
          addConfig(configObj[n], platformObj[n]);

        } else if( !isDefined(platformObj[n]) ) {
          platformObj[n] = null;
        }
      }
    }
  }


  // private: create methods for each config to get/set
  function createConfig(configObj, providerObj, platformPath) {
    forEach(configObj, function(value, namespace){

      if (angular.isObject(configObj[namespace])) {
        // recursively drill down the config object so we can create a method for each one
        providerObj[namespace] = {};
        createConfig(configObj[namespace], providerObj[namespace], platformPath + '.' + namespace);

      } else {
        // create a method for both the provider and config methods that will be exposed
        providerObj[namespace] = function(newValue) {
          if (arguments.length) {
            configObj[namespace] = newValue;
          }
          if (configObj[namespace] == PLATFORM) {
            // if the config is set to 'platform', then get this config's platform value
            var platformConfig = stringObj(configProperties.platform, ionic.Platform.platform() + platformPath + '.' + namespace);
            if (platformConfig) {
              return platformConfig;
            }
            // didnt find a specific platform config, now try the default
            return stringObj(configProperties.platform, 'default' + platformPath + '.' + namespace);
          }
          return configObj[namespace];
        };
      }

    });
  }

  function stringObj(obj, str) {
    str = str.split(".");
    for (var i = 0; i < str.length; i++) {
      if ( obj && isDefined(obj[str[i]]) ) {
        obj = obj[str[i]];
      } else {
        return null;
      }
    }
    return obj;
  }

  provider.setPlatformConfig = setPlatformConfig;


  // private: Service definition for internal Ionic use
  /**
   * @ngdoc service
   * @name $ionicConfig
   * @module ionic
   * @private
   */
  provider.$get = function() {
    return provider;
  };
});


var LOADING_TPL =
  '<div class="loading-container">' +
    '<div class="loading">' +
    '</div>' +
  '</div>';

var LOADING_HIDE_DEPRECATED = '$ionicLoading instance.hide() has been deprecated. Use $ionicLoading.hide().';
var LOADING_SHOW_DEPRECATED = '$ionicLoading instance.show() has been deprecated. Use $ionicLoading.show().';
var LOADING_SET_DEPRECATED = '$ionicLoading instance.setContent() has been deprecated. Use $ionicLoading.show({ template: \'my content\' }).';

/**
 * @ngdoc service
 * @name $ionicLoading
 * @module ionic
 * @description
 * An overlay that can be used to indicate activity while blocking user
 * interaction.
 *
 * @usage
 * ```js
 * angular.module('LoadingApp', ['ionic'])
 * .controller('LoadingCtrl', function($scope, $ionicLoading) {
 *   $scope.show = function() {
 *     $ionicLoading.show({
 *       template: 'Loading...'
 *     });
 *   };
 *   $scope.hide = function(){
 *     $ionicLoading.hide();
 *   };
 * });
 * ```
 */
/**
 * @ngdoc object
 * @name $ionicLoadingConfig
 * @module ionic
 * @description
 * Set the default options to be passed to the {@link ionic.service:$ionicLoading} service.
 *
 * @usage
 * ```js
 * var app = angular.module('myApp', ['ionic'])
 * app.constant('$ionicLoadingConfig', {
 *   template: 'Default Loading Template...'
 * });
 * app.controller('AppCtrl', function($scope, $ionicLoading) {
 *   $scope.showLoading = function() {
 *     $ionicLoading.show(); //options default to values in $ionicLoadingConfig
 *   };
 * });
 * ```
 */
IonicModule
.constant('$ionicLoadingConfig', {
  template: '<i class="icon ion-loading-d"></i>'
})
.factory('$ionicLoading', [
  '$ionicLoadingConfig',
  '$ionicBody',
  '$ionicTemplateLoader',
  '$ionicBackdrop',
  '$timeout',
  '$q',
  '$log',
  '$compile',
  '$ionicPlatform',
function($ionicLoadingConfig, $ionicBody, $ionicTemplateLoader, $ionicBackdrop, $timeout, $q, $log, $compile, $ionicPlatform) {

  var loaderInstance;
  //default values
  var deregisterBackAction = angular.noop;
  var loadingShowDelay = $q.when();

  return {
    /**
     * @ngdoc method
     * @name $ionicLoading#show
     * @description Shows a loading indicator. If the indicator is already shown,
     * it will set the options given and keep the indicator shown.
     * @param {object} opts The options for the loading indicator. Available properties:
     *  - `{string=}` `template` The html content of the indicator.
     *  - `{string=}` `templateUrl` The url of an html template to load as the content of the indicator.
     *  - `{boolean=}` `noBackdrop` Whether to hide the backdrop. By default it will be shown.
     *  - `{number=}` `delay` How many milliseconds to delay showing the indicator. By default there is no delay.
     *  - `{number=}` `duration` How many milliseconds to wait until automatically
     *  hiding the indicator. By default, the indicator will be shown until `.hide()` is called.
     */
    show: showLoader,
    /**
     * @ngdoc method
     * @name $ionicLoading#hide
     * @description Hides the loading indicator, if shown.
     */
    hide: hideLoader,
    /**
     * @private for testing
     */
    _getLoader: getLoader
  };

  function getLoader() {
    if (!loaderInstance) {
      loaderInstance = $ionicTemplateLoader.compile({
        template: LOADING_TPL,
        appendTo: $ionicBody.get()
      })
      .then(function(loader) {
        var self = loader;

        loader.show = function(options) {
          var templatePromise = options.templateUrl ?
            $ionicTemplateLoader.load(options.templateUrl) :
            //options.content: deprecated
            $q.when(options.template || options.content || '');


          if (!this.isShown) {
            //options.showBackdrop: deprecated
            this.hasBackdrop = !options.noBackdrop && options.showBackdrop !== false;
            if (this.hasBackdrop) {
              $ionicBackdrop.retain();
              $ionicBackdrop.getElement().addClass('backdrop-loading');
            }
          }

          if (options.duration) {
            $timeout.cancel(this.durationTimeout);
            this.durationTimeout = $timeout(
              angular.bind(this, this.hide),
              +options.duration
            );
          }

          deregisterBackAction();
          //Disable hardware back button while loading
          deregisterBackAction = $ionicPlatform.registerBackButtonAction(
            angular.noop,
            PLATFORM_BACK_BUTTON_PRIORITY_LOADING
          );

          templatePromise.then(function(html) {
            if (html) {
              var loading = self.element.children();
              loading.html(html);
              $compile(loading.contents())(self.scope);
            }

            //Don't show until template changes
            if (self.isShown) {
              self.element.addClass('visible');
              ionic.requestAnimationFrame(function() {
                if(self.isShown) {
                  self.element.addClass('active');
                  $ionicBody.addClass('loading-active');
                }
              });
            }
          });

          this.isShown = true;
        };
        loader.hide = function() {

          deregisterBackAction();
          if (this.isShown) {
            if (this.hasBackdrop) {
              $ionicBackdrop.release();
              $ionicBackdrop.getElement().removeClass('backdrop-loading');
            }
            self.element.removeClass('active');
            $ionicBody.removeClass('loading-active');
            setTimeout(function() {
              !self.isShown && self.element.removeClass('visible');
            }, 200);
          }
          $timeout.cancel(this.durationTimeout);
          this.isShown = false;
        };

        return loader;
      });
    }
    return loaderInstance;
  }

  function showLoader(options) {
    options = extend({}, $ionicLoadingConfig || {}, options || {});
    var delay = options.delay || options.showDelay || 0;

    //If loading.show() was called previously, cancel it and show with our new options
    loadingShowDelay && $timeout.cancel(loadingShowDelay);
    loadingShowDelay = $timeout(angular.noop, delay);

    loadingShowDelay.then(getLoader).then(function(loader) {
      return loader.show(options);
    });

    return {
      hide: deprecated.method(LOADING_HIDE_DEPRECATED, $log.error, hideLoader),
      show: deprecated.method(LOADING_SHOW_DEPRECATED, $log.error, function() {
        showLoader(options);
      }),
      setContent: deprecated.method(LOADING_SET_DEPRECATED, $log.error, function(content) {
        getLoader().then(function(loader) {
          loader.show({ template: content });
        });
      })
    };
  }

  function hideLoader() {
    $timeout.cancel(loadingShowDelay);
    getLoader().then(function(loader) {
      loader.hide();
    });
  }
}]);

/**
 * @ngdoc service
 * @name $ionicModal
 * @module ionic
 * @description
 *
 * Related: {@link ionic.controller:ionicModal ionicModal controller}.
 *
 * The Modal is a content pane that can go over the user's main view
 * temporarily.  Usually used for making a choice or editing an item.
 *
 * Put the content of the modal inside of an `<ion-modal-view>` element.
 *
 * **Notes:**
 * - A modal will broadcast 'modal.shown', 'modal.hidden', and 'modal.removed' events from its originating
 * scope, passing in itself as an event argument. Both the modal.removed and modal.hidden events are
 * called when the modal is removed.
 *
 * - This example assumes your modal is in your main index file or another template file. If it is in its own
 * template file, remove the script tags and call it by file name.
 * 
 * @usage
 * ```html
 * <script id="my-modal.html" type="text/ng-template">
 *   <ion-modal-view>
 *     <ion-header-bar>
 *       <h1 class="title">My Modal title</h1>
 *     </ion-header-bar>
 *     <ion-content>
 *       Hello!
 *     </ion-content>
 *   </ion-modal-view>
 * </script>
 * ```
 * ```js
 * angular.module('testApp', ['ionic'])
 * .controller('MyController', function($scope, $ionicModal) {
 *   $ionicModal.fromTemplateUrl('my-modal.html', {
 *     scope: $scope,
 *     animation: 'slide-in-up'
 *   }).then(function(modal) {
 *     $scope.modal = modal;
 *   });
 *   $scope.openModal = function() {
 *     $scope.modal.show();
 *   };
 *   $scope.closeModal = function() {
 *     $scope.modal.hide();
 *   };
 *   //Cleanup the modal when we're done with it!
 *   $scope.$on('$destroy', function() {
 *     $scope.modal.remove();
 *   });
 *   // Execute action on hide modal
 *   $scope.$on('modal.hidden', function() {
 *     // Execute action
 *   });
 *   // Execute action on remove modal
 *   $scope.$on('modal.removed', function() {
 *     // Execute action
 *   });
 * });
 * ```
 */
IonicModule
.factory('$ionicModal', [
  '$rootScope',
  '$ionicBody',
  '$compile',
  '$timeout',
  '$ionicPlatform',
  '$ionicTemplateLoader',
  '$q',
  '$log',
function($rootScope, $ionicBody, $compile, $timeout, $ionicPlatform, $ionicTemplateLoader, $q, $log) {

  /**
   * @ngdoc controller
   * @name ionicModal
   * @module ionic
   * @description
   * Instantiated by the {@link ionic.service:$ionicModal} service.
   *
   * Be sure to call [remove()](#remove) when you are done with each modal
   * to clean it up and avoid memory leaks.
   *
   * Note: a modal will broadcast 'modal.shown', 'modal.hidden', and 'modal.removed' events from its originating
   * scope, passing in itself as an event argument. Note: both modal.removed and modal.hidden are
   * called when the modal is removed.
   */
  var ModalView = ionic.views.Modal.inherit({
    /**
     * @ngdoc method
     * @name ionicModal#initialize
     * @description Creates a new modal controller instance.
     * @param {object} options An options object with the following properties:
     *  - `{object=}` `scope` The scope to be a child of.
     *    Default: creates a child of $rootScope.
     *  - `{string=}` `animation` The animation to show & hide with.
     *    Default: 'slide-in-up'
     *  - `{boolean=}` `focusFirstInput` Whether to autofocus the first input of
     *    the modal when shown.  Default: false.
     *  - `{boolean=}` `backdropClickToClose` Whether to close the modal on clicking the backdrop.
     *    Default: true.
     *  - `{boolean=}` `hardwareBackButtonClose` Whether the modal can be closed using the hardware
     *    back button on Android and similar devices.  Default: true.
     */
    initialize: function(opts) {
      ionic.views.Modal.prototype.initialize.call(this, opts);
      this.animation = opts.animation || 'slide-in-up';
    },

    /**
     * @ngdoc method
     * @name ionicModal#show
     * @description Show this modal instance.
     * @returns {promise} A promise which is resolved when the modal is finished animating in.
     */
    show: function(target) {
      var self = this;

      if(self.scope.$$destroyed) {
        $log.error('Cannot call ' +  self.viewType + '.show() after remove(). Please create a new ' +  self.viewType + ' instance.');
        return;
      }

      var modalEl = jqLite(self.modalEl);

      self.el.classList.remove('hide');
      $timeout(function(){
        $ionicBody.addClass(self.viewType + '-open');
      }, 400);

      if(!self.el.parentElement) {
        modalEl.addClass(self.animation);
        $ionicBody.append(self.el);
      }

      if(target && self.positionView) {
        self.positionView(target, modalEl);
        // set up a listener for in case the window size changes
        ionic.on('resize',function(){
          ionic.off('resize',null,window);
          self.positionView(target,modalEl);
        },window);
      }

      modalEl.addClass('ng-enter active')
             .removeClass('ng-leave ng-leave-active');

      self._isShown = true;
      self._deregisterBackButton = $ionicPlatform.registerBackButtonAction(
        self.hardwareBackButtonClose ? angular.bind(self, self.hide) : angular.noop,
        PLATFORM_BACK_BUTTON_PRIORITY_MODAL
      );

      self._isOpenPromise = $q.defer();

      ionic.views.Modal.prototype.show.call(self);

      $timeout(function(){
        modalEl.addClass('ng-enter-active');
        ionic.trigger('resize');
        self.scope.$parent && self.scope.$parent.$broadcast(self.viewType + '.shown', self);
        self.el.classList.add('active');
      }, 20);

      return $timeout(function() {
        //After animating in, allow hide on backdrop click
        self.$el.on('click', function(e) {
          if (self.backdropClickToClose && e.target === self.el) {
            self.hide();
          }
        });
      }, 400);
    },

    /**
     * @ngdoc method
     * @name ionicModal#hide
     * @description Hide this modal instance.
     * @returns {promise} A promise which is resolved when the modal is finished animating out.
     */
    hide: function() {
      var self = this;
      var modalEl = jqLite(self.modalEl);

      self.el.classList.remove('active');
      modalEl.addClass('ng-leave');

      $timeout(function(){
        modalEl.addClass('ng-leave-active')
               .removeClass('ng-enter ng-enter-active active');
      }, 20);

      self.$el.off('click');
      self._isShown = false;
      self.scope.$parent && self.scope.$parent.$broadcast(self.viewType + '.hidden', self);
      self._deregisterBackButton && self._deregisterBackButton();

      ionic.views.Modal.prototype.hide.call(self);

      // clean up event listeners
      if(self.positionView) {
        ionic.off('resize',null,window);
      }

      return $timeout(function(){
        $ionicBody.removeClass(self.viewType + '-open');
        self.el.classList.add('hide');
      }, self.hideDelay || 320);
    },

    /**
     * @ngdoc method
     * @name ionicModal#remove
     * @description Remove this modal instance from the DOM and clean up.
     * @returns {promise} A promise which is resolved when the modal is finished animating out.
     */
    remove: function() {
      var self = this;
      self.scope.$parent && self.scope.$parent.$broadcast(self.viewType + '.removed', self);

      return self.hide().then(function() {
        self.scope.$destroy();
        self.$el.remove();
      });
    },

    /**
     * @ngdoc method
     * @name ionicModal#isShown
     * @returns boolean Whether this modal is currently shown.
     */
    isShown: function() {
      return !!this._isShown;
    }
  });

  var createModal = function(templateString, options) {
    // Create a new scope for the modal
    var scope = options.scope && options.scope.$new() || $rootScope.$new(true);

    options.viewType = options.viewType || 'modal';

    extend(scope, {
      $hasHeader: false,
      $hasSubheader: false,
      $hasFooter: false,
      $hasSubfooter: false,
      $hasTabs: false,
      $hasTabsTop: false
    });

    // Compile the template
    var element = $compile('<ion-' + options.viewType + '>' + templateString + '</ion-' + options.viewType + '>')(scope);

    options.$el = element;
    options.el = element[0];
    options.modalEl = options.el.querySelector('.' + options.viewType);
    var modal = new ModalView(options);

    modal.scope = scope;

    // If this wasn't a defined scope, we can assign the viewType to the isolated scope
    // we created
    if(!options.scope) {
      scope[ options.viewType ] = modal;
    }

    return modal;
  };

  return {
    /**
     * @ngdoc method
     * @name $ionicModal#fromTemplate
     * @param {string} templateString The template string to use as the modal's
     * content.
     * @param {object} options Options to be passed {@link ionic.controller:ionicModal#initialize ionicModal#initialize} method.
     * @returns {object} An instance of an {@link ionic.controller:ionicModal}
     * controller.
     */
    fromTemplate: function(templateString, options) {
      var modal = createModal(templateString, options || {});
      return modal;
    },
    /**
     * @ngdoc method
     * @name $ionicModal#fromTemplateUrl
     * @param {string} templateUrl The url to load the template from.
     * @param {object} options Options to be passed {@link ionic.controller:ionicModal#initialize ionicModal#initialize} method.
     * options object.
     * @returns {promise} A promise that will be resolved with an instance of
     * an {@link ionic.controller:ionicModal} controller.
     */
    fromTemplateUrl: function(url, options, _) {
      var cb;
      //Deprecated: allow a callback as second parameter. Now we return a promise.
      if (angular.isFunction(options)) {
        cb = options;
        options = _;
      }
      return $ionicTemplateLoader.load(url).then(function(templateString) {
        var modal = createModal(templateString, options || {});
        cb && cb(modal);
        return modal;
      });
    }
  };
}]);


/**
 * @ngdoc service
 * @name $ionicNavBarDelegate
 * @module ionic
 * @description
 * Delegate for controlling the {@link ionic.directive:ionNavBar} directive.
 *
 * @usage
 *
 * ```html
 * <body ng-controller="MyCtrl">
 *   <ion-nav-bar>
 *     <button ng-click="setNavTitle('banana')">
 *       Set title to banana!
 *     </button>
 *   </ion-nav-bar>
 * </body>
 * ```
 * ```js
 * function MyCtrl($scope, $ionicNavBarDelegate) {
 *   $scope.setNavTitle = function(title) {
 *     $ionicNavBarDelegate.setTitle(title);
 *   }
 * }
 * ```
 */
IonicModule
.service('$ionicNavBarDelegate', delegateService([
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#back
   * @description Goes back in the view history.
   * @param {DOMEvent=} event The event object (eg from a tap event)
   */
  'back',
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#align
   * @description Aligns the title with the buttons in a given direction.
   * @param {string=} direction The direction to the align the title text towards.
   * Available: 'left', 'right', 'center'. Default: 'center'.
   */
  'align',
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#showBackButton
   * @description
   * Set/get whether the {@link ionic.directive:ionNavBackButton} is shown
   * (if it exists).
   * @param {boolean=} show Whether to show the back button.
   * @returns {boolean} Whether the back button is shown.
   */
  'showBackButton',
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#showBar
   * @description
   * Set/get whether the {@link ionic.directive:ionNavBar} is shown.
   * @param {boolean} show Whether to show the bar.
   * @returns {boolean} Whether the bar is shown.
   */
  'showBar',
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#setTitle
   * @description
   * Set the title for the {@link ionic.directive:ionNavBar}.
   * @param {string} title The new title to show.
   */
  'setTitle',
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#changeTitle
   * @description
   * Change the title, transitioning the new title in and the old one out in a given direction.
   * @param {string} title The new title to show.
   * @param {string} direction The direction to transition the new title in.
   * Available: 'forward', 'back'.
   */
  'changeTitle',
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#getTitle
   * @returns {string} The current title of the navbar.
   */
  'getTitle',
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#getPreviousTitle
   * @returns {string} The previous title of the navbar.
   */
  'getPreviousTitle'
  /**
   * @ngdoc method
   * @name $ionicNavBarDelegate#$getByHandle
   * @param {string} handle
   * @returns `delegateInstance` A delegate instance that controls only the
   * navBars with delegate-handle matching the given handle.
   *
   * Example: `$ionicNavBarDelegate.$getByHandle('myHandle').setTitle('newTitle')`
   */
]));

var PLATFORM_BACK_BUTTON_PRIORITY_VIEW = 100;
var PLATFORM_BACK_BUTTON_PRIORITY_SIDE_MENU = 150;
var PLATFORM_BACK_BUTTON_PRIORITY_MODAL = 200;
var PLATFORM_BACK_BUTTON_PRIORITY_ACTION_SHEET = 300;
var PLATFORM_BACK_BUTTON_PRIORITY_POPUP = 400;
var PLATFORM_BACK_BUTTON_PRIORITY_LOADING = 500;

/**
 * @ngdoc service
 * @name $ionicPlatform
 * @module ionic
 * @description
 * An angular abstraction of {@link ionic.utility:ionic.Platform}.
 *
 * Used to detect the current platform, as well as do things like override the
 * Android back button in PhoneGap/Cordova.
 */
IonicModule
.provider('$ionicPlatform', function() {
  return {
    $get: ['$q', '$rootScope', function($q, $rootScope) {
      var self = {

        /**
         * @ngdoc method
         * @name $ionicPlatform#onHardwareBackButton
         * @description
         * Some platforms have a hardware back button, so this is one way to
         * bind to it.
         * @param {function} callback the callback to trigger when this event occurs
         */
        onHardwareBackButton: function(cb) {
          ionic.Platform.ready(function() {
            document.addEventListener('backbutton', cb, false);
          });
        },

        /**
         * @ngdoc method
         * @name $ionicPlatform#offHardwareBackButton
         * @description
         * Remove an event listener for the backbutton.
         * @param {function} callback The listener function that was
         * originally bound.
         */
        offHardwareBackButton: function(fn) {
          ionic.Platform.ready(function() {
            document.removeEventListener('backbutton', fn);
          });
        },

        /**
         * @ngdoc method
         * @name $ionicPlatform#registerBackButtonAction
         * @description
         * Register a hardware back button action. Only one action will execute
         * when the back button is clicked, so this method decides which of
         * the registered back button actions has the highest priority.
         *
         * For example, if an actionsheet is showing, the back button should
         * close the actionsheet, but it should not also go back a page view
         * or close a modal which may be open.
         *
         * @param {function} callback Called when the back button is pressed,
         * if this listener is the highest priority.
         * @param {number} priority Only the highest priority will execute.
         * @param {*=} actionId The id to assign this action. Default: a
         * random unique id.
         * @returns {function} A function that, when called, will deregister
         * this backButtonAction.
         */
        $backButtonActions: {},
        registerBackButtonAction: function(fn, priority, actionId) {

          if(!self._hasBackButtonHandler) {
            // add a back button listener if one hasn't been setup yet
            self.$backButtonActions = {};
            self.onHardwareBackButton(self.hardwareBackButtonClick);
            self._hasBackButtonHandler = true;
          }

          var action = {
            id: (actionId ? actionId : ionic.Utils.nextUid()),
            priority: (priority ? priority : 0),
            fn: fn
          };
          self.$backButtonActions[action.id] = action;

          // return a function to de-register this back button action
          return function() {
            delete self.$backButtonActions[action.id];
          };
        },

        /**
         * @private
         */
        hardwareBackButtonClick: function(e){
          // loop through all the registered back button actions
          // and only run the last one of the highest priority
          var priorityAction, actionId;
          for(actionId in self.$backButtonActions) {
            if(!priorityAction || self.$backButtonActions[actionId].priority >= priorityAction.priority) {
              priorityAction = self.$backButtonActions[actionId];
            }
          }
          if(priorityAction) {
            priorityAction.fn(e);
            return priorityAction;
          }
        },

        is: function(type) {
          return ionic.Platform.is(type);
        },

        /**
         * @ngdoc method
         * @name $ionicPlatform#on
         * @description
         * Add Cordova event listeners, such as `pause`, `resume`, `volumedownbutton`, `batterylow`,
         * `offline`, etc. More information about available event types can be found in
         * [Cordova's event documentation](https://cordova.apache.org/docs/en/edge/cordova_events_events.md.html#Events).
         * @param {string} type Cordova [event type](https://cordova.apache.org/docs/en/edge/cordova_events_events.md.html#Events).
         * @param {function} callback Called when the Cordova event is fired.
         * @returns {function} Returns a deregistration function to remove the event listener.
         */
        on: function(type, cb) {
          ionic.Platform.ready(function(){
            document.addEventListener(type, cb, false);
          });
          return function() {
            ionic.Platform.ready(function(){
              document.removeEventListener(type, cb);
            });
          };
        },

        /**
         * @ngdoc method
         * @name $ionicPlatform#ready
         * @description
         * Trigger a callback once the device is ready,
         * or immediately if the device is already ready.
         * @param {function=} callback The function to call.
         * @returns {promise} A promise which is resolved when the device is ready.
         */
        ready: function(cb) {
          var q = $q.defer();

          ionic.Platform.ready(function(){
            q.resolve();
            cb && cb();
          });

          return q.promise;
        }
      };
      return self;
    }]
  };

});


/**
 * @ngdoc service
 * @name $ionicPopover
 * @module ionic
 * @description
 *
 * Related: {@link ionic.controller:ionicPopover ionicPopover controller}.
 *
 * The Popover is a view that floats above an app’s content. Popovers provide an
 * easy way to present or gather information from the user and are
 * commonly used in the following situations:
 *
 * - Show more info about the current view
 * - Select a commonly used tool or configuration
 * - Present a list of actions to perform inside one of your views
 *
 * Put the content of the popover inside of an `<ion-popover-view>` element.
 *
 * @usage
 * ```html
 * <p>
 *   <button ng-click="openPopover($event)">Open Popover</button>
 * </p>
 *
 * <script id="my-popover.html" type="text/ng-template">
 *   <ion-popover-view>
 *     <ion-header-bar>
 *       <h1 class="title">My Popover Title</h1>
 *     </ion-header-bar>
 *     <ion-content>
 *       Hello!
 *     </ion-content>
 *   </ion-popover-view>
 * </script>
 * ```
 * ```js
 * angular.module('testApp', ['ionic'])
 * .controller('MyController', function($scope, $ionicPopover) {
 *   $ionicPopover.fromTemplateUrl('my-popover.html', {
 *     scope: $scope,
 *   }).then(function(popover) {
 *     $scope.popover = popover;
 *   });
 *   $scope.openPopover = function($event) {
 *     $scope.popover.show($event);
 *   };
 *   $scope.closePopover = function() {
 *     $scope.popover.hide();
 *   };
 *   //Cleanup the popover when we're done with it!
 *   $scope.$on('$destroy', function() {
 *     $scope.popover.remove();
 *   });
 *   // Execute action on hide popover
 *   $scope.$on('popover.hidden', function() {
 *     // Execute action
 *   });
 *   // Execute action on remove popover
 *   $scope.$on('popover.removed', function() {
 *     // Execute action
 *   });
 * });
 * ```
 */


IonicModule
.factory('$ionicPopover', ['$ionicModal', '$ionicPosition', '$document', '$window',
function($ionicModal, $ionicPosition, $document, $window) {

  var POPOVER_BODY_PADDING = 6;

  var POPOVER_OPTIONS = {
    viewType: 'popover',
    hideDelay: 1,
    animation: 'none',
    positionView: positionView
  };

  function positionView(target, popoverEle) {
    var targetEle = angular.element(target.target || target);
    var buttonOffset = $ionicPosition.offset( targetEle );
    var popoverWidth = popoverEle.prop('offsetWidth');
    var popoverHeight = popoverEle.prop('offsetHeight');
    var bodyWidth = $document[0].body.clientWidth;
    // clientHeight doesn't work on all platforms for body
    var bodyHeight = $window.innerHeight;

    var popoverCSS = {
      left: buttonOffset.left + buttonOffset.width / 2 - popoverWidth / 2
    };
    var arrowEle = jqLite(popoverEle[0].querySelector('.popover-arrow'));

    if (popoverCSS.left < POPOVER_BODY_PADDING) {
      popoverCSS.left = POPOVER_BODY_PADDING;
    } else if(popoverCSS.left + popoverWidth + POPOVER_BODY_PADDING > bodyWidth) {
      popoverCSS.left = bodyWidth - popoverWidth - POPOVER_BODY_PADDING;
    }

    // If the popover when popped down stretches past bottom of screen,
    // make it pop up
    if (buttonOffset.top + buttonOffset.height + popoverHeight > bodyHeight) {
      popoverCSS.top = buttonOffset.top - popoverHeight;
      popoverEle.addClass('popover-bottom');
    } else {
      popoverCSS.top = buttonOffset.top + buttonOffset.height;
      popoverEle.removeClass('popover-bottom');
    }

    arrowEle.css({
      left: buttonOffset.left + buttonOffset.width / 2 -
        arrowEle.prop('offsetWidth') / 2 - popoverCSS.left + 'px'
    });

    popoverEle.css({
      top: popoverCSS.top + 'px',
      left: popoverCSS.left + 'px',
      marginLeft: '0',
      opacity: '1'
    });

  }

  /**
   * @ngdoc controller
   * @name ionicPopover
   * @module ionic
   * @description
   * Instantiated by the {@link ionic.service:$ionicPopover} service.
   *
   * Be sure to call [remove()](#remove) when you are done with each popover
   * to clean it up and avoid memory leaks.
   *
   * Note: a popover will broadcast 'popover.shown', 'popover.hidden', and 'popover.removed' events from its originating
   * scope, passing in itself as an event argument. Both the popover.removed and popover.hidden events are
   * called when the popover is removed.
   */

  /**
   * @ngdoc method
   * @name ionicPopover#initialize
   * @description Creates a new popover controller instance.
   * @param {object} options An options object with the following properties:
   *  - `{object=}` `scope` The scope to be a child of.
   *    Default: creates a child of $rootScope.
   *  - `{boolean=}` `focusFirstInput` Whether to autofocus the first input of
   *    the popover when shown.  Default: false.
   *  - `{boolean=}` `backdropClickToClose` Whether to close the popover on clicking the backdrop.
   *    Default: true.
   *  - `{boolean=}` `hardwareBackButtonClose` Whether the popover can be closed using the hardware
   *    back button on Android and similar devices.  Default: true.
   */

  /**
   * @ngdoc method
   * @name ionicPopover#show
   * @description Show this popover instance.
   * @param {$event} $event The $event or target element which the popover should align
   * itself next to.
   * @returns {promise} A promise which is resolved when the popover is finished animating in.
   */

  /**
   * @ngdoc method
   * @name ionicPopover#hide
   * @description Hide this popover instance.
   * @returns {promise} A promise which is resolved when the popover is finished animating out.
   */

  /**
   * @ngdoc method
   * @name ionicPopover#remove
   * @description Remove this popover instance from the DOM and clean up.
   * @returns {promise} A promise which is resolved when the popover is finished animating out.
   */

  /**
   * @ngdoc method
   * @name ionicPopover#isShown
   * @returns boolean Whether this popover is currently shown.
   */

  return {
    /**
     * @ngdoc method
     * @name $ionicPopover#fromTemplate
     * @param {string} templateString The template string to use as the popovers's
     * content.
     * @param {object} options Options to be passed to the initialize method.
     * @returns {object} An instance of an {@link ionic.controller:ionicPopover}
     * controller (ionicPopover is built on top of $ionicPopover).
     */
    fromTemplate: function(templateString, options) {
      return $ionicModal.fromTemplate(templateString, ionic.Utils.extend(options || {}, POPOVER_OPTIONS) );
    },
    /**
     * @ngdoc method
     * @name $ionicPopover#fromTemplateUrl
     * @param {string} templateUrl The url to load the template from.
     * @param {object} options Options to be passed to the initialize method.
     * @returns {promise} A promise that will be resolved with an instance of
     * an {@link ionic.controller:ionicPopover} controller (ionicPopover is built on top of $ionicPopover).
     */
    fromTemplateUrl: function(url, options, _) {
      return $ionicModal.fromTemplateUrl(url, options, ionic.Utils.extend(options || {}, POPOVER_OPTIONS) );
    }
  };

}]);


var POPUP_TPL =
  '<div class="popup-container">' +
    '<div class="popup">' +
      '<div class="popup-head">' +
        '<h3 class="popup-title" ng-bind-html="title"></h3>' +
        '<h5 class="popup-sub-title" ng-bind-html="subTitle" ng-if="subTitle"></h5>' +
      '</div>' +
      '<div class="popup-body">' +
      '</div>' +
      '<div class="popup-buttons">' +
        '<button ng-repeat="button in buttons" ng-click="$buttonTapped(button, $event)" class="button" ng-class="button.type || \'button-default\'" ng-bind-html="button.text"></button>' +
      '</div>' +
    '</div>' +
  '</div>';

/**
 * @ngdoc service
 * @name $ionicPopup
 * @module ionic
 * @restrict E
 * @codepen zkmhJ
 * @description
 *
 * The Ionic Popup service allows programmatically creating and showing popup
 * windows that require the user to respond in order to continue.
 *
 * The popup system has support for more flexible versions of the built in `alert()`, `prompt()`,
 * and `confirm()` functions that users are used to, in addition to allowing popups with completely
 * custom content and look.
 *
 * An input can be given an `autofocus` attribute so it automatically receives focus when
 * the popup first shows. However, depending on certain use-cases this can cause issues with
 * the tap/click system, which is why Ionic prefers using the `autofocus` attribute as
 * an opt-in feature and not the default.
 *
 * @usage
 * A few basic examples, see below for details about all of the options available.
 *
 * ```js
 *angular.module('mySuperApp', ['ionic'])
 *.controller('PopupCtrl',function($scope, $ionicPopup, $timeout) {
 *
 * // Triggered on a button click, or some other target
 * $scope.showPopup = function() {
 *   $scope.data = {}
 *
 *   // An elaborate, custom popup
 *   var myPopup = $ionicPopup.show({
 *     template: '<input type="password" ng-model="data.wifi">',
 *     title: 'Enter Wi-Fi Password',
 *     subTitle: 'Please use normal things',
 *     scope: $scope,
 *     buttons: [
 *       { text: 'Cancel' },
 *       {
 *         text: '<b>Save</b>',
 *         type: 'button-positive',
 *         onTap: function(e) {
 *           if (!$scope.data.wifi) {
 *             //don't allow the user to close unless he enters wifi password
 *             e.preventDefault();
 *           } else {
 *             return $scope.data.wifi;
 *           }
 *         }
 *       }
 *     ]
 *   });
 *   myPopup.then(function(res) {
 *     console.log('Tapped!', res);
 *   });
 *   $timeout(function() {
 *      myPopup.close(); //close the popup after 3 seconds for some reason
 *   }, 3000);
 *  };
 *  // A confirm dialog
 *  $scope.showConfirm = function() {
 *    var confirmPopup = $ionicPopup.confirm({
 *      title: 'Consume Ice Cream',
 *      template: 'Are you sure you want to eat this ice cream?'
 *    });
 *    confirmPopup.then(function(res) {
 *      if(res) {
 *        console.log('You are sure');
 *      } else {
 *        console.log('You are not sure');
 *      }
 *    });
 *  };
 *
 *  // An alert dialog
 *  $scope.showAlert = function() {
 *    var alertPopup = $ionicPopup.alert({
 *      title: 'Don\'t eat that!',
 *      template: 'It might taste good'
 *    });
 *    alertPopup.then(function(res) {
 *      console.log('Thank you for not eating my delicious ice cream cone');
 *    });
 *  };
 *});
 *```
 */

IonicModule
.factory('$ionicPopup', [
  '$ionicTemplateLoader',
  '$ionicBackdrop',
  '$q',
  '$timeout',
  '$rootScope',
  '$ionicBody',
  '$compile',
  '$ionicPlatform',
function($ionicTemplateLoader, $ionicBackdrop, $q, $timeout, $rootScope, $ionicBody, $compile, $ionicPlatform) {
  //TODO allow this to be configured
  var config = {
    stackPushDelay: 75
  };
  var popupStack = [];
  var $ionicPopup = {
    /**
     * @ngdoc method
     * @description
     * Show a complex popup. This is the master show function for all popups.
     *
     * A complex popup has a `buttons` array, with each button having a `text` and `type`
     * field, in addition to an `onTap` function.  The `onTap` function, called when
     * the corresponding button on the popup is tapped, will by default close the popup
     * and resolve the popup promise with its return value.  If you wish to prevent the
     * default and keep the popup open on button tap, call `event.preventDefault()` on the
     * passed in tap event.  Details below.
     *
     * @name $ionicPopup#show
     * @param {object} options The options for the new popup, of the form:
     *
     * ```
     * {
     *   title: '', // String. The title of the popup.
     *   subTitle: '', // String (optional). The sub-title of the popup.
     *   template: '', // String (optional). The html template to place in the popup body.
     *   templateUrl: '', // String (optional). The URL of an html template to place in the popup   body.
     *   scope: null, // Scope (optional). A scope to link to the popup content.
     *   buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
     *     text: 'Cancel',
     *     type: 'button-default',
     *     onTap: function(e) {
     *       // e.preventDefault() will stop the popup from closing when tapped.
     *       e.preventDefault();
     *     }
     *   }, {
     *     text: 'OK',
     *     type: 'button-positive',
     *     onTap: function(e) {
     *       // Returning a value will cause the promise to resolve with the given value.
     *       return scope.data.response;
     *     }
     *   }]
     * }
     * ```
     *
     * @returns {object} A promise which is resolved when the popup is closed. Has an additional
     * `close` function, which can be used to programmatically close the popup.
     */
    show: showPopup,

    /**
     * @ngdoc method
     * @name $ionicPopup#alert
     * @description Show a simple alert popup with a message and one button that the user can
     * tap to close the popup.
     *
     * @param {object} options The options for showing the alert, of the form:
     *
     * ```
     * {
     *   title: '', // String. The title of the popup.
     *   subTitle: '', // String (optional). The sub-title of the popup.
     *   template: '', // String (optional). The html template to place in the popup body.
     *   templateUrl: '', // String (optional). The URL of an html template to place in the popup   body.
     *   okText: '', // String (default: 'OK'). The text of the OK button.
     *   okType: '', // String (default: 'button-positive'). The type of the OK button.
     * }
     * ```
     *
     * @returns {object} A promise which is resolved when the popup is closed. Has one additional
     * function `close`, which can be called with any value to programmatically close the popup
     * with the given value.
     */
    alert: showAlert,

    /**
     * @ngdoc method
     * @name $ionicPopup#confirm
     * @description
     * Show a simple confirm popup with a Cancel and OK button.
     *
     * Resolves the promise with true if the user presses the OK button, and false if the
     * user presses the Cancel button.
     *
     * @param {object} options The options for showing the confirm popup, of the form:
     *
     * ```
     * {
     *   title: '', // String. The title of the popup.
     *   subTitle: '', // String (optional). The sub-title of the popup.
     *   template: '', // String (optional). The html template to place in the popup body.
     *   templateUrl: '', // String (optional). The URL of an html template to place in the popup   body.
     *   cancelText: '', // String (default: 'Cancel'). The text of the Cancel button.
     *   cancelType: '', // String (default: 'button-default'). The type of the Cancel button.
     *   okText: '', // String (default: 'OK'). The text of the OK button.
     *   okType: '', // String (default: 'button-positive'). The type of the OK button.
     * }
     * ```
     *
     * @returns {object} A promise which is resolved when the popup is closed. Has one additional
     * function `close`, which can be called with any value to programmatically close the popup
     * with the given value.
     */
    confirm: showConfirm,

    /**
     * @ngdoc method
     * @name $ionicPopup#prompt
     * @description Show a simple prompt popup, which has an input, OK button, and Cancel button.
     * Resolves the promise with the value of the input if the user presses OK, and with undefined
     * if the user presses Cancel.
     *
     * ```javascript
     *  $ionicPopup.prompt({
     *    title: 'Password Check',
     *    template: 'Enter your secret password',
     *    inputType: 'password',
     *    inputPlaceholder: 'Your password'
     *  }).then(function(res) {
     *    console.log('Your password is', res);
     *  });
     * ```
     * @param {object} options The options for showing the prompt popup, of the form:
     *
     * ```
     * {
     *   title: '', // String. The title of the popup.
     *   subTitle: '', // String (optional). The sub-title of the popup.
     *   template: '', // String (optional). The html template to place in the popup body.
     *   templateUrl: '', // String (optional). The URL of an html template to place in the popup   body.
     *   inputType: // String (default: 'text'). The type of input to use
     *   inputPlaceholder: // String (default: ''). A placeholder to use for the input.
     *   cancelText: // String (default: 'Cancel'. The text of the Cancel button.
     *   cancelType: // String (default: 'button-default'). The type of the Cancel button.
     *   okText: // String (default: 'OK'). The text of the OK button.
     *   okType: // String (default: 'button-positive'). The type of the OK button.
     * }
     * ```
     *
     * @returns {object} A promise which is resolved when the popup is closed. Has one additional
     * function `close`, which can be called with any value to programmatically close the popup
     * with the given value.
     */
    prompt: showPrompt,
    /**
     * @private for testing
     */
    _createPopup: createPopup,
    _popupStack: popupStack
  };

  return $ionicPopup;

  function createPopup(options) {
    options = extend({
      scope: null,
      title: '',
      buttons: [],
    }, options || {});

    var popupPromise = $ionicTemplateLoader.compile({
      template: POPUP_TPL,
      scope: options.scope && options.scope.$new(),
      appendTo: $ionicBody.get()
    });
    var contentPromise = options.templateUrl ?
      $ionicTemplateLoader.load(options.templateUrl) :
      $q.when(options.template || options.content || '');

    return $q.all([popupPromise, contentPromise])
    .then(function(results) {
      var self = results[0];
      var content = results[1];
      results[0] = results[1] = null;
      var responseDeferred = $q.defer();

      self.responseDeferred = responseDeferred;

      //Can't ng-bind-html for popup-body because it can be insecure html
      //(eg an input in case of prompt)
      var body = jqLite(self.element[0].querySelector('.popup-body'));
      if (content) {
        body.html(content);
        $compile(body.contents())(self.scope);
      } else {
        body.remove();
      }

      extend(self.scope, {
        title: options.title,
        buttons: options.buttons,
        subTitle: options.subTitle,
        $buttonTapped: function(button, event) {
          var result = (button.onTap || angular.noop)(event);
          event = event.originalEvent || event; //jquery events

          if (!event.defaultPrevented) {
            responseDeferred.resolve(result);
          }
        }
      });

      self.show = function() {
        if (self.isShown) return;

        self.isShown = true;
        ionic.requestAnimationFrame(function() {
          //if hidden while waiting for raf, don't show
          if (!self.isShown) return;

          self.element.removeClass('popup-hidden');
          self.element.addClass('popup-showing active');
          focusInput(self.element);
        });
      };
      self.hide = function(callback) {
        callback = callback || angular.noop;
        if (!self.isShown) return callback();

        self.isShown = false;
        self.element.removeClass('active');
        self.element.addClass('popup-hidden');
        $timeout(callback, 250);
      };
      self.remove = function() {
        if (self.removed) return;

        self.hide(function() {
          self.element.remove();
          self.scope.$destroy();
        });

        self.removed = true;
      };

      return self;
    });
  }

  function onHardwareBackButton(e) {
    popupStack[0] && popupStack[0].responseDeferred.resolve();
  }

  function showPopup(options) {
    var popupPromise = $ionicPopup._createPopup(options);
    var previousPopup = popupStack[0];

    if (previousPopup) {
      previousPopup.hide();
    }

    var resultPromise = $timeout(angular.noop, previousPopup ? config.stackPushDelay : 0)
    .then(function() { return popupPromise; })
    .then(function(popup) {
      if (!previousPopup) {
        //Add popup-open & backdrop if this is first popup
        $ionicBody.addClass('popup-open');
        $ionicBackdrop.retain();
        //only show the backdrop on the first popup
        $ionicPopup._backButtonActionDone = $ionicPlatform.registerBackButtonAction(
          onHardwareBackButton,
          PLATFORM_BACK_BUTTON_PRIORITY_POPUP
        );
      }
      popupStack.unshift(popup);
      popup.show();

      //DEPRECATED: notify the promise with an object with a close method
      popup.responseDeferred.notify({
        close: resultPromise.close
      });

      return popup.responseDeferred.promise.then(function(result) {
        var index = popupStack.indexOf(popup);
        if (index !== -1) {
          popupStack.splice(index, 1);
        }
        popup.remove();

        var previousPopup = popupStack[0];
        if (previousPopup) {
          previousPopup.show();
        } else {
          //Remove popup-open & backdrop if this is last popup
          $timeout(function(){
            // wait to remove this due to a 300ms delay native
            // click which would trigging whatever was underneath this
            $ionicBody.removeClass('popup-open');
          }, 400);
          $timeout(function(){
            if(popupStack.length === 0)$ionicBackdrop.release();
          }, config.stackPushDelay || 0);
          ($ionicPopup._backButtonActionDone || angular.noop)();
        }
        return result;
      });
    });

    function close(result) {
      popupPromise.then(function(popup) {
        if (!popup.removed) {
          popup.responseDeferred.resolve(result);
        }
      });
    }
    resultPromise.close = close;

    return resultPromise;
  }

  function focusInput(element) {
    var focusOn = element[0].querySelector('[autofocus]');
    if (focusOn) {
      focusOn.focus();
    }
  }

  function showAlert(opts) {
    return showPopup( extend({
      buttons: [{
        text: opts.okText || 'OK',
        type: opts.okType || 'button-positive',
        onTap: function(e) {
          return true;
        }
      }]
    }, opts || {}) );
  }

  function showConfirm(opts) {
    return showPopup( extend({
      buttons: [{
        text: opts.cancelText || 'Cancel' ,
        type: opts.cancelType || 'button-default',
        onTap: function(e) { return false; }
      }, {
        text: opts.okText || 'OK',
        type: opts.okType || 'button-positive',
        onTap: function(e) { return true; }
      }]
    }, opts || {}) );
  }

  function showPrompt(opts) {
    var scope = $rootScope.$new(true);
    scope.data = {};
    var text = '';
    if(opts.template && /<[a-z][\s\S]*>/i.test(opts.template) === false){
      text = '<span>'+opts.template+'</span>';
      delete opts.template;
    }
    return showPopup( extend({
      template: text+'<input ng-model="data.response" type="' + (opts.inputType || 'text') +
        '" placeholder="' + (opts.inputPlaceholder || '') + '">',
      scope: scope,
      buttons: [{
        text: opts.cancelText || 'Cancel',
        type: opts.cancelType|| 'button-default',
        onTap: function(e) {}
      }, {
        text: opts.okText || 'OK',
        type: opts.okType || 'button-positive',
        onTap: function(e) {
          return scope.data.response || '';
        }
      }]
    }, opts || {}) );
  }
}]);


/**
 * @ngdoc service
 * @name $ionicPosition
 * @module ionic
 * @description
 * A set of utility methods that can be use to retrieve position of DOM elements.
 * It is meant to be used where we need to absolute-position DOM elements in
 * relation to other, existing elements (this is the case for tooltips, popovers, etc.).
 *
 * Adapted from [AngularUI Bootstrap](https://github.com/angular-ui/bootstrap/blob/master/src/position/position.js),
 * ([license](https://github.com/angular-ui/bootstrap/blob/master/LICENSE))
 */
IonicModule
.factory('$ionicPosition', ['$document', '$window', function ($document, $window) {

  function getStyle(el, cssprop) {
    if (el.currentStyle) { //IE
      return el.currentStyle[cssprop];
    } else if ($window.getComputedStyle) {
      return $window.getComputedStyle(el)[cssprop];
    }
    // finally try and get inline style
    return el.style[cssprop];
  }

  /**
   * Checks if a given element is statically positioned
   * @param element - raw DOM element
   */
  function isStaticPositioned(element) {
    return (getStyle(element, 'position') || 'static' ) === 'static';
  }

  /**
   * returns the closest, non-statically positioned parentOffset of a given element
   * @param element
   */
  var parentOffsetEl = function (element) {
    var docDomEl = $document[0];
    var offsetParent = element.offsetParent || docDomEl;
    while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent) ) {
      offsetParent = offsetParent.offsetParent;
    }
    return offsetParent || docDomEl;
  };

  return {
    /**
     * @ngdoc method
     * @name $ionicPosition#position
     * @description Get the current coordinates of the element, relative to the offset parent.
     * Read-only equivalent of [jQuery's position function](http://api.jquery.com/position/).
     * @param {element} element The element to get the position of.
     * @returns {object} Returns an object containing the properties top, left, width and height.
     */
    position: function (element) {
      var elBCR = this.offset(element);
      var offsetParentBCR = { top: 0, left: 0 };
      var offsetParentEl = parentOffsetEl(element[0]);
      if (offsetParentEl != $document[0]) {
        offsetParentBCR = this.offset(angular.element(offsetParentEl));
        offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
        offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
      }

      var boundingClientRect = element[0].getBoundingClientRect();
      return {
        width: boundingClientRect.width || element.prop('offsetWidth'),
        height: boundingClientRect.height || element.prop('offsetHeight'),
        top: elBCR.top - offsetParentBCR.top,
        left: elBCR.left - offsetParentBCR.left
      };
    },

    /**
     * @ngdoc method
     * @name $ionicPosition#offset
     * @description Get the current coordinates of the element, relative to the document.
     * Read-only equivalent of [jQuery's offset function](http://api.jquery.com/offset/).
     * @param {element} element The element to get the offset of.
     * @returns {object} Returns an object containing the properties top, left, width and height.
     */
    offset: function (element) {
      var boundingClientRect = element[0].getBoundingClientRect();
      return {
        width: boundingClientRect.width || element.prop('offsetWidth'),
        height: boundingClientRect.height || element.prop('offsetHeight'),
        top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
        left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
      };
    }

  };
}]);


/**
 * @ngdoc service
 * @name $ionicScrollDelegate
 * @module ionic
 * @description
 * Delegate for controlling scrollViews (created by
 * {@link ionic.directive:ionContent} and
 * {@link ionic.directive:ionScroll} directives).
 *
 * Methods called directly on the $ionicScrollDelegate service will control all scroll
 * views.  Use the {@link ionic.service:$ionicScrollDelegate#$getByHandle $getByHandle}
 * method to control specific scrollViews.
 *
 * @usage
 *
 * ```html
 * <body ng-controller="MainCtrl">
 *   <ion-content>
 *     <button ng-click="scrollTop()">Scroll to Top!</button>
 *   </ion-content>
 * </body>
 * ```
 * ```js
 * function MainCtrl($scope, $ionicScrollDelegate) {
 *   $scope.scrollTop = function() {
 *     $ionicScrollDelegate.scrollTop();
 *   };
 * }
 * ```
 *
 * Example of advanced usage, with two scroll areas using `delegate-handle`
 * for fine control.
 *
 * ```html
 * <body ng-controller="MainCtrl">
 *   <ion-content delegate-handle="mainScroll">
 *     <button ng-click="scrollMainToTop()">
 *       Scroll content to top!
 *     </button>
 *     <ion-scroll delegate-handle="small" style="height: 100px;">
 *       <button ng-click="scrollSmallToTop()">
 *         Scroll small area to top!
 *       </button>
 *     </ion-scroll>
 *   </ion-content>
 * </body>
 * ```
 * ```js
 * function MainCtrl($scope, $ionicScrollDelegate) {
 *   $scope.scrollMainToTop = function() {
 *     $ionicScrollDelegate.$getByHandle('mainScroll').scrollTop();
 *   };
 *   $scope.scrollSmallToTop = function() {
 *     $ionicScrollDelegate.$getByHandle('small').scrollTop();
 *   };
 * }
 * ```
 */
IonicModule
.service('$ionicScrollDelegate', delegateService([
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#resize
   * @description Tell the scrollView to recalculate the size of its container.
   */
  'resize',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#scrollTop
   * @param {boolean=} shouldAnimate Whether the scroll should animate.
   */
  'scrollTop',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#scrollBottom
   * @param {boolean=} shouldAnimate Whether the scroll should animate.
   */
  'scrollBottom',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#scrollTo
   * @param {number} left The x-value to scroll to.
   * @param {number} top The y-value to scroll to.
   * @param {boolean=} shouldAnimate Whether the scroll should animate.
   */
  'scrollTo',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#scrollBy
   * @param {number} left The x-offset to scroll by.
   * @param {number} top The y-offset to scroll by.
   * @param {boolean=} shouldAnimate Whether the scroll should animate.
   */
  'scrollBy',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#zoomTo
   * @param {number} level Level to zoom to.
   * @param {boolean=} animate Whether to animate the zoom.
   * @param {number=} originLeft Zoom in at given left coordinate.
   * @param {number=} originTop Zoom in at given top coordinate.
   */
  'zoomTo',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#zoomBy
   * @param {number} factor The factor to zoom by.
   * @param {boolean=} animate Whether to animate the zoom.
   * @param {number=} originLeft Zoom in at given left coordinate.
   * @param {number=} originTop Zoom in at given top coordinate.
   */
  'zoomBy',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#getScrollPosition
   * @returns {object} The scroll position of this view, with the following properties:
   *  - `{number}` `left` The distance the user has scrolled from the left (starts at 0).
   *  - `{number}` `top` The distance the user has scrolled from the top (starts at 0).
   */
  'getScrollPosition',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#anchorScroll
   * @description Tell the scrollView to scroll to the element with an id
   * matching window.location.hash.
   *
   * If no matching element is found, it will scroll to top.
   *
   * @param {boolean=} shouldAnimate Whether the scroll should animate.
   */
  'anchorScroll',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#getScrollView
   * @returns {object} The scrollView associated with this delegate.
   */
  'getScrollView',
  /**
   * @ngdoc method
   * @name $ionicScrollDelegate#$getByHandle
   * @param {string} handle
   * @returns `delegateInstance` A delegate instance that controls only the
   * scrollViews with `delegate-handle` matching the given handle.
   *
   * Example: `$ionicScrollDelegate.$getByHandle('my-handle').scrollTop();`
   */
   'getByHandle'
]));


/**
 * @ngdoc service
 * @name $ionicSideMenuDelegate
 * @module ionic
 *
 * @description
 * Delegate for controlling the {@link ionic.directive:ionSideMenus} directive.
 *
 * Methods called directly on the $ionicSideMenuDelegate service will control all side
 * menus.  Use the {@link ionic.service:$ionicSideMenuDelegate#$getByHandle $getByHandle}
 * method to control specific ionSideMenus instances.
 *
 * @usage
 *
 * ```html
 * <body ng-controller="MainCtrl">
 *   <ion-side-menus>
 *     <ion-side-menu-content>
 *       Content!
 *       <button ng-click="toggleLeftSideMenu()">
 *         Toggle Left Side Menu
 *       </button>
 *     </ion-side-menu-content>
 *     <ion-side-menu side="left">
 *       Left Menu!
 *     <ion-side-menu>
 *   </ion-side-menus>
 * </body>
 * ```
 * ```js
 * function MainCtrl($scope, $ionicSideMenuDelegate) {
 *   $scope.toggleLeftSideMenu = function() {
 *     $ionicSideMenuDelegate.toggleLeft();
 *   };
 * }
 * ```
 */
IonicModule
.service('$ionicSideMenuDelegate', delegateService([
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#toggleLeft
   * @description Toggle the left side menu (if it exists).
   * @param {boolean=} isOpen Whether to open or close the menu.
   * Default: Toggles the menu.
   */
  'toggleLeft',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#toggleRight
   * @description Toggle the right side menu (if it exists).
   * @param {boolean=} isOpen Whether to open or close the menu.
   * Default: Toggles the menu.
   */
  'toggleRight',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#getOpenRatio
   * @description Gets the ratio of open amount over menu width. For example, a
   * menu of width 100 that is opened by 50 pixels is 50% opened, and would return
   * a ratio of 0.5.
   *
   * @returns {float} 0 if nothing is open, between 0 and 1 if left menu is
   * opened/opening, and between 0 and -1 if right menu is opened/opening.
   */
  'getOpenRatio',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#isOpen
   * @returns {boolean} Whether either the left or right menu is currently opened.
   */
  'isOpen',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#isOpenLeft
   * @returns {boolean} Whether the left menu is currently opened.
   */
  'isOpenLeft',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#isOpenRight
   * @returns {boolean} Whether the right menu is currently opened.
   */
  'isOpenRight',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#canDragContent
   * @param {boolean=} canDrag Set whether the content can or cannot be dragged to open
   * side menus.
   * @returns {boolean} Whether the content can be dragged to open side menus.
   */
  'canDragContent',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#edgeDragThreshold
   * @param {boolean|number=} value Set whether the content drag can only start if it is below a certain threshold distance from the edge of the screen. Accepts three different values:
   *  - If a non-zero number is given, that many pixels is used as the maximum allowed distance from the edge that starts dragging the side menu.
   *  - If true is given, the default number of pixels (25) is used as the maximum allowed distance.
   *  - If false or 0 is given, the edge drag threshold is disabled, and dragging from anywhere on the content is allowed.
   * @returns {boolean} Whether the drag can start only from within the edge of screen threshold.
   */
  'edgeDragThreshold',
  /**
   * @ngdoc method
   * @name $ionicSideMenuDelegate#$getByHandle
   * @param {string} handle
   * @returns `delegateInstance` A delegate instance that controls only the
   * {@link ionic.directive:ionSideMenus} directives with `delegate-handle` matching
   * the given handle.
   *
   * Example: `$ionicSideMenuDelegate.$getByHandle('my-handle').toggleLeft();`
   */
]));


/**
 * @ngdoc service
 * @name $ionicSlideBoxDelegate
 * @module ionic
 * @description
 * Delegate that controls the {@link ionic.directive:ionSlideBox} directive.
 *
 * Methods called directly on the $ionicSlideBoxDelegate service will control all slide boxes.  Use the {@link ionic.service:$ionicSlideBoxDelegate#$getByHandle $getByHandle}
 * method to control specific slide box instances.
 *
 * @usage
 *
 * ```html
 * <body ng-controller="MyCtrl">
 *   <ion-slide-box>
 *     <ion-slide>
 *       <div class="box blue">
 *         <button ng-click="nextSlide()">Next slide!</button>
 *       </div>
 *     </ion-slide>
 *     <ion-slide>
 *       <div class="box red">
 *         Slide 2!
 *       </div>
 *     </ion-slide>
 *   </ion-slide-box>
 * </body>
 * ```
 * ```js
 * function MyCtrl($scope, $ionicSlideBoxDelegate) {
 *   $scope.nextSlide = function() {
 *     $ionicSlideBoxDelegate.select( $ionicSlideBoxDelegate.next() );
 *   }
 * }
 * ```
 */
IonicModule
.service('$ionicSlideBoxDelegate', delegateService([
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#select
   * @param {number} slideIndex The index to select.
   */
  'select',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#selected
   * @returns `slideIndex` The index of the currently selected slide.
   */
  'selected',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#loop
   * @description Sets/gets the looping state of the slidebox (whether going next from the last slide will go back to the first slide, and vice versa).
   * @param {boolean=} shouldLoop Set whether the slidebox should loop.
   * @returns `isLoop` Whether looping is currently enabled.
   */
 'loop',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#previous
   * @returns `slideIndex` The index of the previous slide. Wraps around if loop is enabled.
   */
  'previous',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#next
   * @returns `slideIndex` The index of the next slide. Wraps around if loop is enabled.
   */
  'next',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#autoPlay
   * @description Set whether the slidebox should automatically play, and at what rate.
   * @param {*} autoPlayInterval How many milliseconds delay until changing to the next slide.
   * Set to zero or false to stop autoPlay.
   */
  'autoPlay',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#enableSlide
   * @param {boolean=} shouldEnable Whether to enable sliding the slidebox.
   * @returns `boolean` Whether sliding is enabled.
   */
  'enableSlide',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#count
   * @returns `number` The number of slides there are currently.
   */
  'count',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#update
   * @description Causes the slidebox to re-scan all of the child slide
   * elements and reorganize itself again. This will rarely be needed.
   * You only need to call update if you are moving slides around in the DOM
   * (for example, ng-repeat moving an element from the middle to the end of
   * the list).
   */
  'update',
  /**
   * @ngdoc method
   * @name $ionicSlideBoxDelegate#$getByHandle
   * @param {string} handle
   * @returns `delegateInstance` A delegate instance that controls only the
   * {@link ionic.directive:ionSlideBox} directives with `delegate-handle` matching
   * the given handle.
   *
   * Example: `$ionicSlideBoxDelegate.$getByHandle('my-handle').select(0);`
   */
]));


/**
 * @ngdoc service
 * @name $ionicTabsDelegate
 * @module ionic
 *
 * @description
 * Delegate for controlling the {@link ionic.directive:ionTabs} directive.
 *
 * Methods called directly on the $ionicTabsDelegate service will control all ionTabs
 * directives. Use the {@link ionic.service:$ionicTabsDelegate#$getByHandle $getByHandle}
 * method to control specific ionTabs instances.
 *
 * @usage
 *
 * ```html
 * <body ng-controller="MyCtrl">
 *   <ion-tabs>
 *
 *     <ion-tab title="Tab 1">
 *       Hello tab 1!
 *       <button ng-click="selectTabWithIndex(1)">Select tab 2!</button>
 *     </ion-tab>
 *     <ion-tab title="Tab 2">Hello tab 2!</ion-tab>
 *
 *   </ion-tabs>
 * </body>
 * ```
 * ```js
 * function MyCtrl($scope, $ionicTabsDelegate) {
 *   $scope.selectTabWithIndex = function(index) {
 *     $ionicTabsDelegate.select(index);
 *   }
 * }
 * ```
 */
IonicModule
.service('$ionicTabsDelegate', delegateService([
  /**
   * @ngdoc method
   * @name $ionicTabsDelegate#select
   * @description Select the tab matching the given index.
   *
   * @param {number} index Index of the tab to select.
   */
  'select',
  /**
   * @ngdoc method
   * @name $ionicTabsDelegate#selectedIndex
   * @returns `number` The index of the selected tab, or -1.
   */
  'selectedIndex'
  /**
   * @ngdoc method
   * @name $ionicTabsDelegate#$getByHandle
   * @param {string} handle
   * @returns `delegateInstance` A delegate instance that controls only the
   * {@link ionic.directive:ionTabs} directives with `delegate-handle` matching
   * the given handle.
   *
   * Example: `$ionicTabsDelegate.$getByHandle('my-handle').select(0);`
   */
]));


// closure to keep things neat
(function() {
  var templatesToCache = [];

/**
 * @ngdoc service
 * @name $ionicTemplateCache
 * @module ionic
 * @description A service that preemptively caches template files to eliminate transition flicker and boost performance.
 * @usage
 * State templates are cached automatically, but you can optionally cache other templates.
 *
 * ```js
 * $ionicTemplateCache('myNgIncludeTemplate.html');
 * ```
 *
 * Optionally disable all preemptive caching with the `$ionicConfigProvider` or individual states by setting `prefetchTemplate`
 * in the `$state` definition
 *
 * ```js
 *   angular.module('myApp', ['ionic'])
 *   .config(function($stateProvider, $ionicConfigProvider) {
 *
 *     // disable preemptive template caching globally
 *     $ionicConfigProvider.templates.prefetch(false);
 *
 *     // disable individual states
 *     $stateProvider
 *       .state('tabs', {
 *         url: "/tab",
 *         abstract: true,
 *         prefetchTemplate: false,
 *         templateUrl: "tabs-templates/tabs.html"
 *       })
 *       .state('tabs.home', {
 *         url: "/home",
 *         views: {
 *           'home-tab': {
 *             prefetchTemplate: false,
 *             templateUrl: "tabs-templates/home.html",
 *             controller: 'HomeTabCtrl'
 *           }
 *         }
 *       });
 *   });
 * ```
 */
IonicModule
.factory('$ionicTemplateCache', [
'$http',
'$templateCache',
'$timeout',
'$ionicConfig',
function($http, $templateCache, $timeout, $ionicConfig) {
  var toCache = templatesToCache,
      hasRun = false;

  function $ionicTemplateCache(templates){
    if(toCache.length > 500) return false;
    if(typeof templates === 'undefined')return run();
    if(isString(templates))templates = [templates];
    forEach(templates, function(template){
      toCache.push(template);
    });
    // is this is being called after the initial IonicModule.run()
    if(hasRun) run();
  }

  // run through methods - internal method
  var run = function(){
    if($ionicConfig.templates.prefetch() === false)return;
    //console.log('prefetching', toCache);
    //for testing
    $ionicTemplateCache._runCount++;

    hasRun = true;
    // ignore if race condition already zeroed out array
    if(toCache.length === 0)return;
    //console.log(toCache);
    var i = 0;
    while ( i < 5 && (template = toCache.pop()) ) {
      // note that inline templates are ignored by this request
      if (isString(template)) $http.get(template, { cache: $templateCache });
      i++;
    }
    // only preload 5 templates a second
    if(toCache.length)$timeout(function(){run();}, 1000);
  };

  // exposing for testing
  $ionicTemplateCache._runCount = 0;
  // default method
  return $ionicTemplateCache;
}])

// Intercepts the $stateprovider.state() command to look for templateUrls that can be cached
.config([
'$stateProvider',
'$ionicConfigProvider',
function($stateProvider, $ionicConfigProvider) {
  var stateProviderState = $stateProvider.state;
  $stateProvider.state = function(stateName, definition) {
    // don't even bother if it's disabled. note, another config may run after this, so it's not a catch-all
    if(typeof definition === 'object' && $ionicConfigProvider.templates.prefetch() !== false){
      var enabled = definition.prefetchTemplate !== false;
      if(enabled && isString(definition.templateUrl))templatesToCache.push(definition.templateUrl);
      if(angular.isObject(definition.views)){
        for (var key in definition.views){
          enabled = definition.views[key].prefetchTemplate !== false;
          if(enabled && isString(definition.views[key].templateUrl)) templatesToCache.push(definition.views[key].templateUrl);
        }
      }
    }
    return stateProviderState.call($stateProvider, stateName, definition);
  };
}])

// process the templateUrls collected by the $stateProvider, adding them to the cache
.run([
'$ionicTemplateCache',
function($ionicTemplateCache) {
  $ionicTemplateCache();
}]);

})();

IonicModule
.factory('$ionicTemplateLoader', [
  '$compile',
  '$controller',
  '$http',
  '$q',
  '$rootScope',
  '$templateCache',
function($compile, $controller, $http, $q, $rootScope, $templateCache) {

  return {
    load: fetchTemplate,
    compile: loadAndCompile
  };

  function fetchTemplate(url) {
    return $http.get(url, {cache: $templateCache})
    .then(function(response) {
      return response.data && response.data.trim();
    });
  }

  function loadAndCompile(options) {
    options = extend({
      template: '',
      templateUrl: '',
      scope: null,
      controller: null,
      locals: {},
      appendTo: null
    }, options || {});

    var templatePromise = options.templateUrl ?
      this.load(options.templateUrl) :
      $q.when(options.template);

    return templatePromise.then(function(template) {
      var controller;
      var scope = options.scope || $rootScope.$new();

      //Incase template doesn't have just one root element, do this
      var element = jqLite('<div>').html(template).contents();

      if (options.controller) {
        controller = $controller(
          options.controller,
          extend(options.locals, {
            $scope: scope
          })
        );
        element.children().data('$ngControllerController', controller);
      }
      if (options.appendTo) {
        jqLite(options.appendTo).append(element);
      }

      $compile(element)(scope);

      return {
        element: element,
        scope: scope
      };
    });
  }

}]);

/**
 * @private
 * TODO document
 */

IonicModule
.factory('$ionicViewSwitcher',[
  '$timeout',
  '$compile',
  '$controller',
  '$animate',
  '$ionicClickBlock',
  '$ionicConfig',
function($timeout, $compile, $controller, $animate, $ionicClickBlock, $ionicConfig) {

  // data keys for jqLite elements
  var DATA_NO_CACHE = '$ionicNoCache';
  var DATA_ELE_IDENTIFIER = '$ionicEleId';
  var DATA_VIEW_ACCESSED = '$ionicAccessed';

  var transitionCounter = 0;
  var nextTransition;
  var nextDirection;
  ionic.transition = ionic.transition || {};
  ionic.transition.isActive = false;
  var isActiveTimer;


  function createViewElement(viewLocals) {
    var div = jqLite('<div>');
    if (viewLocals && viewLocals.$template) {
      div.html(viewLocals.$template);
      var nodes = div.contents();
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].nodeType == 1) {
          // first try to get just a child element
          return nodes.eq(i);
        }
      }
    }
    // fallback to return the div so it has one parent element
    return div;
  }

  function getViewElementIdentifier(locals, view) {
    if ( viewState(locals).abstract ) return viewState(locals).name;
    if ( view ) return view.stateId || view.viewId;
    return ionic.Utils.nextUid();
  }

  function viewState(locals) {
    return locals && locals.$$state && locals.$$state.self || {};
  }

  function getTransitionData(viewLocals, enteringEle, direction, enteringView, showBack) {
    // Priority
    // 1) attribute directive
    // 2) entering element's attribute
    // 3) entering view's $state config property
    // 4) view registration data
    // 5) global config
    // 6) fallback value

    var state = viewState(viewLocals);
    enteringView = enteringView || {};

    return {
      transition: nextTransition || enteringEle && enteringEle.attr('view-transition') || state.viewTransition || $ionicConfig.views.transition(),
      direction: nextDirection || enteringEle && enteringEle.attr('view-direction') || state.viewDirection || direction || 'none',
      viewId: enteringView.viewId,
      stateId: enteringView.stateId,
      stateName: enteringView.stateName,
      stateParams: enteringView.stateParams,
      showBack: !!showBack
    };
  }


  var ionicViewSwitcher = {

    create: function(navViewScope, navViewElement, viewLocals, enteringView) {
      // get a reference to an entering/leaving element if they exist
      // loop through to see if the view is already in the navViewElement
      var enteringEle, leavingEle;
      var transitionId = ++transitionCounter;
      var alreadyInDom;

      var switcher = {

        init: function(callback) {
          ionicViewSwitcher.isActive(true);

          $ionicClickBlock.show();
          switcher.loadViewElements();

          switcher.render(function(){
            callback && callback();
          });
        },

        loadViewElements: function() {
          var viewEle, viewElements = navViewElement.children();
          var enteringEleIdentifier = getViewElementIdentifier(viewLocals, enteringView);

          for(var x=0, l=viewElements.length; x<l; x++) {
            viewEle = viewElements.eq(x);

            if (enteringEleIdentifier && viewEle.data(DATA_ELE_IDENTIFIER) == enteringEleIdentifier) {
              // we found an existing element in the DOM that should be entering the view
              enteringEle = viewEle;

            } else if (viewEle.hasClass('nav-view-entering')) {
              // there's already an element that's entering!! Cancel that this one would be the active one
              viewEle.addClass('nav-view-entering-cancelled');

            } else if (viewEle.hasClass('nav-view-active')) {
              // this element is currently the active one, so it will be the leaving element
              leavingEle = viewEle;
            }
          }

          alreadyInDom = !!enteringEle;

          if (!alreadyInDom) {
            // still no existing element to use
            // create it using existing template/scope/locals
            enteringEle = createViewElement(viewLocals);

            enteringEle.addClass('nav-view-entering');

            // existing elements in the DOM are looked up by their state name and state id
            enteringEle.data(DATA_ELE_IDENTIFIER, enteringEleIdentifier);

            // add the DATA_NO_CACHE data
            // if the current state has cache:false
            // or the element has cache-view="false" attribute
            if ( viewState(viewLocals).cache === false || enteringEle.attr('cache-view') == 'false' ) {
              enteringEle.data(DATA_NO_CACHE, true);
            }
          }
        },

        render: function(callback) {
          if ( alreadyInDom ) {
            // it was already found in the dom, just reconnect the scope
            ionic.Utils.reconnectScope( enteringEle.scope() );

          } else {
            // the entering element is not already in the DOM
            // hasn't been compiled and isn't linked up yet

            // compile the entering element and get the link function
            var link = $compile(enteringEle);

            // append the entering element to the DOM
            navViewElement.append(enteringEle);

            // create a new scope for the entering element
            var scope = navViewScope.$new();

            // if it's got a controller then spin it all up
            if (viewLocals.$$controller) {
              viewLocals.$scope = scope;
              var controller = $controller(viewLocals.$$controller, viewLocals);
              navViewElement.children().data('$ngControllerController', controller);
            }

            // run link with the view's scope
            link(scope);
          }

          // update that this view was just accessed
          enteringEle.data(DATA_VIEW_ACCESSED, Date.now());

          if( $animate.useAnimation() ) {
            $timeout(callback, 10);
          } else {
            callback();
          }

        },

        transition: function(direction, showBack) {
          var transData = getTransitionData(viewLocals, enteringEle, direction, enteringView, showBack);

          switcher.notify('before', transData);

          $animate.transition( 'nav-view', transData.transition, transData.direction, enteringEle, leavingEle).then(function(){

            if (transitionId === transitionCounter) {
              switcher.notify('after', transData);

              switcher.cleanup(transData);

              ionicViewSwitcher.isActive(false);

              $ionicClickBlock.hide();
            }

            // clean up any references that could cause memory issues
            nextTransition = nextDirection = enteringView = enteringEle = leavingEle = null;
          });

        },

        notify: function(step, transData) {
          var scope = enteringEle.scope();
          if (scope) {
            scope.$emit('$ionicView.' + step + 'Enter', transData);
          }

          scope = leavingEle && leavingEle.scope();
          if (scope) {
            scope.$emit('$ionicView.' + step + 'Leaving', transData);
          }
        },

        cleanup: function(transData) {
          var viewElements = navViewElement.children();
          var viewElementsLength = viewElements.length;
          var x, viewElement, removableEle;
          var activeStateId = enteringEle.data(DATA_ELE_IDENTIFIER);

          // check if any views should be removed
          if ( transData.direction == 'back' && !$ionicConfig.views.forwardCache() && leavingEle ) {
            // if they just navigated back we can destroy the forward view
            // do not remove forward views if cacheForwardViews config is true
            removableEle = leavingEle;

          } else if ( leavingEle && leavingEle.data(DATA_NO_CACHE) ) {
            // remove if the leaving element has DATA_NO_CACHE===false
            removableEle = leavingEle;

          } else if ( (viewElementsLength - 1) > $ionicConfig.views.maxCache() ) {
            // check to see if we have more cached views than we should
            // the total number of child elements has exceeded how many to keep in the DOM
            var oldestAccess = Date.now();

            for(x=0; x<viewElementsLength; x++) {
              viewElement = viewElements.eq(x);

              if ( viewElement.data(DATA_VIEW_ACCESSED) < oldestAccess ) {
                // remove the element that was the oldest to be accessed
                oldestAccess = viewElement.data(DATA_VIEW_ACCESSED);
                removableEle = viewElements.eq(x);
              }
            }
          }

          if (removableEle) {
            // we found an element that should be removed
            // destroy its scope, then remove the element
            removableEle.scope().$destroy();
            removableEle.remove();
          }

          ionic.Utils.disconnectScope( leavingEle && leavingEle.scope() );
        },

        enteringEle: function(){ return enteringEle; },
        leavingEle: function(){ return leavingEle; }

      };

      return switcher;
    },

    nextTransition: function(val) {
      nextTransition = val;
    },

    nextDirection: function(val) {
      nextDirection = val;
    },

    getTransitionData: getTransitionData,

    isActive: function(val) {
      if (arguments.length) {
        ionic.transition.isActive = !!val;
        $timeout.cancel(isActiveTimer);
        if (val) {
          isActiveTimer = $timeout(function(){
            ionicViewSwitcher.isActive(false);
          }, 999);
        }
      }
      return ionic.transition.isActive;
    }

  };

  return ionicViewSwitcher;

}]);

/**
 * @private
 */
IonicModule.config([
  '$provide',
function($provide) {
  function $AnimateDecorator($animate, $q, $timeout) {

    var CSS_DIRECTIONS = 'nav-forward nav-back nav-enter nav-exit nav-swap'.split(' ');
    var NG_ANIMATE_PARENT_KEY = '$$ngAnimateKey';

    var usedTransitions = [];
    var useAnimation = true;


    $animate.transition = function(animation, transition, direction, enteringElement, leavingElement) {
      var deferred = $q.defer();
      var parentElement = enteringElement.parent();
      var shouldAnimate = $animate.shouldAnimate(transition, direction);

      $animate.stage(shouldAnimate, animation, transition, direction, parentElement, enteringElement, leavingElement, function(){

        $animate.start(shouldAnimate, animation, transition, direction, enteringElement, leavingElement).then(function(){

          $animate.end(animation, transition, direction, parentElement, enteringElement, leavingElement).then(function(){
            deferred.resolve();
          });

        });

      });

      return deferred.promise;
    };


    $animate.shouldAnimate = function(transition, direction) {
      return !!(useAnimation && direction && direction !== 'none' && transition && transition !== 'none');
    };


    $animate.stage = function(shouldAnimate, animation, transition, direction, parentElement, enteringElement, leavingElement, callback) {

      var x, isExisitingTransition;

      for (x=0; x<usedTransitions.length; x++) {
        if (usedTransitions[x] === transition && shouldAnimate) {
          isExisitingTransition = true;
        } else {
          parentElement.removeClass( usedTransitions[x] );
        }
      }

      for (x=0; x<CSS_DIRECTIONS.length; x++) {
        if (CSS_DIRECTIONS[x] !== direction) {
          parentElement.removeClass( CSS_DIRECTIONS[x] );
        }
      }

      if ( shouldAnimate ) {
        if (!isExisitingTransition) {
          usedTransitions.push(transition);
        }

        parentElement.addClass(transition)
                     .addClass('nav-' + direction);

        // classes can change on the parent, so make sure the parent ID uses the classname
        // and not the default parent counter within $animate
        var classParentID = extractElementNode(parentElement).getAttribute('class');
        var parentID = parentElement.data(NG_ANIMATE_PARENT_KEY);
        if (parentID !== classParentID) {
          parentElement.data(NG_ANIMATE_PARENT_KEY, classParentID);
        }
      }

      // ensure
      enteringElement.addClass(animation + '-entering')
                     .removeClass(animation + '-cache')
                     .removeClass(animation);

      if (leavingElement) {
          leavingElement.addClass(animation + '-leaving')
                        .removeClass(animation + '-cache')
                        .addClass(animation);

        if ( shouldAnimate ) {
          leavingElement.addClass('ng-animate');
        }
      }

      $timeout(callback, 12);
    };


    $animate.start = function(shouldAnimate, animation, transition, direction, enteringElement, leavingElement) {
      var enteringDeferred = $q.defer();
      var leavingDeferred = $q.defer();

      if (enteringElement && shouldAnimate) {
        $animate.addClass(enteringElement, animation).then(function(){
          enteringDeferred.resolve();
        });
      } else {
        enteringDeferred.resolve();
      }

      if (leavingElement && shouldAnimate) {
        $animate.removeClass(leavingElement, animation).then(function(){
          leavingDeferred.resolve();
        });
      } else {
        leavingDeferred.resolve();
      }

      return $q.all([enteringDeferred.promise, leavingDeferred.promise]);
    };


    $animate.end = function(animation, transition, direction, parentElement, enteringElement, leavingElement, callback) {
      var deferred = $q.defer();

      ionic.requestAnimationFrame(function(){
        var enteringCancelled = false;
        var leavingElements = [];
        var x;

        if (enteringElement) {
          if (enteringElement.hasClass(animation + '-entering-cancelled')) {
            leavingElements.push(enteringElement);
            enteringCancelled = true;

          } else {
            enteringElement.addClass(animation + '-active')
                           .removeClass(animation + '-cache')
                           .removeClass(animation + '-entering')
                           .removeClass(animation + '-leaving')
                           .removeClass(animation + '-entering-cancelled')
                           .addClass(animation);
          }
        }

        leavingElement && leavingElements.push(leavingElement);
        for (x=0; x<leavingElements.length; x++) {
          leavingElements[x].addClass(animation + '-cache')
                            .removeClass(animation + '-active')
                            .removeClass(animation + '-entering')
                            .removeClass(animation + '-leaving')
                            .removeClass(animation)
                            .removeClass(animation + '-entering-cancelled');

        }
        leavingElements = null;

        if (!enteringCancelled) {
          parentElement.removeClass(animation);

          for (x=0; x<CSS_DIRECTIONS.length; x++) {
            parentElement.removeClass(CSS_DIRECTIONS[x]);
          }
        }

        deferred.resolve();

      });

      return deferred.promise;
    };


    $animate.useAnimation = function(val) {
      if (arguments.length) {
        useAnimation = val;
      }
      return useAnimation;
    };


    function extractElementNode(element) {
      for (var i = 0; i < element.length; i++) {
        var elm = element[i];
        if (elm.nodeType == 1) return elm;
      }
    }


    return $animate;
  }

  $provide.decorator('$animate', ['$delegate', '$q', '$timeout', $AnimateDecorator]);
}]);

/**
 * @private
 */
IonicModule.config([
  '$provide',
function($provide) {
  function $LocationDecorator($location, $timeout) {

    $location.__hash = $location.hash;
    //Fix: when window.location.hash is set, the scrollable area
    //found nearest to body's scrollTop is set to scroll to an element
    //with that ID.
    $location.hash = function(value) {
      if (angular.isDefined(value)) {
        $timeout(function() {
          var scroll = document.querySelector('.scroll-content');
          if (scroll)
            scroll.scrollTop = 0;
        }, 0, false);
      }
      return $location.__hash(value);
    };

    return $location;
  }

  $provide.decorator('$location', ['$delegate', '$timeout', $LocationDecorator]);
}]);

IonicModule

.controller('$ionHeaderBar', [
  '$scope',
  '$element',
  '$attrs',
  '$animate',
  '$q',
  '$ionicConfig',
  '$ionicHistory',
function($scope, $element, $attrs, $animate, $q, $ionicConfig, $ionicHistory) {
  var TITLE = 'title';
  var BACK_TEXT = 'back-text';
  var BACK_BUTTON = 'back-button';
  var DEFAULT_TITLE = 'default-title';
  var PREVIOUS_TITLE = 'previous-title';
  var HIDE = 'hide';

  var self = this;
  var titleText = '';
  var previousTitleText = '';
  var titleLeft = 0;
  var titleRight = 0;
  var titleCss = '';
  var isBackShown;
  var titleTextWidth = 0;


  self.title = function(newTitleText) {
    if (arguments.length && newTitleText !== titleText) {
      getEle(TITLE).innerHTML = newTitleText;
      titleText = newTitleText;
      titleTextWidth = 0;
    }
    return titleText;
  };


  self.showBack = function(shouldShow) {
    if (arguments.length && shouldShow !== isBackShown) {
      var backBtnEle = getEle(BACK_BUTTON);
      if (backBtnEle) {
        backBtnEle.classList[ shouldShow ? 'remove' : 'add' ](HIDE);
        isBackShown = shouldShow;
      }
    }
    return isBackShown;
  };


  self.titleTextWidth = function() {
    if (!titleTextWidth) {
      var bounds = ionic.DomUtil.getTextBounds( getEle(TITLE) );
      titleTextWidth = Math.min(bounds && bounds.width || 30);
    }
    return titleTextWidth;
  };


  self.titleWidth = function() {
    var titleWidth = self.titleTextWidth();
    var offsetWidth = getEle(TITLE).offsetWidth;
    if (offsetWidth < titleWidth) {
      titleWidth = offsetWidth + (titleLeft - titleRight - 5);
    }
    return titleWidth;
  };


  self.titleTextX = function() {
    return ($element[0].offsetWidth / 2) - (self.titleWidth() / 2);
  };


  self.titleLeftRight = function() {
    return titleLeft - titleRight;
  };


  self.backButtonTextLeft = function() {
    var offsetLeft = 0;
    var ele = getEle(BACK_TEXT);
    while(ele) {
      offsetLeft += ele.offsetLeft;
      ele = ele.parentElement;
    }
    return offsetLeft;
  };


  self.stage = function(val) {
    $element[0].classList[ val ? 'add' : 'remove' ]('nav-bar-stage');
  };


  self.noTransition = function(val) {
    $element[0].classList[ val ? 'add' : 'remove' ]('nav-bar-no-transition');
  };


  self.resetBackButton = function() {
    if ( $ionicConfig.backButton.previousTitleText() ) {
      var previousTitleEle = getEle(PREVIOUS_TITLE);
      if (previousTitleEle) {
        previousTitleEle.classList.remove(HIDE);

        var newPreviousTitleText = $ionicHistory.backTitle();

        if (newPreviousTitleText !== previousTitleText) {
          previousTitleText = previousTitleEle.innerHTML = newPreviousTitleText;
        }
      }
      var defaultTitleEle = getEle(DEFAULT_TITLE);
      if (defaultTitleEle) {
        defaultTitleEle.classList.remove(HIDE);
      }
    }
  };


  self.alignTitle = function(align) {
    var titleEle = getEle(TITLE);

    align = align || $attrs.alignTitle || $ionicConfig.navBar.alignTitle();

    var widths = self.calcWidths(align, false);

    if ( isBackShown && previousTitleText && $ionicConfig.backButton.previousTitleText() ) {
      var previousTitleWidths = self.calcWidths(align, true);

      var availableTitleWidth = $element[0].offsetWidth - previousTitleWidths.titleLeft - previousTitleWidths.titleRight;

      if (self.titleTextWidth() <= availableTitleWidth) {
        widths = previousTitleWidths;
      }
    }

    return self.updatePositions(titleEle, widths.titleLeft, widths.titleRight, widths.buttonsRight, widths.css, widths.showPrevTitle);
  };


  self.calcWidths = function(align, isPreviousTitle) {
    var titleEle = getEle(TITLE);
    var backBtnEle = getEle(BACK_BUTTON);
    var x, y, z, b, c, d, childSize, bounds;
    var childNodes = $element[0].childNodes;
    var buttonsLeft = 0;
    var buttonsRight = 0;
    var isCountRightOfTitle;
    var updateTitleLeft = 0;
    var updateTitleRight = 0;
    var updateCss = '';
    var backButtonWidth = 0;

    // Compute how wide the left children are
    // Skip all titles (there may still be two titles, one leaving the dom)
    // Once we encounter a titleEle, realize we are now counting the right-buttons, not left
    for (x = 0; x < childNodes.length; x++) {
      c = childNodes[x];

      childSize = 0;
      if (c.nodeType == 1) {
        // element node
        if (c === titleEle) {
          isCountRightOfTitle = true;
          continue;
        }

        if (c.classList.contains(HIDE)) {
          continue;
        }

        if (isBackShown && c === backBtnEle) {

          for (y = 0; y < c.children.length; y++) {
            b = c.children[y];

            if (b.classList.contains(BACK_TEXT)) {
              for (z = 0; z < b.children.length; z++) {
                d = b.children[z];

                if (isPreviousTitle) {
                  if ( d.classList.contains(DEFAULT_TITLE) ) continue;
                  backButtonWidth += d.offsetWidth;
                } else {
                  if ( d.classList.contains(PREVIOUS_TITLE) ) continue;
                  backButtonWidth += d.offsetWidth;
                }
              }

            } else {
              backButtonWidth += b.offsetWidth;
            }

          }
          childSize = backButtonWidth;

        } else {
          // not the title, not the back button, not a hidden element
          childSize = c.offsetWidth;
        }

      } else if (c.nodeType == 3 && c.nodeValue.trim()) {
        // text node
        bounds = ionic.DomUtil.getTextBounds(c);
        childSize = bounds && bounds.width || 0;
      }

      if (isCountRightOfTitle) {
        buttonsRight += childSize;
      } else {
        buttonsLeft += childSize;
      }
    }

    // Size and align the header titleEle based on the sizes of the left and
    // right children, and the desired alignment mode
    if (align == 'left') {
      updateCss = 'title-left';
      if (buttonsLeft) {
        updateTitleLeft = buttonsLeft + 15;
      }
      updateTitleRight = buttonsRight + 15;

    } else if (align == 'right') {
      updateCss = 'title-right';
      if (buttonsRight) {
        updateTitleRight = buttonsRight + 15;
      }
      updateTitleLeft = buttonsLeft + 15;

    } else {
      // center the default
      var margin = Math.max(buttonsLeft, buttonsRight) + 10;
      if (margin > 10) {
        updateTitleLeft = updateTitleRight = margin;
      }
    }

    return {
      backButtonWidth: backButtonWidth,
      buttonsLeft: buttonsLeft,
      buttonsRight: buttonsRight,
      titleLeft: updateTitleLeft,
      titleRight: updateTitleRight,
      showPrevTitle: isPreviousTitle,
      css: updateCss
    };
  };


  self.updatePositions = function(titleEle, updateTitleLeft, updateTitleRight, buttonsRight, updateCss, showPreviousTitle) {
    var deferred = $q.defer();

    // only make DOM updates when there are actual changes
    if (updateTitleLeft !== titleLeft) {
      titleEle.style.left = updateTitleLeft ? updateTitleLeft + 'px' : '';
      titleLeft = updateTitleLeft;
    }
    if (updateTitleRight !== titleRight) {
      titleEle.style.right = updateTitleRight ? updateTitleRight + 'px' : '';
      titleRight = updateTitleRight;
    }

    if (updateCss !== titleCss) {
      updateCss && titleEle.classList.add(updateCss);
      titleCss && titleEle.classList.remove(titleCss);
      titleCss = updateCss;
    }

    if ($ionicConfig.backButton.previousTitleText()) {
      var prevTitle = getEle(PREVIOUS_TITLE);
      var defaultTitle = getEle(DEFAULT_TITLE);

      prevTitle && prevTitle.classList[ showPreviousTitle ? 'remove' : 'add'](HIDE);
      defaultTitle && defaultTitle.classList[ showPreviousTitle ? 'add' : 'remove'](HIDE);
    }

    ionic.requestAnimationFrame(function(){
      if (titleEle.offsetWidth < titleEle.scrollWidth) {
        titleRight = buttonsRight + 5;
        titleEle.style.right = titleRight ? titleRight + 'px' : '';
      }
      deferred.resolve();
    });

    return deferred.promise;
  };


  self.setCss = function(elementClassname, css) {
    var ele = getEle(elementClassname);
    if (ele) {
      for (var prop in css) {
        ele.style[prop] = css[prop];
      }
    }
  };


  var eleCache = {};
  function getEle(className) {
    if (!eleCache[className]) {
      eleCache[className] = $element[0].querySelector('.' + className);
    }
    return eleCache[className];
  }


  $scope.$on('$destroy', function() {
    for(var n in eleCache) eleCache[n] = null;
  });

}]);



/**
 * @ngdoc service
 * @name $ionicListDelegate
 * @module ionic
 *
 * @description
 * Delegate for controlling the {@link ionic.directive:ionList} directive.
 *
 * Methods called directly on the $ionicListDelegate service will control all lists.
 * Use the {@link ionic.service:$ionicListDelegate#$getByHandle $getByHandle}
 * method to control specific ionList instances.
 *
 * @usage
 *
 * ````html
 * <ion-content ng-controller="MyCtrl">
 *   <button class="button" ng-click="showDeleteButtons()"></button>
 *   <ion-list>
 *     <ion-item ng-repeat="i in items">
 *       {% raw %}Hello, {{i}}!{% endraw %}
 *       <ion-delete-button class="ion-minus-circled"></ion-delete-button>
 *     </ion-item>
 *   </ion-list>
 * </ion-content>
 * ```
 * ```js
 * function MyCtrl($scope, $ionicListDelegate) {
 *   $scope.showDeleteButtons = function() {
 *     $ionicListDelegate.showDelete(true);
 *   };
 * }
 * ```
 */
IonicModule
.service('$ionicListDelegate', delegateService([
  /**
   * @ngdoc method
   * @name $ionicListDelegate#showReorder
   * @param {boolean=} showReorder Set whether or not this list is showing its reorder buttons.
   * @returns {boolean} Whether the reorder buttons are shown.
   */
  'showReorder',
  /**
   * @ngdoc method
   * @name $ionicListDelegate#showDelete
   * @param {boolean=} showDelete Set whether or not this list is showing its delete buttons.
   * @returns {boolean} Whether the delete buttons are shown.
   */
  'showDelete',
  /**
   * @ngdoc method
   * @name $ionicListDelegate#canSwipeItems
   * @param {boolean=} canSwipeItems Set whether or not this list is able to swipe to show
   * option buttons.
   * @returns {boolean} Whether the list is able to swipe to show option buttons.
   */
  'canSwipeItems',
  /**
   * @ngdoc method
   * @name $ionicListDelegate#closeOptionButtons
   * @description Closes any option buttons on the list that are swiped open.
   */
  'closeOptionButtons',
  /**
   * @ngdoc method
   * @name $ionicListDelegate#$getByHandle
   * @param {string} handle
   * @returns `delegateInstance` A delegate instance that controls only the
   * {@link ionic.directive:ionList} directives with `delegate-handle` matching
   * the given handle.
   *
   * Example: `$ionicListDelegate.$getByHandle('my-handle').showReorder(true);`
   */
]))

.controller('$ionicList', [
  '$scope',
  '$attrs',
  '$parse',
  '$ionicListDelegate',
function($scope, $attrs, $parse, $ionicListDelegate) {

  var isSwipeable = true;
  var isReorderShown = false;
  var isDeleteShown = false;

  var deregisterInstance = $ionicListDelegate._registerInstance(this, $attrs.delegateHandle);
  $scope.$on('$destroy', deregisterInstance);

  this.showReorder = function(show) {
    if (arguments.length) {
      isReorderShown = !!show;
    }
    return isReorderShown;
  };

  this.showDelete = function(show) {
    if (arguments.length) {
      isDeleteShown = !!show;
    }
    return isDeleteShown;
  };

  this.canSwipeItems = function(can) {
    if (arguments.length) {
      isSwipeable = !!can;
    }
    return isSwipeable;
  };

  this.closeOptionButtons = function() {
    this.listView && this.listView.clearDragEffects();
  };
}]);

IonicModule

.controller('$ionNavBar', [
  '$scope',
  '$element',
  '$attrs',
  '$compile',
  '$animate',
  '$timeout',
  '$ionicHistory',
  '$ionicNavBarDelegate',
  '$ionicConfig',
function($scope, $element, $attrs, $compile, $animate, $timeout, $ionicHistory, $ionicNavBarDelegate, $ionicConfig) {

  var CSS_HIDE = 'hide';
  var DATA_NAV_BAR_CTRL = '$ionNavBarController';
  var PRIMARY_BUTTONS = 'primaryButtons';
  var SECONDARY_BUTTONS = 'secondaryButtons';
  var BACK_BUTTON = 'backButton';

  var self = this;
  var headerBars = [];
  var navElementHtml = {};
  var titleText = '';
  var previousTitleText;
  var isVisible = true;
  var navBarConfig = $ionicConfig.navBar;

  $element.parent().data(DATA_NAV_BAR_CTRL, self);

  var deregisterInstance = $ionicNavBarDelegate._registerInstance(this, $attrs.delegateHandle);


  self.init = function() {
    // create two nav bar blocks which will trade out which one is shown
    self.createHeaderBar(false);
    self.createHeaderBar(true);
  };


  self.createHeaderBar = function(isActive, navBarClass) {
    var containerEle = jqLite( '<div class="nav-bar-block">' );
    if (isActive) {
      containerEle.addClass('nav-bar-block-active');
    }
    var headerBarEle = jqLite( '<ion-header-bar>' ).addClass($attrs.class);
    var titleEle = jqLite('<div class="title">');
    var navEle = {};
    var lastViewBtnsEle = {};
    var leftButtonsEle, rightButtonsEle;

    //navEle[BACK_BUTTON] = self.createBackButtonElement(headerBarEle);
    navEle[BACK_BUTTON] = createNavElement(BACK_BUTTON);
    navEle[BACK_BUTTON] && headerBarEle.append(navEle[BACK_BUTTON]);

    // append title in the header, this is the rock to where buttons append
    headerBarEle.append(titleEle);

    // create default button elements
    navEle[PRIMARY_BUTTONS] = createNavElement(PRIMARY_BUTTONS);
    navEle[SECONDARY_BUTTONS] = createNavElement(SECONDARY_BUTTONS);

    // append and position buttons
    positionButtons(navEle[PRIMARY_BUTTONS], PRIMARY_BUTTONS, true && !isActive);
    positionButtons(navEle[SECONDARY_BUTTONS], SECONDARY_BUTTONS, true && !isActive);

    // compile header and append to the DOM
    containerEle.append(headerBarEle);
    $element.append( $compile(containerEle)($scope.$new()) );

    var headerBarCtrl = headerBarEle.data('$ionHeaderBarController');

    var headerBarInstance = {
      isActive: isActive,
      showBack: function(shouldShow) {
        headerBarCtrl.showBack(shouldShow);
      },
      title: function(newTitleText) {
        headerBarCtrl.title(newTitleText);
      },
      setButtons: function(viewBtnsEle, side) {
        // first make sure any exiting view buttons have been removed
        headerBarInstance.removeButtons(side);

        if (viewBtnsEle) {
          // there's a view button for this side
          positionButtons(viewBtnsEle, side);

          // make sure the default button on this side is hidden
          if (navEle[side]) {
            navEle[side].addClass(CSS_HIDE);
          }
          lastViewBtnsEle[side] = viewBtnsEle;

        } else if (navEle[side]) {
          // there's a default button for this side and no view button
          navEle[side].removeClass(CSS_HIDE);
        }
      },
      removeButtons: function(side) {
        if (lastViewBtnsEle[side]) {
          lastViewBtnsEle[side].scope().$destroy();
          lastViewBtnsEle[side].remove();
          lastViewBtnsEle[side] = null;
        }
      },
      containerEle: function() {
        return containerEle;
      },
      headerBarEle: function() {
        return headerBarEle;
      },
      afterLeave: function() {
        headerBarInstance.removeButtons(PRIMARY_BUTTONS);
        headerBarInstance.removeButtons(SECONDARY_BUTTONS);
        headerBarCtrl.resetBackButton();
      },
      controller: function() {
        return headerBarCtrl;
      },
      destroy: function() {
        headerBarInstance.removeButtons(PRIMARY_BUTTONS);
        headerBarInstance.removeButtons(SECONDARY_BUTTONS);
        headerBarCtrl.removeData();
        headerBarCtrl.destroy();
        containerEle.scope().$destroy();
        containerEle = headerBarEle = titleEle = leftButtonsEle = rightButtonsEle = navEle[PRIMARY_BUTTONS] = navEle[SECONDARY_BUTTONS] = navEle[BACK_BUTTON] = null;
      },
      id: Math.random()
    };

    function positionButtons(btnsEle, buttonType, isInitialLoad) {
      if (!btnsEle) return;

      var appendToRight = (buttonType == SECONDARY_BUTTONS && navBarConfig.positionSecondaryButtons() != 'left') ||
                          (buttonType == PRIMARY_BUTTONS && navBarConfig.positionPrimaryButtons() == 'right');

      if (appendToRight) {
        // right side
        if (!rightButtonsEle) {
          rightButtonsEle = jqLite('<div class="buttons buttons-b">');
          if (isInitialLoad) {
            rightButtonsEle.css('opacity', 0);
          }
          headerBarEle.append(rightButtonsEle);
        }
        if (buttonType == SECONDARY_BUTTONS) {
          rightButtonsEle.append(btnsEle);
        } else {
          rightButtonsEle.prepend(btnsEle);
        }

      } else {
        // left side
        if (!leftButtonsEle) {
          leftButtonsEle = jqLite('<div class="buttons buttons-a">');
          if (isInitialLoad) {
            leftButtonsEle.css('opacity', 0);
          }
          if (navEle[BACK_BUTTON]) {
            navEle[BACK_BUTTON].after(leftButtonsEle);
          } else {
            headerBarEle.prepend(leftButtonsEle);
          }
        }
        if (buttonType == SECONDARY_BUTTONS) {
          leftButtonsEle.append(btnsEle);
        } else {
          leftButtonsEle.prepend(btnsEle);
        }
      }

    }

    headerBars.push(headerBarInstance);

    return headerBarInstance;
  };


  self.navElement = function(type, html) {
    if ( isDefined(html) ) {
      navElementHtml[type] = html;
    }
    return navElementHtml[type];
  };


  self.updateNavBar = function(viewData) {
    self.enable();
    var enteringHeaderBar = self.isInitialized ? getOffScreenHeaderBar() : getOnScreenHeaderBar();
    var leavingHeaderBar = self.isInitialized ? getOnScreenHeaderBar() : null;

    // update if the entering header should show the back button or not
    self.showBackButton(viewData.showBack, enteringHeaderBar);

    // update the entering header bar's title
    self.title(viewData.title, enteringHeaderBar);

    // update the buttons, depending if the view has their own or not
    enteringHeaderBar.setButtons(viewData.primaryButtons, PRIMARY_BUTTONS);
    enteringHeaderBar.setButtons(viewData.secondaryButtons, SECONDARY_BUTTONS);

    // begin transition of entering and leaving header bars
    self.transition(enteringHeaderBar, leavingHeaderBar, viewData.direction);

    self.isInitialized = true;
  };


  self.transition = function(enteringHeaderBar, leavingHeaderBar, direction) {
    var enteringHeaderBarCtrl = enteringHeaderBar.controller();
    var leavingHeaderBarCtrl = leavingHeaderBar && leavingHeaderBar.controller();

    var transitionFn = $ionicConfig.navBar.transitionFn();

    if (!self.isInitialized || !angular.isFunction(transitionFn) || (direction != 'forward' && direction != 'back')) {
      $timeout(function(){
        enteringHeaderBarCtrl.alignTitle().then(transitionComplete);
      });
      return;
    }

    enteringHeaderBarCtrl.stage(true);

    enteringHeaderBarCtrl.resetBackButton();

    var animation = transitionFn(enteringHeaderBarCtrl, leavingHeaderBarCtrl);

    animation[direction].enter(0);

    $timeout(function(){
      enteringHeaderBarCtrl.alignTitle().then(function(){

        enteringHeaderBarCtrl.stage(false);

        animation[direction].enter(1);
        animation[direction].leave(1);

        transitionComplete();
      });

    }, 16);

    function transitionComplete() {
      for (var x=0; x<headerBars.length; x++) {
        headerBars[x].isActive = false;
      }
      enteringHeaderBar.isActive = true;

      enteringHeaderBar.containerEle().addClass('nav-bar-block-active');
      leavingHeaderBar && leavingHeaderBar.containerEle().removeClass('nav-bar-block-active');
    }

  };


  self.showBar = function(shouldShow) {
    self.visibleBar(shouldShow);
    $scope.$parent.$hasHeader = !!shouldShow;
  };


  self.visibleBar = function(shouldShow) {
    if (shouldShow && !isVisible) {
      $element.removeClass(CSS_HIDE);
    } else if (!shouldShow && isVisible) {
      $element.addClass(CSS_HIDE);
    }
    isVisible = shouldShow;
  };


  self.enable = function() {
    // set primary to show first
    self.visibleBar(true);

    // set non primary to hide second
    for (var x=0; x<$ionicNavBarDelegate._instances.length; x++) {
      if ($ionicNavBarDelegate._instances[x] !== self) $ionicNavBarDelegate._instances[x].visibleBar(false);
    }
  };


  self.showBackButton = function(show, headerBar) {
    headerBar = headerBar || getOnScreenHeaderBar();
    headerBar && headerBar.showBack(show);
  };


  self.title = function(newTitleText, headerBar) {
    if (arguments.length) {
      newTitleText = newTitleText || '';
      headerBar = headerBar || getOnScreenHeaderBar();
      headerBar && headerBar.title(newTitleText);
      previousTitleText = titleText;
      titleText = newTitleText;
    }
    return titleText;
  };


  function createNavElement(type) {
    if ( navElementHtml[type] ) {
      return jqLite(navElementHtml[type]);
    }
  }


  function getOnScreenHeaderBar() {
    for (var x=0; x<headerBars.length; x++) {
      if (headerBars[x].isActive) return headerBars[x];
    }
  }


  function getOffScreenHeaderBar() {
    for (var x=0; x<headerBars.length; x++) {
      if (!headerBars[x].isActive) return headerBars[x];
    }
  }


  $scope.$goBack = self.back = function() {
    var backView = $ionicHistory.backView();
    backView && backView.go();
  };


  $scope.$on('$destroy', function(){
    $scope.$parent.$hasHeader = false;
    $element.parent().removeData(DATA_NAV_BAR_CTRL);
    headerBars = null;
    deregisterInstance();
  });

}]);


IonicModule
.controller('$ionNavView', [
  '$scope',
  '$element',
  '$attrs',
  '$ionicHistory',
  '$ionicViewSwitcher',
  '$ionicConfig',
function($scope, $element, $attrs, $ionicHistory, $ionicViewSwitcher, $ionicConfig) {
  var self = this;
  var direction;
  var isPrimary = false;


  self.init = function() {
    var navViewName = $attrs.name || '';

    // Find the details of the parent view directive (if any) and use it
    // to derive our own qualified view name, then hang our own details
    // off the DOM so child directives can find it.
    var parent = $element.parent().inheritedData('$uiView');
    var parentViewName = ((parent && parent.state) ? parent.state.name : '');
    if (navViewName.indexOf('@') < 0) navViewName  = navViewName + '@' + parentViewName;

    var viewData = { name: navViewName, state: null };
    $element.data('$uiView', viewData);

    return viewData;
  };


  self.register = function(viewLocals) {
    // register that a view is coming in and get info on how it should transition
    var registerData = $ionicHistory.register($scope, viewLocals);

    // update which direction
    self.update(registerData);

    // begin rendering and transitioning
    self.render(registerData.viewId, viewLocals, registerData);
  };


  self.update = function(registerData) {
    // always reset that this is the primary navView
    isPrimary = true;

    // remember what direction this navView should use
    // this may get updated later by a child navView
    direction = registerData.direction;

    var parentNavViewCtrl = $element.parent().inheritedData('$ionNavViewController');
    if (parentNavViewCtrl) {
      // this navView is nested inside another one
      // update the parent to use this direction and not
      // the another it originally was set to

      // inform the parent navView that it is not the primary navView
      parentNavViewCtrl.isPrimary(false);

      if (direction === 'enter' || direction === 'exit') {
        // they're entering/exiting a history
        // find parent navViewController
        parentNavViewCtrl.direction(direction);

        if (direction === 'enter') {
          // reset the direction so this navView doesn't animate
          // because it's parent will
          direction = 'none';
        }
      }
    }
  };


  self.render = function(viewId, viewLocals, registerData) {
    var enteringView = $ionicHistory.getViewById(viewId) || {};

    // register the view and figure out where it lives in the various
    // histories and nav stacks, along with how views should enter/leave
    var switcher = $ionicViewSwitcher.create($scope, $element, viewLocals, enteringView);

    // init the rendering of views for this navView directive
    switcher.init(function(){
      // the view is now compiled, in the dom and linked, now lets transition the views.
      // this uses a callback incase THIS nav-view has a nested nav-view, and after the NESTED
      // nav-view links, the NESTED nav-view would update which direction THIS nav-view should use
      switcher.transition( self.direction(), registerData.showBack );
    });

  };


  self.beforeEnter = function(transData) {
    if (isPrimary) {
      // only update this nav-view's nav-bar if this is the primary nav-view
      var associatedNavBarCtrl = getAssociatedNavBarCtrl();
      transData.transition = $ionicConfig.navBar.transition();
      associatedNavBarCtrl && associatedNavBarCtrl.updateNavBar(transData);
    }
  };


  self.showBar = function(val) {
    var associatedNavBarCtrl = getAssociatedNavBarCtrl();
    associatedNavBarCtrl && associatedNavBarCtrl.showBar(val);
  };


  self.showBackButton = function(val) {
    var associatedNavBarCtrl = getAssociatedNavBarCtrl();
    associatedNavBarCtrl && associatedNavBarCtrl.showBackButton(val);
  };


  self.isPrimary = function(val) {
    if (arguments.length) {
      isPrimary = val;
    }
    return isPrimary;
  };


  self.direction = function(val) {
    if (arguments.length) {
      direction = val;
    }
    return direction;
  };


  function getAssociatedNavBarCtrl() {
    return $element.inheritedData('$ionNavBarController');
  }

}]);

/**
 * @private
 */
IonicModule

.controller('$ionicScroll', [
  '$scope',
  'scrollViewOptions',
  '$timeout',
  '$window',
  '$location',
  '$rootScope',
  '$document',
  '$ionicScrollDelegate',
function($scope, scrollViewOptions, $timeout, $window, $location, $rootScope, $document, $ionicScrollDelegate) {

  var self = this;
  // for testing
  this.__timeout = $timeout;

  this._scrollViewOptions = scrollViewOptions; //for testing

  var element = this.element = scrollViewOptions.el;
  var $element = this.$element = jqLite(element);
  var scrollView = this.scrollView = new ionic.views.Scroll(scrollViewOptions);

  //Attach self to element as a controller so other directives can require this controller
  //through `require: '$ionicScroll'
  //Also attach to parent so that sibling elements can require this
  ($element.parent().length ? $element.parent() : $element)
    .data('$$ionicScrollController', this);

  var deregisterInstance = $ionicScrollDelegate._registerInstance(
    this, scrollViewOptions.delegateHandle
  );

  if (!angular.isDefined(scrollViewOptions.bouncing)) {
    ionic.Platform.ready(function() {
      scrollView.options.bouncing = true;

      if(ionic.Platform.isAndroid()) {
        // No bouncing by default on Android
        scrollView.options.bouncing = false;
        // Faster scroll decel
        scrollView.options.deceleration = 0.95;
      }
    });
  }

  var resize = angular.bind(scrollView, scrollView.resize);
  ionic.on('resize', resize, $window);


  var scrollFunc = function(e) {
    var detail = (e.originalEvent || e).detail || {};
    $scope.$onScroll && $scope.$onScroll({
      event: e,
      scrollTop: detail.scrollTop || 0,
      scrollLeft: detail.scrollLeft || 0
    });
  };

  $element.on('scroll', scrollFunc );

  $scope.$on('$destroy', function() {
    deregisterInstance();
    scrollView.__cleanup();
    ionic.off('resize', resize, $window);
    $window.removeEventListener('resize', resize);
    scrollViewOptions = null;
    self._scrollViewOptions.el = null;
    self._scrollViewOptions = null;
    $element.off('scroll', scrollFunc);
    $element = null;
    self.$element = null;
    element = null;
    self.element = null;
    self.scrollView = null;
    scrollView = null;
  });

  $timeout(function() {
    scrollView && scrollView.run && scrollView.run();
  });

  this.getScrollView = function() {
    return this.scrollView;
  };

  this.getScrollPosition = function() {
    return this.scrollView.getValues();
  };

  this.resize = function() {
    return $timeout(resize).then(function() {
      $element && $element.triggerHandler('scroll.resize');
    });
  };

  this.scrollTop = function(shouldAnimate) {
    this.resize().then(function() {
      scrollView.scrollTo(0, 0, !!shouldAnimate);
    });
  };

  this.scrollBottom = function(shouldAnimate) {
    this.resize().then(function() {
      var max = scrollView.getScrollMax();
      scrollView.scrollTo(max.left, max.top, !!shouldAnimate);
    });
  };

  this.scrollTo = function(left, top, shouldAnimate) {
    this.resize().then(function() {
      scrollView.scrollTo(left, top, !!shouldAnimate);
    });
  };

  this.zoomTo = function(zoom, shouldAnimate, originLeft, originTop) {
    this.resize().then(function() {
      scrollView.zoomTo(zoom, !!shouldAnimate, originLeft, originTop);
    });
  };

  this.zoomBy = function(zoom, shouldAnimate, originLeft, originTop) {
    this.resize().then(function() {
      scrollView.zoomBy(zoom, !!shouldAnimate, originLeft, originTop);
    });
  };

  this.scrollBy = function(left, top, shouldAnimate) {
    this.resize().then(function() {
      scrollView.scrollBy(left, top, !!shouldAnimate);
    });
  };

  this.anchorScroll = function(shouldAnimate) {
    this.resize().then(function() {
      var hash = $location.hash();
      var elm = hash && $document[0].getElementById(hash);
      if (!(hash && elm)) {
        scrollView.scrollTo(0,0, !!shouldAnimate);
        return;
      }
      var curElm = elm;
      var scrollLeft = 0, scrollTop = 0, levelsClimbed = 0;
      do {
        if(curElm !== null)scrollLeft += curElm.offsetLeft;
        if(curElm !== null)scrollTop += curElm.offsetTop;
        curElm = curElm.offsetParent;
        levelsClimbed++;
      } while (curElm.attributes != self.element.attributes && curElm.offsetParent);
      scrollView.scrollTo(scrollLeft, scrollTop, !!shouldAnimate);
    });
  };


  /**
   * @private
   */
  this._setRefresher = function(refresherScope, refresherElement) {
    var refresher = this.refresher = refresherElement;
    var refresherHeight = self.refresher.clientHeight || 60;
    scrollView.activatePullToRefresh(refresherHeight, function() {
      // activateCallback
      refresher.classList.add('active');
      refresherScope.$onPulling();
    }, function() {
      // deactivateCallback
        refresher.classList.remove('active', 'refreshing', 'refreshing-tail');
    }, function() {
      // startCallback
      refresher.classList.add('refreshing');
      refresherScope.$onRefresh();
    },function(){
      // showCallback
      refresher.classList.remove('invisible');
    },function(){
      // hideCallback
      refresher.classList.add('invisible');
    },function(){
      // tailCallback
      refresher.classList.add('refreshing-tail');
    });
  };
}]);


IonicModule
.controller('$ionicSideMenus', [
  '$scope',
  '$attrs',
  '$ionicSideMenuDelegate',
  '$ionicPlatform',
  '$ionicBody',
  '$ionicHistory',
function($scope, $attrs, $ionicSideMenuDelegate, $ionicPlatform, $ionicBody, $ionicHistory) {
  var self = this;
  var rightShowing, leftShowing, isDragging;
  var startX, lastX, offsetX, isAsideExposed;

  self.$scope = $scope;

  self.initialize = function(options) {
    self.left = options.left;
    self.right = options.right;
    self.setContent(options.content);
    self.dragThresholdX = options.dragThresholdX || 10;
    $ionicHistory.registerHistory(self.$scope);
  };

  /**
   * Set the content view controller if not passed in the constructor options.
   *
   * @param {object} content
   */
  self.setContent = function(content) {
    if (content) {
      self.content = content;

      self.content.onDrag = function(e) {
        self._handleDrag(e);
      };

      self.content.endDrag = function(e) {
        self._endDrag(e);
      };
    }
  };

  self.isOpenLeft = function() {
    return self.getOpenAmount() > 0;
  };

  self.isOpenRight = function() {
    return self.getOpenAmount() < 0;
  };

  /**
   * Toggle the left menu to open 100%
   */
  self.toggleLeft = function(shouldOpen) {
    if (isAsideExposed || !self.left.isEnabled) return;
    var openAmount = self.getOpenAmount();
    if (arguments.length === 0) {
      shouldOpen = openAmount <= 0;
    }
    self.content.enableAnimation();
    if (!shouldOpen) {
      self.openPercentage(0);
    } else {
      self.openPercentage(100);
    }
  };

  /**
   * Toggle the right menu to open 100%
   */
  self.toggleRight = function(shouldOpen) {
    if (isAsideExposed || !self.right.isEnabled) return;
    var openAmount = self.getOpenAmount();
    if (arguments.length === 0) {
      shouldOpen = openAmount >= 0;
    }
    self.content.enableAnimation();
    if (!shouldOpen) {
      self.openPercentage(0);
    } else {
      self.openPercentage(-100);
    }
  };

  self.toggle = function(side) {
    if (side == 'right') {
      self.toggleRight();
    } else {
      self.toggleLeft();
    }
  };

  /**
   * Close all menus.
   */
  self.close = function() {
    self.openPercentage(0);
  };

  /**
   * @return {float} The amount the side menu is open, either positive or negative for left (positive), or right (negative)
   */
  self.getOpenAmount = function() {
    return self.content && self.content.getTranslateX() || 0;
  };

  /**
   * @return {float} The ratio of open amount over menu width. For example, a
   * menu of width 100 open 50 pixels would be open 50% or a ratio of 0.5. Value is negative
   * for right menu.
   */
  self.getOpenRatio = function() {
    var amount = self.getOpenAmount();
    if (amount >= 0) {
      return amount / self.left.width;
    }
    return amount / self.right.width;
  };

  self.isOpen = function() {
    return self.getOpenAmount() !== 0;
  };

  /**
   * @return {float} The percentage of open amount over menu width. For example, a
   * menu of width 100 open 50 pixels would be open 50%. Value is negative
   * for right menu.
   */
  self.getOpenPercentage = function() {
    return self.getOpenRatio() * 100;
  };

  /**
   * Open the menu with a given percentage amount.
   * @param {float} percentage The percentage (positive or negative for left/right) to open the menu.
   */
  self.openPercentage = function(percentage) {
    var p = percentage / 100;

    if (self.left && percentage >= 0) {
      self.openAmount(self.left.width * p);
    } else if (self.right && percentage < 0) {
      var maxRight = self.right.width;
      self.openAmount(self.right.width * p);
    }

    // add the CSS class "menu-open" if the percentage does not
    // equal 0, otherwise remove the class from the body element
    $ionicBody.enableClass((percentage !== 0), 'menu-open');
  };

  /**
   * Open the menu the given pixel amount.
   * @param {float} amount the pixel amount to open the menu. Positive value for left menu,
   * negative value for right menu (only one menu will be visible at a time).
   */
  self.openAmount = function(amount) {
    var maxLeft = self.left && self.left.width || 0;
    var maxRight = self.right && self.right.width || 0;

    // Check if we can move to that side, depending if the left/right panel is enabled
    if (!(self.left && self.left.isEnabled) && amount > 0) {
      self.content.setTranslateX(0);
      return;
    }

    if (!(self.right && self.right.isEnabled) && amount < 0) {
      self.content.setTranslateX(0);
      return;
    }

    if (leftShowing && amount > maxLeft) {
      self.content.setTranslateX(maxLeft);
      return;
    }

    if (rightShowing && amount < -maxRight) {
      self.content.setTranslateX(-maxRight);
      return;
    }

    self.content.setTranslateX(amount);

    if (amount >= 0) {
      leftShowing = true;
      rightShowing = false;

      if (amount > 0) {
        // Push the z-index of the right menu down
        self.right && self.right.pushDown && self.right.pushDown();
        // Bring the z-index of the left menu up
        self.left && self.left.bringUp && self.left.bringUp();
      }
    } else {
      rightShowing = true;
      leftShowing = false;

      // Bring the z-index of the right menu up
      self.right && self.right.bringUp && self.right.bringUp();
      // Push the z-index of the left menu down
      self.left && self.left.pushDown && self.left.pushDown();
    }
  };

  /**
   * Given an event object, find the final resting position of this side
   * menu. For example, if the user "throws" the content to the right and
   * releases the touch, the left menu should snap open (animated, of course).
   *
   * @param {Event} e the gesture event to use for snapping
   */
  self.snapToRest = function(e) {
    // We want to animate at the end of this
    self.content.enableAnimation();
    isDragging = false;

    // Check how much the panel is open after the drag, and
    // what the drag velocity is
    var ratio = self.getOpenRatio();

    if (ratio === 0) {
      // Just to be safe
      self.openPercentage(0);
      return;
    }

    var velocityThreshold = 0.3;
    var velocityX = e.gesture.velocityX;
    var direction = e.gesture.direction;

    // Going right, less than half, too slow (snap back)
    if (ratio > 0 && ratio < 0.5 && direction == 'right' && velocityX < velocityThreshold) {
      self.openPercentage(0);
    }

    // Going left, more than half, too slow (snap back)
    else if (ratio > 0.5 && direction == 'left' && velocityX < velocityThreshold) {
      self.openPercentage(100);
    }

    // Going left, less than half, too slow (snap back)
    else if (ratio < 0 && ratio > -0.5 && direction == 'left' && velocityX < velocityThreshold) {
      self.openPercentage(0);
    }

    // Going right, more than half, too slow (snap back)
    else if (ratio < 0.5 && direction == 'right' && velocityX < velocityThreshold) {
      self.openPercentage(-100);
    }

    // Going right, more than half, or quickly (snap open)
    else if (direction == 'right' && ratio >= 0 && (ratio >= 0.5 || velocityX > velocityThreshold)) {
      self.openPercentage(100);
    }

    // Going left, more than half, or quickly (span open)
    else if (direction == 'left' && ratio <= 0 && (ratio <= -0.5 || velocityX > velocityThreshold)) {
      self.openPercentage(-100);
    }

    // Snap back for safety
    else {
      self.openPercentage(0);
    }
  };

  self.isAsideExposed = function() {
    return !!isAsideExposed;
  };

  self.exposeAside = function(shouldExposeAside) {
    if (!(self.left && self.left.isEnabled) && !(self.right && self.right.isEnabled)) return;
    self.close();
    isAsideExposed = shouldExposeAside;
    if (self.left && self.left.isEnabled) {
      // set the left marget width if it should be exposed
      // otherwise set false so there's no left margin
      self.content.setMarginLeft(isAsideExposed ? self.left.width : 0);
    } else if (self.right && self.right.isEnabled) {
      self.content.setMarginRight(isAsideExposed ? self.right.width : 0);
    }

    self.$scope.$emit('$ionicExposeAside', isAsideExposed);
  };

  self.activeAsideResizing = function(isResizing) {
    $ionicBody.enableClass(isResizing, 'aside-resizing');
  };

  // End a drag with the given event
  self._endDrag = function(e) {
    if (isAsideExposed) return;

    if (isDragging) {
      self.snapToRest(e);
    }
    startX = null;
    lastX = null;
    offsetX = null;
  };

  // Handle a drag event
  self._handleDrag = function(e) {
    if (isAsideExposed) return;

    // If we don't have start coords, grab and store them
    if (!startX) {
      startX = e.gesture.touches[0].pageX;
      lastX = startX;
    } else {
      // Grab the current tap coords
      lastX = e.gesture.touches[0].pageX;
    }

    // Calculate difference from the tap points
    if (!isDragging && Math.abs(lastX - startX) > self.dragThresholdX) {
      // if the difference is greater than threshold, start dragging using the current
      // point as the starting point
      startX = lastX;

      isDragging = true;
      // Initialize dragging
      self.content.disableAnimation();
      offsetX = self.getOpenAmount();
    }

    if (isDragging) {
      self.openAmount(offsetX + (lastX - startX));
    }
  };

  self.canDragContent = function(canDrag) {
    if (arguments.length) {
      $scope.dragContent = !!canDrag;
    }
    return $scope.dragContent;
  };

  self.edgeThreshold = 25;
  self.edgeThresholdEnabled = false;
  self.edgeDragThreshold = function(value) {
    if (arguments.length) {
      if (angular.isNumber(value) && value > 0) {
        self.edgeThreshold = value;
        self.edgeThresholdEnabled = true;
      } else {
        self.edgeThresholdEnabled = !!value;
      }
    }
    return self.edgeThresholdEnabled;
  };

  self.isDraggableTarget = function(e) {
    //Only restrict edge when sidemenu is closed and restriction is enabled
    var shouldOnlyAllowEdgeDrag = self.edgeThresholdEnabled && !self.isOpen();
    var startX = e.gesture.startEvent && e.gesture.startEvent.center &&
      e.gesture.startEvent.center.pageX;

    var dragIsWithinBounds = !shouldOnlyAllowEdgeDrag ||
      startX <= self.edgeThreshold ||
      startX >= self.content.element.offsetWidth - self.edgeThreshold;

    return ($scope.dragContent || self.isOpen()) &&
      dragIsWithinBounds &&
      !e.gesture.srcEvent.defaultPrevented &&
      !e.target.tagName.match(/input|textarea|select|object|embed/i) &&
      !e.target.isContentEditable &&
      !(e.target.dataset ? e.target.dataset.preventScroll : e.target.getAttribute('data-prevent-scroll') == 'true');
  };

  $scope.sideMenuContentTranslateX = 0;

  var deregisterBackButtonAction = angular.noop;
  var closeSideMenu = angular.bind(self, self.close);

  $scope.$watch(function() {
    return self.getOpenAmount() !== 0;
  }, function(isOpen) {
    deregisterBackButtonAction();
    if (isOpen) {
      deregisterBackButtonAction = $ionicPlatform.registerBackButtonAction(
        closeSideMenu,
        PLATFORM_BACK_BUTTON_PRIORITY_SIDE_MENU
      );
    }
  });

  var deregisterInstance = $ionicSideMenuDelegate._registerInstance(
    self, $attrs.delegateHandle
  );

  $scope.$on('$destroy', function() {
    deregisterInstance();
    deregisterBackButtonAction();
    self.$scope = null;
    if (self.content) {
      self.content.element = null;
      self.content = null;
    }
  });

  self.initialize({
    left: {
      width: 275
    },
    right: {
      width: 275
    }
  });

}]);

IonicModule
.controller('$ionSlideBox', [
  '$scope',
  '$element',
  '$$ionicAttachDrag',
  '$interval',
  /*
   * This can be abstracted into a controller that will work for views, tabs, and
   * slidebox.
   */
function(scope, element, $$ionicAttachDrag, $interval) {
  var self = this;
  var slideList = ionic.Utils.list([]);
  var slidesParent = angular.element(element[0].querySelector('.slider-slides'));

  // Successful slide requires velocity to be greater than this amount
  var SLIDE_SUCCESS_VELOCITY = (1 / 4); // pixels / ms
  var SLIDE_TRANSITION_DURATION = 250; //ms

  $$ionicAttachDrag(scope, element, {
    getDistance: function() { return slidesParent.prop('offsetWidth'); },
    onDrag: onDrag,
    onDragEnd: onDragEnd
  });

  self.element = element;
  self.isRelevant = isRelevant;
  self.previous = previous;
  self.next = next;

  // Methods calling straight back to Utils.list
  self.at = slideList.at;
  self.count = slideList.count;
  self.indexOf = slideList.indexOf;
  self.isInRange = slideList.isInRange;
  self.loop = slideList.loop;
  self.delta = slideList.delta;

  self.update = update;
  self.enableSlide = enableSlide;
  self.autoPlay = autoPlay;
  self.add = add;
  self.remove = remove;
  self.move = move;
  self.selected = selected;
  self.select = select;
  self.onDrag = onDrag;
  self.onDragEnd = onDragEnd;

  // ***
  // Public Methods
  // ***

  // Gets whether the given index is relevant to selected
  // That is, whether the given index is previous, selected, or next
  function isRelevant(index) {
    return slideList.isRelevant(index, scope.selectedIndex);
  }

  // Gets the index to the previous of the given slide, default scope.selectedIndex
  function previous(index) {
    index = arguments.length ? index : scope.selectedIndex;
    // If we only have two slides and loop is enabled, we cannot have a previous
    // because previous === next. In this case, return -1.
    if (self.loop() && self.count() === 2) {
      return -1;
    }
    return slideList.previous(index);
  }

  // Gets the index to the next of the given slide, default scope.selectedIndex
  function next(index) {
    index = arguments.length ? index : scope.selectedIndex;
    return slideList.next(index);
  }

  function update() {
    var selectedIndex = scope.selectedIndex;
    for (var i = self.count() - 1; i >= 0; i--) {
      slideList.remove(i);
    }
    var slideNodes = element[0].querySelectorAll('ion-slide');
    for (var j = 0, jj = slideNodes.length; j < jj; j++) {
      slideList.add(jqLite(slideNodes[j]).controller('ionSlide'));
    }
    self.select(selectedIndex);
  }

  function enableSlide(isEnabled) {
    if (arguments.length) {
      self.dragDisabled = !isEnabled;
    }
    return !!self.dragDisabled;
  }

  function autoPlay(newInterval) {
    $interval.cancel(self.autoPlayTimeout);

    if (angular.isNumber(newInterval) && newInterval > 0) {
      self.autoPlayTimeout = $interval(function() {
        self.select(self.next());
      }, newInterval);
    }
  }

  /*
   * Add/remove/move slides
   */
  function add(slide, index) {
    var newIndex = slideList.add(slide, index);
    slide.onAdded();

    // If we are waiting for a certain scope.selectedIndex and this is it,
    // select the slide
    if (scope.selectedIndex === index) {
      self.select(newIndex);
    // If we don't have a selectedIndex yet, select the first one available
    } else if (!isNumber(scope.selectedIndex) || scope.selectedIndex === -1) {
      self.select(newIndex);
    } else if (newIndex === self.previous() || newIndex === self.next()) {
      // if the new slide is adjacent to selected, refresh the selection
      enqueueRefresh();
    }
  }
  function remove(slide) {
    var index = self.indexOf(slide);
    if (index === -1) return;

    var isSelected = self.selected() === index;
    slideList.remove(index);
    slide.onRemoved();

    if (isSelected) {
      self.select( self.isInRange(scope.selectedIndex) ? scope.selectedIndex : scope.selectedIndex - 1 );
    }
  }
  function move(slide, targetIndex) {
    var index = self.indexOf(slide);
    if (index === -1) return;

    // If the slide is current, next, or previous, save so we can re-select after moving.
    var isRelevant = self.selected() === index || self.isRelevant(targetIndex);
    slideList.remove(index);
    slideList.add(slide, targetIndex);

    if (isRelevant) {
      self.select(targetIndex);
    }
  }

  function selected() {
    return self.isInRange(scope.selectedIndex) ? scope.selectedIndex : -1;
  }

  /*
   * Select and change slides
   */
  function select(newIndex, transitionDuration) {
    if (!self.isInRange(newIndex)) return;

    var delta = self.delta(scope.selectedIndex, newIndex);

    slidesParent.css(
      ionic.CSS.TRANSITION_DURATION,
      (transitionDuration || SLIDE_TRANSITION_DURATION) + 'ms'
    );
    scope.selectedIndex = newIndex;

    if (self.isInRange(scope.selectedIndex) && Math.abs(delta) > 1) {
      // if the new slide is > 1 away, then it is currently not attached to the DOM.
      // Attach it in the position from which it will slide in.
      self.at(newIndex).setState(delta > 1 ? 'next' : 'previous');
      // Wait one frame so the new slide can 'settle' in its new place and
      // be ready to properly transition in
      ionic.requestAnimationFrame(doSelect);
    } else {
      doSelect();
    }

    function doSelect() {
      // If a new selection has happened before this frame, abort.
      if (scope.selectedIndex !== newIndex) return;
      scope.$evalAsync(function() {
        if (scope.selectedIndex !== newIndex) return;
        arrangeSlides(newIndex);
      });
    }
  }

  // percent is negative 0-1 for backward slide
  // positive 0-1 for forward slide
  function onDrag(percent) {
    if (self.dragDisabled) return;

    var target = self.at(percent > 0 ? self.next() : self.previous());
    var current = self.at(self.selected());

    target && target.transform(percent);
    current && current.transform(percent);
  }

  function onDragEnd(percent, velocity) {
    var nextIndex = -1;
    if (Math.abs(percent) > 0.5 || velocity > SLIDE_SUCCESS_VELOCITY) {
      nextIndex = percent > 0 ? self.next() : self.previous();
    }

    // Select a new slide if it's avaiable
    if (self.isInRange(nextIndex)) {
      var distanceRemaining = (1 - Math.abs(percent)) * slidesParent.prop('offsetWidth');
      var transitionDuration = Math.min(
        distanceRemaining / velocity,
        SLIDE_TRANSITION_DURATION
      );
      self.select(nextIndex, transitionDuration);
    } else {
      self.select(scope.selectedIndex);
    }
  }

  // ***
  // Private Methods
  // ***

  var oldSlides;
  function arrangeSlides(newShownIndex) {
    var newSlides = {
      previous: self.at(self.previous(newShownIndex)),
      selected: self.at(newShownIndex),
      next: self.at(self.next(newShownIndex))
    };

    newSlides.previous && newSlides.previous.setState('previous');
    newSlides.selected && newSlides.selected.setState('selected');
    newSlides.next && newSlides.next.setState('next');

    if (oldSlides) {
      var oldShown = oldSlides.selected;
      var delta = self.delta(self.indexOf(oldSlides.selected), self.indexOf(newSlides.selected));
      if (Math.abs(delta) > 1) {
        // If we're changing by more than one slide, we need to manually transition
        // the current slide out and then put it into its new state.
        oldShown.setState(delta > 1 ? 'previous' : 'next').then(function() {
          oldShown.setState(
            newSlides.previous === oldShown ?  'previous' :
            newSlides.next === oldShown ? 'next' :
            'detached'
          );
        });
      } else {
        detachIfUnused(oldSlides.selected);
      }
      //Additionally, we need to detach both of the old slides.
      detachIfUnused(oldSlides.previous);
      detachIfUnused(oldSlides.next);
    }

    function detachIfUnused(oldSlide) {
      if (oldSlide && oldSlide !== newSlides.previous &&
          oldSlide !== newSlides.selected &&
          oldSlide !== newSlides.next) {
        oldSlide.setState('detached');
      }
    }

    oldSlides = newSlides;
  }

  // When adding/moving slides, we sometimes need to refresh
  // the currently selected slides to reflect new data.
  // We don't want to refresh more than once per digest cycle,
  // so we do this.
  function enqueueRefresh() {
    if (!enqueueRefresh.queued) {
      enqueueRefresh.queued = true;
      scope.$$postDigest(function() {
        self.select(scope.selectedIndex);
        enqueueRefresh.queued = false;
      });
    }
  }
}]);

IonicModule
.controller('$ionSlide', [
  '$scope',
  '$element',
  '$q',
function(scope, element, $q) {
  var self = this;

  scope.$on('$destroy', function() {
    // Re-attach the element so it can be properly removed
    attachSlide();
  });
  element.on(ionic.CSS.TRANSITIONEND, onTransitionEnd);

  self.element = element;

  self.onAdded = onAdded;
  self.onRemoved = onRemoved;

  self.transform = transform;

  self.state = '';
  self.setState = setState;

  // ***
  // Public Methods
  // ***

  function onAdded() {
    // Set default state
    self.setState('detached');
  }
  function onRemoved() {
    self.setState('detached');
  }

  var isTransforming;
  // percent is negative 0-1 for dragging left
  // percent is positive 0-1 for dragging right
  function transform(percent) {
    if (!isTransforming) {
      self.element.addClass('no-animate');
      isTransforming = true;
    }

    var startPercent = self.state === 'previous' ? -1 :
      self.state === 'next' ? 1 :
      0;
    self.element.css(
      ionic.CSS.TRANSFORM,
      'translate3d(' + (100 * (startPercent - percent)) + '%, 0, 0)'
    );
  }

  function setState(newState) {
    if (newState !== self.state) {
      self.state && self.element.attr('slide-previous-state', self.state);
      self.element.attr('slide-state', newState);
    }
    self.element.css(ionic.CSS.TRANSFORM, '');
    self.element.removeClass('no-animate');
    isTransforming = false;

    self.previousState = self.state;
    self.state = newState;

    switch(newState) {
      case 'detached':
        detachSlide();
        break;
      case 'previous':
      case 'next':
      case 'selected':
        attachSlide();
        break;
    }

    return getTransitionPromise();
  }

  // ***
  // Private Methods
  // ***

  function attachSlide() {
    // if (!self.element[0].parentNode) {
    //   self.parentElement.append(self.element);
    //   ionic.Utils.reconnectScope(scope);
    // }
    ionic.Utils.reconnectScope(scope);
  }

  function detachSlide() {
    // Don't use self.element.remove(), that will destroy the element's data
    // var parent = self.element[0].parentNode;
    // if (parent) {
    //   parent.removeChild(self.element[0]);
    //   ionic.Utils.disconnectScope(scope);
    // }
    ionic.Utils.disconnectScope(scope);
  }

  var transitionDeferred;
  function getTransitionPromise() {
    // If we aren't transitioning to or from selected, there's no transition, so instantly resolve.
    if (self.previousState !== 'selected' && self.state !== 'selected') {
      return $q.when();
    }

    // Interrupt current promise if a new state was set.
    transitionDeferred && transitionDeferred.reject();
    transitionDeferred = $q.defer();

    return transitionDeferred.promise;
  }

  function onTransitionEnd(ev) {
    if (ev.target !== element[0]) return; //don't let the event bubble up from children
    transitionDeferred && transitionDeferred.resolve();
  }

}]);

IonicModule
.controller('$ionicTab', [
  '$scope',
  '$ionicHistory',
  '$attrs',
  '$location',
  '$state',
function($scope, $ionicHistory, $attrs, $location, $state) {
  this.$scope = $scope;

  //All of these exposed for testing
  this.hrefMatchesState = function() {
    return $attrs.href && $location.path().indexOf(
      $attrs.href.replace(/^#/, '').replace(/\/$/, '')
    ) === 0;
  };
  this.srefMatchesState = function() {
    return $attrs.uiSref && $state.includes( $attrs.uiSref.split('(')[0] );
  };
  this.navNameMatchesState = function() {
    return this.navViewName && $ionicHistory.isCurrentStateNavView(this.navViewName);
  };

  this.tabMatchesState = function() {
    return this.hrefMatchesState() || this.srefMatchesState() || this.navNameMatchesState();
  };
}]);

IonicModule
.controller('$ionicTabs', [
  '$scope',
  '$ionicHistory',
  '$element',
function($scope, $ionicHistory, $element) {
  var _selectedTab = null;
  var self = this;
  self.tabs = [];

  self.selectedIndex = function() {
    return self.tabs.indexOf(_selectedTab);
  };
  self.selectedTab = function() {
    return _selectedTab;
  };

  self.add = function(tab) {
    $ionicHistory.registerHistory(tab);
    self.tabs.push(tab);
  };

  self.remove = function(tab) {
    var tabIndex = self.tabs.indexOf(tab);
    if (tabIndex === -1) {
      return;
    }
    //Use a field like '$tabSelected' so developers won't accidentally set it in controllers etc
    if (tab.$tabSelected) {
      self.deselect(tab);
      //Try to select a new tab if we're removing a tab
      if (self.tabs.length === 1) {
        //do nothing if there are no other tabs to select
      } else {
        //Select previous tab if it's the last tab, else select next tab
        var newTabIndex = tabIndex === self.tabs.length - 1 ? tabIndex - 1 : tabIndex + 1;
        self.select(self.tabs[newTabIndex]);
      }
    }
    self.tabs.splice(tabIndex, 1);
  };

  self.deselect = function(tab) {
    if (tab.$tabSelected) {
      _selectedTab = null;
      tab.$tabSelected = false;
      (tab.onDeselect || angular.noop)();
    }
  };

  self.select = function(tab, shouldEmitEvent) {
    var tabIndex;
    if (angular.isNumber(tab)) {
      tabIndex = tab;
      if(tabIndex >= self.tabs.length) return;
      tab = self.tabs[tabIndex];
    } else {
      tabIndex = self.tabs.indexOf(tab);
    }

    if (arguments.length === 1) {
      shouldEmitEvent = !!(tab.navViewName || tab.uiSref);
    }

    if (_selectedTab && _selectedTab.$historyId == tab.$historyId) {
      if (shouldEmitEvent) {
        $ionicHistory.goToHistoryRoot(tab.$historyId);
      }
    } else {
      forEach(self.tabs, function(tab) {
        self.deselect(tab);
      });

      _selectedTab = tab;
      //Use a funny name like $tabSelected so the developer doesn't overwrite the var in a child scope
      tab.$tabSelected = true;
      (tab.onSelect || angular.noop)();

      if (shouldEmitEvent) {
        var viewData = {
          type: 'tab',
          tabIndex: tabIndex,
          historyId: tab.$historyId,
          navViewName: tab.navViewName,
          hasNavView: !!tab.navViewName,
          title: tab.title,
          url: tab.href,
          uiSref: tab.uiSref
        };
        $scope.$emit('$ionicHistory.change', viewData);
      }
    }
  };
}]);


IonicModule
.controller('$ionView', [
  '$scope',
  '$element',
  '$attrs',
  '$compile',
  '$ionicHistory',
function($scope, $element, $attrs, $compile, $ionicHistory) {
  var self = this;
  var navElementHtml = {};
  var navViewCtrl;


  self.init = function() {
    var modalCtrl = $element.inheritedData('$ionModalController');
    navViewCtrl = $element.inheritedData('$ionNavViewController');

    // don't bother if inside a modal or there's no parent navView
    if (!navViewCtrl || modalCtrl) return;

    // add listeners for when this view changes
    $scope.$on('$ionicView.beforeEnter', self.beforeEnter);
    $scope.$on('$ionicView.afterEnter', self.afterEnter);

    // watch to see if the hideNavBar attribute changes
    var hideNavAttr = isDefined($attrs.hideNavBar) ? $attrs.hideNavBar : 'false';
    $scope.$watch(hideNavAttr, function(value) {
      navViewCtrl.showBar(!value);
    });
  };


  self.beforeEnter = function(ev, transitionData) {
    // this event was emitted, starting at intial ion-view, then bubbles up
    // only the first ion-view should do something with it, parent ion-views should ignore
    if (!transitionData.viewNotified) {
      transitionData.viewNotified = true;

      $ionicHistory.currentTitle( $attrs.title );

      navViewCtrl.beforeEnter({
        title: $attrs.title,
        direction: transitionData.direction,
        transition: transitionData.transition,
        showBack: transitionData.showBack && !$attrs.hideBackButton,
        primaryButtons: generateButton(navElementHtml.primaryButtons),
        secondaryButtons: generateButton(navElementHtml.secondaryButtons)
      });
    }
  };


  function generateButton(html) {
    if (html) {
      // every time a view enters we need to recreate its view buttons if they exist
      return $compile(html)($scope.$new());
    }
  }


  self.afterEnter = function() {
    $element.removeClass('nav-view-cache');
  };


  self.navElement = function(type, html) {
    navElementHtml[type] = html;
  };

}]);


/*
 * We don't document the ionActionSheet directive, we instead document
 * the $ionicActionSheet service
 */
IonicModule
.directive('ionActionSheet', ['$document', function($document) {
  return {
    restrict: 'E',
    scope: true,
    replace: true,
    link: function($scope, $element){
      var keyUp = function(e) {
        if(e.which == 27) {
          $scope.cancel();
          $scope.$apply();
        }
      };

      var backdropClick = function(e) {
        if(e.target == $element[0]) {
          $scope.cancel();
          $scope.$apply();
        }
      };
      $scope.$on('$destroy', function() {
        $element.remove();
        $document.unbind('keyup', keyUp);
      });

      $document.bind('keyup', keyUp);
      $element.bind('click', backdropClick);
    },
    template: '<div class="action-sheet-backdrop">' +
                '<div class="action-sheet-wrapper">' +
                  '<div class="action-sheet">' +
                    '<div class="action-sheet-group">' +
                      '<div class="action-sheet-title" ng-if="titleText" ng-bind-html="titleText"></div>' +
                      '<button class="button" ng-click="buttonClicked($index)" ng-repeat="button in buttons" ng-bind-html="button.text"></button>' +
                    '</div>' +
                    '<div class="action-sheet-group" ng-if="destructiveText">' +
                      '<button class="button destructive" ng-click="destructiveButtonClicked()" ng-bind-html="destructiveText"></button>' +
                    '</div>' +
                    '<div class="action-sheet-group" ng-if="cancelText">' +
                      '<button class="button" ng-click="cancel()" ng-bind-html="cancelText"></button>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>'
  };
}]);


/**
 * @ngdoc directive
 * @name ionCheckbox
 * @module ionic
 * @restrict E
 * @codepen hqcju
 * @description
 * The checkbox is no different than the HTML checkbox input, except it's styled differently.
 *
 * The checkbox behaves like any [AngularJS checkbox](http://docs.angularjs.org/api/ng/input/input[checkbox]).
 *
 * @usage
 * ```html
 * <ion-checkbox ng-model="isChecked">Checkbox Label</ion-checkbox>
 * ```
 */

IonicModule
.directive('ionCheckbox', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    transclude: true,
    template:
      '<label class="item item-checkbox">' +
        '<div class="checkbox checkbox-input-hidden disable-pointer-events">' +
          '<input type="checkbox">' +
          '<i class="checkbox-icon"></i>' +
        '</div>' +
        '<div class="item-content disable-pointer-events" ng-transclude></div>' +
      '</label>',
    compile: function(element, attr) {
      var input = element.find('input');
      forEach({
        'name': attr.name,
        'ng-value': attr.ngValue,
        'ng-model': attr.ngModel,
        'ng-checked': attr.ngChecked,
        'ng-disabled': attr.ngDisabled,
        'ng-true-value': attr.ngTrueValue,
        'ng-false-value': attr.ngFalseValue,
        'ng-change': attr.ngChange
      }, function(value, name) {
        if (isDefined(value)) {
          input.attr(name, value);
        }
      });
    }

  };
});

/**
 * @ngdoc directive
 * @module ionic
 * @name collectionRepeat
 * @restrict A
 * @codepen mFygh
 * @description
 * `collection-repeat` is a directive that allows you to render lists with
 * thousands of items in them, and experience little to no performance penalty.
 *
 * Demo:
 *
 * The directive renders onto the screen only the items that should be currently visible.
 * So if you have 1,000 items in your list but only ten fit on your screen,
 * collection-repeat will only render into the DOM the ten that are in the current
 * scroll position.
 *
 * Here are a few things to keep in mind while using collection-repeat:
 *
 * 1. The data supplied to collection-repeat must be an array.
 * 2. You must explicitly tell the directive what size your items will be in the DOM, using directive attributes.
 * Pixel amounts or percentages are allowed (see below).
 * 3. The elements rendered will be absolutely positioned: be sure to let your CSS work with
 * this (see below).
 * 4. Each collection-repeat list will take up all of its parent scrollView's space.
 * If you wish to have multiple lists on one page, put each list within its own
 * {@link ionic.directive:ionScroll ionScroll} container.
 * 5. You should not use the ng-show and ng-hide directives on your ion-content/ion-scroll elements that
 * have a collection-repeat inside.  ng-show and ng-hide apply the `display: none` css rule to the content's
 * style, causing the scrollView to read the width and height of the content as 0.  Resultingly,
 * collection-repeat will render elements that have just been un-hidden incorrectly.
 *
 *
 * @usage
 *
 * #### Basic Usage (single rows of items)
 *
 * Notice two things here: we use ng-style to set the height of the item to match
 * what the repeater thinks our item height is.  Additionally, we add a css rule
 * to make our item stretch to fit the full screen (since it will be absolutely
 * positioned).
 *
 * ```html
 * <ion-content ng-controller="ContentCtrl">
 *   <div class="list">
 *     <div class="item my-item"
 *       collection-repeat="item in items"
 *       collection-item-width="'100%'"
 *       collection-item-height="getItemHeight(item, $index)"
 *       ng-style="{height: getItemHeight(item, $index)}">
 *       {% raw %}{{item}}{% endraw %}
 *     </div>
 *   </div>
 * </div>
 * ```
 * ```js
 * function ContentCtrl($scope) {
 *   $scope.items = [];
 *   for (var i = 0; i < 1000; i++) {
 *     $scope.items.push('Item ' + i);
 *   }
 *
 *   $scope.getItemHeight = function(item, index) {
 *     //Make evenly indexed items be 10px taller, for the sake of example
 *     return (index % 2) === 0 ? 50 : 60;
 *   };
 * }
 * ```
 * ```css
 * .my-item {
 *   left: 0;
 *   right: 0;
 * }
 * ```
 *
 * #### Grid Usage (three items per row)
 *
 * ```html
 * <ion-content>
 *   <div class="item item-avatar my-image-item"
 *     collection-repeat="image in images"
 *     collection-item-width="'33%'"
 *     collection-item-height="'33%'">
 *     <img ng-src="{{image.src}}">
 *   </div>
 * </ion-content>
 * ```
 * Percentage of total visible list dimensions. This example shows a 3 by 3 matrix that fits on the screen (3 rows and 3 colums). Note that dimensions are used in the creation of the element and therefore a measurement of the item cannnot be used as an input dimension.
 * ```css
 * .my-image-item img {
 *   height: 33%;
 *   width: 33%;
 * }
 * ```
 *
 * @param {expression} collection-repeat The expression indicating how to enumerate a collection. These
 *   formats are currently supported:
 *
 *   * `variable in expression` – where variable is the user defined loop variable and `expression`
 *     is a scope expression giving the collection to enumerate.
 *
 *     For example: `album in artist.albums`.
 *
 *   * `variable in expression track by tracking_expression` – You can also provide an optional tracking function
 *     which can be used to associate the objects in the collection with the DOM elements. If no tracking function
 *     is specified the collection-repeat associates elements by identity in the collection. It is an error to have
 *     more than one tracking function to resolve to the same key. (This would mean that two distinct objects are
 *     mapped to the same DOM element, which is not possible.)  Filters should be applied to the expression,
 *     before specifying a tracking expression.
 *
 *     For example: `item in items` is equivalent to `item in items track by $id(item)'. This implies that the DOM elements
 *     will be associated by item identity in the array.
 *
 *     For example: `item in items track by $id(item)`. A built in `$id()` function can be used to assign a unique
 *     `$$hashKey` property to each item in the array. This property is then used as a key to associated DOM elements
 *     with the corresponding item in the array by identity. Moving the same object in array would move the DOM
 *     element in the same way in the DOM.
 *
 *     For example: `item in items track by item.id` is a typical pattern when the items come from the database. In this
 *     case the object identity does not matter. Two objects are considered equivalent as long as their `id`
 *     property is same.
 *
 *     For example: `item in items | filter:searchText track by item.id` is a pattern that might be used to apply a filter
 *     to items in conjunction with a tracking expression.
 *
 * @param {expression} collection-item-width The width of the repeated element.  Can be a number (in pixels) or a percentage.
 * @param {expression} collection-item-height The height of the repeated element.  Can be a number (in pixels), or a percentage.
 *
 */
var COLLECTION_REPEAT_SCROLLVIEW_XY_ERROR = "Cannot create a collection-repeat within a scrollView that is scrollable on both x and y axis.  Choose either x direction or y direction.";
var COLLECTION_REPEAT_ATTR_HEIGHT_ERROR = "collection-repeat expected attribute collection-item-height to be a an expression that returns a number (in pixels) or percentage.";
var COLLECTION_REPEAT_ATTR_WIDTH_ERROR = "collection-repeat expected attribute collection-item-width to be a an expression that returns a number (in pixels) or percentage.";
var COLLECTION_REPEAT_ATTR_REPEAT_ERROR = "collection-repeat expected expression in form of '_item_ in _collection_[ track by _id_]' but got '%'";

IonicModule
.directive('collectionRepeat', [
  '$collectionRepeatManager',
  '$collectionDataSource',
  '$parse',
function($collectionRepeatManager, $collectionDataSource, $parse) {
  return {
    priority: 1000,
    transclude: 'element',
    terminal: true,
    $$tlb: true,
    require: '^$ionicScroll',
    controller: [function(){}],
    link: function($scope, $element, $attr, scrollCtrl, $transclude) {
      var wrap = jqLite('<div style="position:relative;">');
      $element.parent()[0].insertBefore(wrap[0], $element[0]);
      wrap.append($element);

      var scrollView = scrollCtrl.scrollView;
      if (scrollView.options.scrollingX && scrollView.options.scrollingY) {
        throw new Error(COLLECTION_REPEAT_SCROLLVIEW_XY_ERROR);
      }

      var isVertical = !!scrollView.options.scrollingY;
      if (isVertical && !$attr.collectionItemHeight) {
        throw new Error(COLLECTION_REPEAT_ATTR_HEIGHT_ERROR);
      } else if (!isVertical && !$attr.collectionItemWidth) {
        throw new Error(COLLECTION_REPEAT_ATTR_WIDTH_ERROR);
      }

      var heightParsed = $parse($attr.collectionItemHeight || '"100%"');
      var widthParsed = $parse($attr.collectionItemWidth || '"100%"');

      var heightGetter = function(scope, locals) {
        var result = heightParsed(scope, locals);
        if (isString(result) && result.indexOf('%') > -1) {
          return Math.floor(parseInt(result, 10) / 100 * scrollView.__clientHeight);
        }
        return result;
      };
      var widthGetter = function(scope, locals) {
        var result = widthParsed(scope, locals);
        if (isString(result) && result.indexOf('%') > -1) {
          return Math.floor(parseInt(result, 10) / 100 * scrollView.__clientWidth);
        }
        return result;
      };

      var match = $attr.collectionRepeat.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
      if (!match) {
        throw new Error(COLLECTION_REPEAT_ATTR_REPEAT_ERROR
                        .replace('%', $attr.collectionRepeat));
      }
      var keyExpr = match[1];
      var listExpr = match[2];
      var trackByExpr = match[3];

      var dataSource = new $collectionDataSource({
        scope: $scope,
        transcludeFn: $transclude,
        transcludeParent: $element.parent(),
        keyExpr: keyExpr,
        listExpr: listExpr,
        trackByExpr: trackByExpr,
        heightGetter: heightGetter,
        widthGetter: widthGetter
      });
      var collectionRepeatManager = new $collectionRepeatManager({
        dataSource: dataSource,
        element: scrollCtrl.$element,
        scrollView: scrollCtrl.scrollView,
      });

      $scope.$watchCollection(listExpr, function(value) {
        if (value && !angular.isArray(value)) {
          throw new Error("collection-repeat expects an array to repeat over, but instead got '" + typeof value + "'.");
        }
        rerender(value);
      });

      // Find every sibling before and after the repeated items, and pass them
      // to the dataSource
      var scrollViewContent = scrollCtrl.scrollView.__content;
      function rerender(value) {
        var beforeSiblings = [];
        var afterSiblings = [];
        var before = true;

        forEach(scrollViewContent.children, function(node, i) {
          if ( ionic.DomUtil.elementIsDescendant($element[0], node, scrollViewContent) ) {
            before = false;
          } else {
            if (node.hasAttribute('collection-repeat-ignore')) return;
            var width = node.offsetWidth;
            var height = node.offsetHeight;
            if (width && height) {
              var element = jqLite(node);
              (before ? beforeSiblings : afterSiblings).push({
                width: node.offsetWidth,
                height: node.offsetHeight,
                element: element,
                scope: element.isolateScope() || element.scope(),
                isOutside: true
              });
            }
          }
        });

        scrollView.resize();
        dataSource.setData(value, beforeSiblings, afterSiblings);
        collectionRepeatManager.resize();
      }
      function rerenderOnResize() {
        rerender($scope.$eval(listExpr));
      }

      scrollCtrl.$element.on('scroll.resize', rerenderOnResize);
      ionic.on('resize', rerenderOnResize, window);

      $scope.$on('$destroy', function() {
        collectionRepeatManager.destroy();
        dataSource.destroy();
        ionic.off('resize', rerenderOnResize, window);
      });
    }
  };
}])
.directive({
  ngSrc: collectionRepeatSrcDirective('ngSrc', 'src'),
  ngSrcset: collectionRepeatSrcDirective('ngSrcset', 'srcset'),
  ngHref: collectionRepeatSrcDirective('ngHref', 'href')
});

// Fix for #1674
// Problem: if an ngSrc or ngHref expression evaluates to a falsy value, it will
// not erase the previous truthy value of the href.
// In collectionRepeat, we re-use elements from before. So if the ngHref expression
// evaluates to truthy for item 1 and then falsy for item 2, if an element changes
// from representing item 1 to representing item 2, item 2 will still have
// item 1's href value.
// Solution:  erase the href or src attribute if ngHref/ngSrc are falsy.
function collectionRepeatSrcDirective(ngAttrName, attrName) {
  return [function() {
    return {
      priority: '99', // it needs to run after the attributes are interpolated
      link: function(scope, element, attr) {
        attr.$observe(ngAttrName, function(value) {
          if (!value) {
            element[0].removeAttribute(attrName);
          }
        });
      }
    };
  }];
}

/**
 * @ngdoc directive
 * @name ionContent
 * @module ionic
 * @delegate ionic.service:$ionicScrollDelegate
 * @restrict E
 *
 * @description
 * The ionContent directive provides an easy to use content area that can be configured
 * to use Ionic's custom Scroll View, or the built in overflow scrolling of the browser.
 *
 * While we recommend using the custom Scroll features in Ionic in most cases, sometimes
 * (for performance reasons) only the browser's native overflow scrolling will suffice,
 * and so we've made it easy to toggle between the Ionic scroll implementation and
 * overflow scrolling.
 *
 * You can implement pull-to-refresh with the {@link ionic.directive:ionRefresher}
 * directive, and infinite scrolling with the {@link ionic.directive:ionInfiniteScroll}
 * directive.
 *
 * Be aware that this directive gets its own child scope. If you do not understand why this
 * is important, you can read [https://docs.angularjs.org/guide/scope](https://docs.angularjs.org/guide/scope).
 *
 * @param {string=} delegate-handle The handle used to identify this scrollView
 * with {@link ionic.service:$ionicScrollDelegate}.
 * @param {string=} direction Which way to scroll. 'x' or 'y' or 'xy'. Default 'y'.
 * @param {boolean=} locking Whether to lock scrolling in one direction at a time. Useful to set to false when zoomed in or scrolling in two directions. Default true.
 * @param {boolean=} padding Whether to add padding to the content.
 * of the content.  Defaults to true on iOS, false on Android.
 * @param {boolean=} scroll Whether to allow scrolling of content.  Defaults to true.
 * @param {boolean=} overflow-scroll Whether to use overflow-scrolling instead of
 * Ionic scroll.
 * @param {boolean=} scrollbar-x Whether to show the horizontal scrollbar. Default true.
 * @param {boolean=} scrollbar-y Whether to show the vertical scrollbar. Default true.
 * @param {string=} start-y Initial vertical scroll position. Default 0.
 * of the content.  Defaults to true on iOS, false on Android.
 * @param {expression=} on-scroll Expression to evaluate when the content is scrolled.
 * @param {expression=} on-scroll-complete Expression to evaluate when a scroll action completes.
 * @param {boolean=} has-bouncing Whether to allow scrolling to bounce past the edges
 * of the content.  Defaults to true on iOS, false on Android.
 */
IonicModule
.directive('ionContent', [
  '$timeout',
  '$controller',
  '$ionicBind',
function($timeout, $controller, $ionicBind) {
  return {
    restrict: 'E',
    require: '^?ionNavView',
    scope: true,
    priority: 800,
    compile: function(element, attr) {
      var innerElement;

      element.addClass('scroll-content ionic-scroll');

      if (attr.scroll != 'false') {
        //We cannot use normal transclude here because it breaks element.data()
        //inheritance on compile
        innerElement = jqLite('<div class="scroll"></div>');
        innerElement.append(element.contents());
        element.append(innerElement);
      } else {
        element.addClass('scroll-content-false');
      }

      return { pre: prelink };
      function prelink($scope, $element, $attr, navViewCtrl) {
        var parentScope = $scope.$parent;
        $scope.$watch(function() {
          return (parentScope.$hasHeader ? ' has-header' : '')  +
            (parentScope.$hasSubheader ? ' has-subheader' : '') +
            (parentScope.$hasFooter ? ' has-footer' : '') +
            (parentScope.$hasSubfooter ? ' has-subfooter' : '') +
            (parentScope.$hasTabs ? ' has-tabs' : '') +
            (parentScope.$hasTabsTop ? ' has-tabs-top' : '');
        }, function(className, oldClassName) {
          $element.removeClass(oldClassName);
          $element.addClass(className);
        });

        //Only this ionContent should use these variables from parent scopes
        $scope.$hasHeader = $scope.$hasSubheader =
          $scope.$hasFooter = $scope.$hasSubfooter =
          $scope.$hasTabs = $scope.$hasTabsTop =
          false;
        $ionicBind($scope, $attr, {
          $onScroll: '&onScroll',
          $onScrollComplete: '&onScrollComplete',
          hasBouncing: '@',
          padding: '@',
          direction: '@',
          scrollbarX: '@',
          scrollbarY: '@',
          startX: '@',
          startY: '@',
          scrollEventInterval: '@'
        });
        $scope.direction = $scope.direction || 'y';

        if (angular.isDefined($attr.padding)) {
          $scope.$watch($attr.padding, function(newVal) {
              (innerElement || $element).toggleClass('padding', !!newVal);
          });
        }

        if ($attr.scroll === "false") {
          //do nothing
        } else if(attr.overflowScroll === "true") {
          $element.addClass('overflow-scroll');
        } else {
          var scrollViewOptions = {
            el: $element[0],
            delegateHandle: attr.delegateHandle,
            locking: (attr.locking || 'true') === 'true',
            bouncing: $scope.$eval($scope.hasBouncing),
            startX: $scope.$eval($scope.startX) || 0,
            startY: $scope.$eval($scope.startY) || 0,
            scrollbarX: $scope.$eval($scope.scrollbarX) !== false,
            scrollbarY: $scope.$eval($scope.scrollbarY) !== false,
            scrollingX: $scope.direction.indexOf('x') >= 0,
            scrollingY: $scope.direction.indexOf('y') >= 0,
            scrollEventInterval: parseInt($scope.scrollEventInterval, 10) || 10,
            scrollingComplete: function() {
              $scope.$onScrollComplete({
                scrollTop: this.__scrollTop,
                scrollLeft: this.__scrollLeft
              });
            }
          };
          $controller('$ionicScroll', {
            $scope: $scope,
            scrollViewOptions: scrollViewOptions
          });

          $scope.$on('$destroy', function() {
            scrollViewOptions.scrollingComplete = angular.noop;
            delete scrollViewOptions.el;
            innerElement = null;
            $element = null;
            attr.$$element = null;
          });
        }

      }
    }
  };
}]);

/**
 * @ngdoc directive
 * @name exposeAsideWhen
 * @module ionic
 * @restrict A
 * @parent ionic.directive:ionSideMenus
 *
 * @description
 * It is common for a tablet application to hide a menu when in portrait mode, but to show the
 * same menu on the left side when the tablet is in landscape mode. The `exposeAsideWhen` attribute
 * directive can be used to accomplish a similar interface.
 *
 * By default, side menus are hidden underneath its side menu content, and can be opened by either
 * swiping the content left or right, or toggling a button to show the side menu. However, by adding the
 * `exposeAsideWhen` attribute directive to an {@link ionic.directive:ionSideMenu} element directive,
 * a side menu can be given instructions on "when" the menu should be exposed (always viewable). For
 * example, the `expose-aside-when="large"` attribute will keep the side menu hidden when the viewport's
 * width is less than `768px`, but when the viewport's width is `768px` or greater, the menu will then
 * always be shown and can no longer be opened or closed like it could when it was hidden for smaller
 * viewports.
 *
 * Using `large` as the attribute's value is a shortcut value to `(min-width:768px)` since it is
 * the most common use-case. However, for added flexibility, any valid media query could be added
 * as the value, such as `(min-width:600px)` or even multiple queries such as
 * `(min-width:750px) and (max-width:1200px)`.

 * @usage
 * ```html
 * <ion-side-menus>
 *   <!-- Center content -->
 *   <ion-side-menu-content>
 *   </ion-side-menu-content>
 *
 *   <!-- Left menu -->
 *   <ion-side-menu expose-aside-when="large">
 *   </ion-side-menu>
 * </ion-side-menus>
 * ```
 * For a complete side menu example, see the
 * {@link ionic.directive:ionSideMenus} documentation.
 */
IonicModule
.directive('exposeAsideWhen', ['$window', function($window) {
  return {
    restrict: 'A',
    require: '^ionSideMenus',
    link: function($scope, $element, $attr, sideMenuCtrl) {

      function checkAsideExpose() {
        var mq = $attr.exposeAsideWhen == 'large' ? '(min-width:768px)' : $attr.exposeAsideWhen;
        sideMenuCtrl.exposeAside( $window.matchMedia(mq).matches );
        sideMenuCtrl.activeAsideResizing(false);
      }

      function onResize() {
        sideMenuCtrl.activeAsideResizing(true);
        debouncedCheck();
      }

      var debouncedCheck = ionic.debounce(function() {
        $scope.$apply(function(){
          checkAsideExpose();
        });
      }, 300, false);

      checkAsideExpose();

      ionic.on('resize', onResize, $window);

      $scope.$on('$destroy', function(){
        ionic.off('resize', onResize, $window);
      });

    }
  };
}]);


var GESTURE_DIRECTIVES = 'onHold onTap onTouch onRelease onDrag onDragUp onDragRight onDragDown onDragLeft onSwipe onSwipeUp onSwipeRight onSwipeDown onSwipeLeft'.split(' ');

GESTURE_DIRECTIVES.forEach(function(name) {
  IonicModule.directive(name, gestureDirective(name));
});


/**
 * @ngdoc directive
 * @name onHold
 * @module ionic
 * @restrict A
 *
 * @description
 * Touch stays at the same location for 500ms. Similar to long touch events available for AngularJS and jQuery.
 *
 * @usage
 * ```html
 * <button on-hold="onHold()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onTap
 * @module ionic
 * @restrict A
 *
 * @description
 * Quick touch at a location. If the duration of the touch goes
 * longer than 250ms it is no longer a tap gesture.
 *
 * @usage
 * ```html
 * <button on-tap="onTap()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onTouch
 * @module ionic
 * @restrict A
 *
 * @description
 * Called immediately when the user first begins a touch. This
 * gesture does not wait for a touchend/mouseup.
 *
 * @usage
 * ```html
 * <button on-touch="onTouch()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onRelease
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when the user ends a touch.
 *
 * @usage
 * ```html
 * <button on-release="onRelease()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onDrag
 * @module ionic
 * @restrict A
 *
 * @description
 * Move with one touch around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are
 * blocking you disable scrolling on that area.
 *
 * @usage
 * ```html
 * <button on-drag="onDrag()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onDragUp
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when the element is dragged up.
 *
 * @usage
 * ```html
 * <button on-drag-up="onDragUp()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onDragRight
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when the element is dragged to the right.
 *
 * @usage
 * ```html
 * <button on-drag-right="onDragRight()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onDragDown
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when the element is dragged down.
 *
 * @usage
 * ```html
 * <button on-drag-down="onDragDown()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onDragLeft
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when the element is dragged to the left.
 *
 * @usage
 * ```html
 * <button on-drag-left="onDragLeft()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onSwipe
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when a moving touch has a high velocity in any direction.
 *
 * @usage
 * ```html
 * <button on-swipe="onSwipe()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onSwipeUp
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when a moving touch has a high velocity moving up.
 *
 * @usage
 * ```html
 * <button on-swipe-up="onSwipeUp()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onSwipeRight
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when a moving touch has a high velocity moving to the right.
 *
 * @usage
 * ```html
 * <button on-swipe-right="onSwipeRight()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onSwipeDown
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when a moving touch has a high velocity moving down.
 *
 * @usage
 * ```html
 * <button on-swipe-down="onSwipeDown()" class="button">Test</button>
 * ```
 */


/**
 * @ngdoc directive
 * @name onSwipeLeft
 * @module ionic
 * @restrict A
 *
 * @description
 * Called when a moving touch has a high velocity moving to the left.
 *
 * @usage
 * ```html
 * <button on-swipe-left="onSwipeLeft()" class="button">Test</button>
 * ```
 */


function gestureDirective(directiveName) {
  return ['$ionicGesture', '$parse', function($ionicGesture, $parse) {
    var eventType = directiveName.substr(2).toLowerCase();

    return function(scope, element, attr) {
      var fn = $parse( attr[directiveName] );

      var listener = function(ev) {
        scope.$apply(function() {
          fn(scope, {
            $event: ev
          });
        });
      };

      var gesture = $ionicGesture.on(eventType, listener, element);

      scope.$on('$destroy', function() {
        $ionicGesture.off(gesture, eventType, listener);
      });
    };
  }];
}


IonicModule
.directive('ionHeaderBar', tapScrollToTopDirective())

/**
 * @ngdoc directive
 * @name ionHeaderBar
 * @module ionic
 * @restrict E
 *
 * @description
 * Adds a fixed header bar above some content.
 *
 * Can also be a subheader (lower down) if the 'bar-subheader' class is applied.
 * See [the header CSS docs](/docs/components/#subheader).
 *
 * Note: If you use ionHeaderBar in combination with ng-if, the surrounding content
 * will not align correctly.  This will be fixed soon.
 *
 * @param {string=} align-title Where to align the title.
 * Available: 'left', 'right', or 'center'.  Defaults to 'center'.
 * @param {boolean=} no-tap-scroll By default, the header bar will scroll the
 * content to the top when tapped.  Set no-tap-scroll to true to disable this
 * behavior.
 * Available: true or false.  Defaults to false.
 *
 * @usage
 * ```html
 * <ion-header-bar align-title="left" class="bar-positive">
 *   <div class="buttons">
 *     <button class="button" ng-click="doSomething()">Left Button</button>
 *   </div>
 *   <h1 class="title">Title!</h1>
 *   <div class="buttons">
 *     <button class="button">Right Button</button>
 *   </div>
 * </ion-header-bar>
 * <ion-content>
 *   Some content!
 * </ion-content>
 * ```
 */
.directive('ionHeaderBar', headerFooterBarDirective(true))

/**
 * @ngdoc directive
 * @name ionFooterBar
 * @module ionic
 * @restrict E
 *
 * @description
 * Adds a fixed footer bar below some content.
 *
 * Can also be a subfooter (higher up) if the 'bar-subfooter' class is applied.
 * See [the footer CSS docs](/docs/components/#footer).
 *
 * Note: If you use ionFooterBar in combination with ng-if, the surrounding content
 * will not align correctly.  This will be fixed soon.
 *
 * @param {string=} align-title Where to align the title.
 * Available: 'left', 'right', or 'center'.  Defaults to 'center'.
 *
 * @usage
 * ```html
 * <ion-content>
 *   Some content!
 * </ion-content>
 * <ion-footer-bar align-title="left" class="bar-assertive">
 *   <div class="buttons">
 *     <button class="button">Left Button</button>
 *   </div>
 *   <h1 class="title">Title!</h1>
 *   <div class="buttons" ng-click="doSomething()">
 *     <button class="button">Right Button</button>
 *   </div>
 * </ion-footer-bar>
 * ```
 */
.directive('ionFooterBar', headerFooterBarDirective(false));

function tapScrollToTopDirective() {
  return ['$ionicScrollDelegate', function($ionicScrollDelegate) {
    return {
      restrict: 'E',
      link: function($scope, $element, $attr) {
        if ($attr.noTapScroll == 'true') {
          return;
        }
        ionic.on('tap', onTap, $element[0]);
        $scope.$on('$destroy', function() {
          ionic.off('tap', onTap, $element[0]);
        });

        function onTap(e) {
          var depth = 3;
          var current = e.target;
          //Don't scroll to top in certain cases
          while (depth-- && current) {
            if (current.classList.contains('button') ||
                current.tagName.match(/input|textarea|select/i) ||
                current.isContentEditable) {
              return;
            }
            current = current.parentNode;
          }
          var touch = e.gesture && e.gesture.touches[0] || e.detail.touches[0];
          var bounds = $element[0].getBoundingClientRect();
          if (ionic.DomUtil.rectContains(
            touch.pageX, touch.pageY,
            bounds.left, bounds.top - 20,
            bounds.left + bounds.width, bounds.top + bounds.height
          )) {
            $ionicScrollDelegate.scrollTop(true);
          }
        }
      }
    };
  }];
}

function headerFooterBarDirective(isHeader) {
  return [function() {
    return {
      restrict: 'E',
      controller: '$ionHeaderBar',
      compile: function(tElement, $attr) {
        tElement.addClass(isHeader ? 'bar bar-header' : 'bar bar-footer');
        if (tElement[0].parentNode.querySelector('.tabs-top')) tElement.addClass('has-tabs-top');

        return { pre: prelink };
        function prelink($scope, $element, $attr) {
          if (isHeader) {
            $scope.$watch(function() { return $element[0].className; }, function(value) {
              var isShown = value.indexOf('ng-hide') === -1;
              var isSubheader = value.indexOf('bar-subheader') !== -1;
              $scope.$hasHeader = isShown && !isSubheader;
              $scope.$hasSubheader = isShown && isSubheader;
            });
            $scope.$on('$destroy', function() {
              delete $scope.$hasHeader;
              delete $scope.$hasSubheader;
            });
          } else {
            $scope.$watch(function() { return $element[0].className; }, function(value) {
              var isShown = value.indexOf('ng-hide') === -1;
              var isSubfooter = value.indexOf('bar-subfooter') !== -1;
              $scope.$hasFooter = isShown && !isSubfooter;
              $scope.$hasSubfooter = isShown && isSubfooter;
            });
            $scope.$on('$destroy', function() {
              delete $scope.$hasFooter;
              delete $scope.$hasSubfooter;
            });
            $scope.$watch('$hasTabs', function(val) {
              $element.toggleClass('has-tabs', !!val);
            });
          }
        }
      }
    };
  }];
}

/**
 * @ngdoc directive
 * @name ionInfiniteScroll
 * @module ionic
 * @parent ionic.directive:ionContent, ionic.directive:ionScroll
 * @restrict E
 *
 * @description
 * The ionInfiniteScroll directive allows you to call a function whenever
 * the user gets to the bottom of the page or near the bottom of the page.
 *
 * The expression you pass in for `on-infinite` is called when the user scrolls
 * greater than `distance` away from the bottom of the content.  Once `on-infinite`
 * is done loading new data, it should broadcast the `scroll.infiniteScrollComplete`
 * event from your controller (see below example).
 *
 * @param {expression} on-infinite What to call when the scroller reaches the
 * bottom.
 * @param {string=} distance The distance from the bottom that the scroll must
 * reach to trigger the on-infinite expression. Default: 1%.
 * @param {string=} icon The icon to show while loading. Default: 'ion-loading-d'.
 *
 * @usage
 * ```html
 * <ion-content ng-controller="MyController">
 *   <ion-list>
 *   ....
 *   ....
 *   </ion-list>
 *
 *   <ion-infinite-scroll
 *     on-infinite="loadMore()"
 *     distance="1%">
 *   </ion-infinite-scroll>
 * </ion-content>
 * ```
 * ```js
 * function MyController($scope, $http) {
 *   $scope.items = [];
 *   $scope.loadMore = function() {
 *     $http.get('/more-items').success(function(items) {
 *       useItems(items);
 *       $scope.$broadcast('scroll.infiniteScrollComplete');
 *     });
 *   };
 *
 *   $scope.$on('$stateChangeSuccess', function() {
 *     $scope.loadMore();
 *   });
 * }
 * ```
 *
 * An easy to way to stop infinite scroll once there is no more data to load
 * is to use angular's `ng-if` directive:
 *
 * ```html
 * <ion-infinite-scroll
 *   ng-if="moreDataCanBeLoaded()"
 *   icon="ion-loading-c"
 *   on-infinite="loadMoreData()">
 * </ion-infinite-scroll>
 * ```
 */
IonicModule
.directive('ionInfiniteScroll', ['$timeout', function($timeout) {
  function calculateMaxValue(distance, maximum, isPercent) {
    return isPercent ?
      maximum * (1 - parseFloat(distance,10) / 100) :
      maximum - parseFloat(distance, 10);
  }
  return {
    restrict: 'E',
    require: ['^$ionicScroll', 'ionInfiniteScroll'],
    template: '<i class="icon {{icon()}} icon-refreshing"></i>',
    scope: true,
    controller: ['$scope', '$attrs', function($scope, $attrs) {
      this.isLoading = false;
      this.scrollView = null; //given by link function
      this.getMaxScroll = function() {
        var distance = ($attrs.distance || '2.5%').trim();
        var isPercent = distance.indexOf('%') !== -1;
        var maxValues = this.scrollView.getScrollMax();
        return {
          left: this.scrollView.options.scrollingX ?
            calculateMaxValue(distance, maxValues.left, isPercent) :
            -1,
          top: this.scrollView.options.scrollingY ?
            calculateMaxValue(distance, maxValues.top, isPercent) :
            -1
        };
      };
    }],
    link: function($scope, $element, $attrs, ctrls) {
      var scrollCtrl = ctrls[0];
      var infiniteScrollCtrl = ctrls[1];
      var scrollView = infiniteScrollCtrl.scrollView = scrollCtrl.scrollView;

      $scope.icon = function() {
        return angular.isDefined($attrs.icon) ? $attrs.icon : 'ion-loading-d';
      };

      var onInfinite = function() {
        $element[0].classList.add('active');
        infiniteScrollCtrl.isLoading = true;
        $scope.$parent && $scope.$parent.$apply($attrs.onInfinite || '');
      };

      var finishInfiniteScroll = function() {
        $element[0].classList.remove('active');
        $timeout(function() {
          scrollView.resize();
          checkBounds();
        }, 0, false);
        infiniteScrollCtrl.isLoading = false;
      };

      $scope.$on('scroll.infiniteScrollComplete', function() {
        finishInfiniteScroll();
      });

      $scope.$on('$destroy', function() {
        if(scrollCtrl && scrollCtrl.$element)scrollCtrl.$element.off('scroll', checkBounds);
      });

      var checkBounds = ionic.animationFrameThrottle(checkInfiniteBounds);

      //Check bounds on start, after scrollView is fully rendered
      setTimeout(checkBounds);
      scrollCtrl.$element.on('scroll', checkBounds);

      function checkInfiniteBounds() {
        if (infiniteScrollCtrl.isLoading) return;

        var scrollValues = scrollView.getValues();
        var maxScroll = infiniteScrollCtrl.getMaxScroll();

        if ((maxScroll.left !== -1 && scrollValues.left >= maxScroll.left) ||
            (maxScroll.top !== -1 && scrollValues.top >= maxScroll.top)) {
          onInfinite();
        }
      }
    }
  };
}]);

var ITEM_TPL_CONTENT_ANCHOR =
  '<a class="item-content" ng-href="{{$href()}}" target="{{$target()}}"></a>';
var ITEM_TPL_CONTENT =
  '<div class="item-content"></div>';
/**
* @ngdoc directive
* @name ionItem
* @parent ionic.directive:ionList
* @module ionic
* @restrict E
* Creates a list-item that can easily be swiped,
* deleted, reordered, edited, and more.
*
* See {@link ionic.directive:ionList} for a complete example & explanation.
*
* Can be assigned any item class name. See the
* [list CSS documentation](/docs/components/#list).
*
* @usage
*
* ```html
* <ion-list>
*   <ion-item>Hello!</ion-item>
*   <ion-item href="#/detail">
*     Link to detail page
*   <ion-item>
* </ion-list>
* ```
*/
IonicModule
.directive('ionItem',
function() {
  return {
    restrict: 'E',
    controller: ['$scope', '$element', function($scope, $element) {
      this.$scope = $scope;
      this.$element = $element;
    }],
    scope: true,
    compile: function($element, $attrs) {
      var isAnchor = angular.isDefined($attrs.href) ||
        angular.isDefined($attrs.ngHref) ||
        angular.isDefined($attrs.uiSref);
      var isComplexItem = isAnchor ||
        //Lame way of testing, but we have to know at compile what to do with the element
        /ion-(delete|option|reorder)-button/i.test($element.html());

        if (isComplexItem) {
          var innerElement = jqLite(isAnchor ? ITEM_TPL_CONTENT_ANCHOR : ITEM_TPL_CONTENT);
          innerElement.append($element.contents());

          $element.append(innerElement);
          $element.addClass('item item-complex');
        } else {
          $element.addClass('item');
        }

        return function link($scope, $element, $attrs) {
          $scope.$href = function() {
            return $attrs.href || $attrs.ngHref;
          };
          $scope.$target = function() {
            return $attrs.target || '_self';
          };
        };
    }
  };
});

var ITEM_TPL_DELETE_BUTTON =
  '<div class="item-left-edit item-delete enable-pointer-events">' +
  '</div>';
/**
* @ngdoc directive
* @name ionDeleteButton
* @parent ionic.directive:ionItem
* @module ionic
* @restrict E
* Creates a delete button inside a list item, that is visible when the
* {@link ionic.directive:ionList ionList parent's} `show-delete` evaluates to true or
* `$ionicListDelegate.showDelete(true)` is called.
*
* Takes any ionicon as a class.
*
* See {@link ionic.directive:ionList} for a complete example & explanation.
*
* @usage
*
* ```html
* <ion-list show-delete="shouldShowDelete">
*   <ion-item>
*     <ion-delete-button class="ion-minus-circled"></ion-delete-button>
*     Hello, list item!
*   </ion-item>
* </ion-list>
* <ion-toggle ng-model="shouldShowDelete">
*   Show Delete?
* </ion-toggle>
* ```
*/
IonicModule
.directive('ionDeleteButton', function() {
  return {
    restrict: 'E',
    require: ['^ionItem', '^?ionList'],
    //Run before anything else, so we can move it before other directives process
    //its location (eg ngIf relies on the location of the directive in the dom)
    priority: Number.MAX_VALUE,
    compile: function($element, $attr) {
      //Add the classes we need during the compile phase, so that they stay
      //even if something else like ngIf removes the element and re-addss it
      $attr.$set('class', ($attr['class'] || '') + ' button icon button-icon', true);
      return function($scope, $element, $attr, ctrls) {
        var itemCtrl = ctrls[0];
        var listCtrl = ctrls[1];
        var container = jqLite(ITEM_TPL_DELETE_BUTTON);
        container.append($element);
        itemCtrl.$element.append(container).addClass('item-left-editable');

        if (listCtrl && listCtrl.showDelete()) {
          container.addClass('visible active');
        }
      };
    }
  };
});


IonicModule
.directive('itemFloatingLabel', function() {
  return {
    restrict: 'C',
    link: function(scope, element) {
      var el = element[0];
      var input = el.querySelector('input, textarea');
      var inputLabel = el.querySelector('.input-label');

      if ( !input || !inputLabel ) return;

      var onInput = function() {
        if ( input.value ) {
          inputLabel.classList.add('has-input');
        } else {
          inputLabel.classList.remove('has-input');
        }
      };

      input.addEventListener('input', onInput);

      var ngModelCtrl = angular.element(input).controller('ngModel');
      if ( ngModelCtrl ) {
        ngModelCtrl.$render = function() {
          input.value = ngModelCtrl.$viewValue || '';
          onInput();
        };
      }

      scope.$on('$destroy', function() {
        input.removeEventListener('input', onInput);
      });
    }
  };
});

var ITEM_TPL_OPTION_BUTTONS =
  '<div class="item-options invisible">' +
  '</div>';
/**
* @ngdoc directive
* @name ionOptionButton
* @parent ionic.directive:ionItem
* @module ionic
* @restrict E
* Creates an option button inside a list item, that is visible when the item is swiped
* to the left by the user.  Swiped open option buttons can be hidden with
* {@link ionic.service:$ionicListDelegate#closeOptionButtons $ionicListDelegate#closeOptionButtons}.
*
* Can be assigned any button class.
*
* See {@link ionic.directive:ionList} for a complete example & explanation.
*
* @usage
*
* ```html
* <ion-list>
*   <ion-item>
*     I love kittens!
*     <ion-option-button class="button-positive">Share</ion-option-button>
*     <ion-option-button class="button-assertive">Edit</ion-option-button>
*   </ion-item>
* </ion-list>
* ```
*/
IonicModule
.directive('ionOptionButton', ['$compile', function($compile) {
  function stopPropagation(e) {
    e.stopPropagation();
  }
  return {
    restrict: 'E',
    require: '^ionItem',
    priority: Number.MAX_VALUE,
    compile: function($element, $attr) {
      $attr.$set('class', ($attr['class'] || '') + ' button', true);
      return function($scope, $element, $attr, itemCtrl) {
        if (!itemCtrl.optionsContainer) {
          itemCtrl.optionsContainer = jqLite(ITEM_TPL_OPTION_BUTTONS);
          itemCtrl.$element.append(itemCtrl.optionsContainer);
        }
        itemCtrl.optionsContainer.append($element);

        //Don't bubble click up to main .item
        $element.on('click', stopPropagation);
      };
    }
  };
}]);

var ITEM_TPL_REORDER_BUTTON =
  '<div data-prevent-scroll="true" class="item-right-edit item-reorder enable-pointer-events">' +
  '</div>';

/**
* @ngdoc directive
* @name ionReorderButton
* @parent ionic.directive:ionItem
* @module ionic
* @restrict E
* Creates a reorder button inside a list item, that is visible when the
* {@link ionic.directive:ionList ionList parent's} `show-reorder` evaluates to true or
* `$ionicListDelegate.showReorder(true)` is called.
*
* Can be dragged to reorder items in the list. Takes any ionicon class.
*
* Note: Reordering works best when used with `ng-repeat`.  Be sure that all `ion-item` children of an `ion-list` are part of the same `ng-repeat` expression.
*
* When an item reorder is complete, the expression given in the `on-reorder` attribute is called. The `on-reorder` expression is given two locals that can be used: `$fromIndex` and `$toIndex`.  See below for an example.
*
* Look at {@link ionic.directive:ionList} for more examples.
*
* @usage
*
* ```html
* <ion-list ng-controller="MyCtrl" show-reorder="true">
*   <ion-item ng-repeat="item in items">
*     Item {{item}}
*     <ion-reorder-button class="ion-navicon"
*                         on-reorder="moveItem(item, $fromIndex, $toIndex)">
*     </ion-reorder-button>
*   </ion-item>
* </ion-list>
* ```
* ```js
* function MyCtrl($scope) {
*   $scope.items = [1, 2, 3, 4];
*   $scope.moveItem = function(item, fromIndex, toIndex) {
*     //Move the item in the array
*     $scope.items.splice(fromIndex, 1);
*     $scope.items.splice(toIndex, 0, item);
*   };
* }
* ```
*
* @param {expression=} on-reorder Expression to call when an item is reordered.
* Parameters given: $fromIndex, $toIndex.
*/
IonicModule
.directive('ionReorderButton', ['$parse', function($parse) {
  return {
    restrict: 'E',
    require: ['^ionItem', '^?ionList'],
    priority: Number.MAX_VALUE,
    compile: function($element, $attr) {
      $attr.$set('class', ($attr['class'] || '') + ' button icon button-icon', true);
      $element[0].setAttribute('data-prevent-scroll', true);
      return function($scope, $element, $attr, ctrls) {
        var itemCtrl = ctrls[0];
        var listCtrl = ctrls[1];
        var onReorderFn = $parse($attr.onReorder);

        $scope.$onReorder = function(oldIndex, newIndex) {
          onReorderFn($scope, {
            $fromIndex: oldIndex,
            $toIndex: newIndex
          });
        };

        // prevent clicks from bubbling up to the item
        if(!$attr.ngClick && !$attr.onClick && !$attr.onclick){
          $element[0].onclick = function(e){e.stopPropagation(); return false;};
        }

        var container = jqLite(ITEM_TPL_REORDER_BUTTON);
        container.append($element);
        itemCtrl.$element.append(container).addClass('item-right-editable');

        if (listCtrl && listCtrl.showReorder()) {
          container.addClass('visible active');
        }
      };
    }
  };
}]);

/**
 * @ngdoc directive
 * @name keyboardAttach
 * @module ionic
 * @restrict A
 *
 * @description
 * keyboard-attach is an attribute directive which will cause an element to float above
 * the keyboard when the keyboard shows. Currently only supports the
 * [ion-footer-bar]({{ page.versionHref }}/api/directive/ionFooterBar/) directive.
 *
 * ### Notes
 * - This directive requires the
 * [Ionic Keyboard Plugin](https://github.com/driftyco/ionic-plugins-keyboard).
 * - On Android not in fullscreen mode, i.e. you have
 *   `<preference name="Fullscreen" value="false" />` or no preference in your `config.xml` file,
 *   this directive is unnecessary since it is the default behavior.
 * - On iOS, if there is an input in your footer, you will need to set
 *   `cordova.plugins.Keyboard.disableScroll(true)`.
 *
 * @usage
 *
 * ```html
 *  <ion-footer-bar align-title="left" keyboard-attach class="bar-assertive">
 *    <h1 class="title">Title!</h1>
 *  </ion-footer-bar>
 * ```
 */

IonicModule
.directive('keyboardAttach', function() {
  return function(scope, element, attrs) {
    ionic.on('native.keyboardshow', onShow, window);
    ionic.on('native.keyboardhide', onHide, window);

    //deprecated
    ionic.on('native.showkeyboard', onShow, window);
    ionic.on('native.hidekeyboard', onHide, window);


    var scrollCtrl;

    function onShow(e) {
      if (ionic.Platform.isAndroid() && !ionic.Platform.isFullScreen) {
        return;
      }

      //for testing
      var keyboardHeight = e.keyboardHeight || e.detail.keyboardHeight;
      element.css('bottom', keyboardHeight + "px");
      scrollCtrl = element.controller('$ionicScroll');
      if ( scrollCtrl ) {
        scrollCtrl.scrollView.__container.style.bottom = keyboardHeight + keyboardAttachGetClientHeight(element[0]) + "px";
      }
    }

    function onHide() {
      if (ionic.Platform.isAndroid() && !ionic.Platform.isFullScreen) {
        return;
      }

      element.css('bottom', '');
      if ( scrollCtrl ) {
        scrollCtrl.scrollView.__container.style.bottom = '';
      }
    }

    scope.$on('$destroy', function() {
      ionic.off('native.keyboardshow', onShow, window);
      ionic.off('native.keyboardhide', onHide, window);

      //deprecated
      ionic.off('native.showkeyboard', onShow, window);
      ionic.off('native.hidekeyboard', onHide, window);
    });
  };
});

function keyboardAttachGetClientHeight(element) {
  return element.clientHeight;
}

/**
* @ngdoc directive
* @name ionList
* @module ionic
* @delegate ionic.service:$ionicListDelegate
* @codepen JsHjf
* @restrict E
* @description
* The List is a widely used interface element in almost any mobile app, and can include
* content ranging from basic text all the way to buttons, toggles, icons, and thumbnails.
*
* Both the list, which contains items, and the list items themselves can be any HTML
* element. The containing element requires the `list` class and each list item requires
* the `item` class.
*
* However, using the ionList and ionItem directives make it easy to support various
* interaction modes such as swipe to edit, drag to reorder, and removing items.
*
* Related: {@link ionic.directive:ionItem}, {@link ionic.directive:ionOptionButton}
* {@link ionic.directive:ionReorderButton}, {@link ionic.directive:ionDeleteButton}, [`list CSS documentation`](/docs/components/#list).
*
* @usage
*
* Basic Usage:
*
* ```html
* <ion-list>
*   <ion-item ng-repeat="item in items">
*     {% raw %}Hello, {{item}}!{% endraw %}
*   </ion-item>
* </ion-list>
* ```
*
* Advanced Usage: Thumbnails, Delete buttons, Reordering, Swiping
*
* ```html
* <ion-list ng-controller="MyCtrl"
*           show-delete="shouldShowDelete"
*           show-reorder="shouldShowReorder"
*           can-swipe="listCanSwipe">
*   <ion-item ng-repeat="item in items"
*             class="item-thumbnail-left">
*
*     {% raw %}<img ng-src="{{item.img}}">
*     <h2>{{item.title}}</h2>
*     <p>{{item.description}}</p>{% endraw %}
*     <ion-option-button class="button-positive"
*                        ng-click="share(item)">
*       Share
*     </ion-option-button>
*     <ion-option-button class="button-info"
*                        ng-click="edit(item)">
*       Edit
*     </ion-option-button>
*     <ion-delete-button class="ion-minus-circled"
*                        ng-click="items.splice($index, 1)">
*     </ion-delete-button>
*     <ion-reorder-button class="ion-navicon"
*                         on-reorder="reorderItem(item, $fromIndex, $toIndex)">
*     </ion-reorder-button>
*
*   </ion-item>
* </ion-list>
* ```
*
* @param {string=} delegate-handle The handle used to identify this list with
* {@link ionic.service:$ionicListDelegate}.
* @param type {string=} The type of list to use (list-inset or card)
* @param show-delete {boolean=} Whether the delete buttons for the items in the list are
* currently shown or hidden.
* @param show-reorder {boolean=} Whether the reorder buttons for the items in the list are
* currently shown or hidden.
* @param can-swipe {boolean=} Whether the items in the list are allowed to be swiped to reveal
* option buttons. Default: true.
*/
IonicModule
.directive('ionList', [
  '$timeout',
function($timeout) {
  return {
    restrict: 'E',
    require: ['ionList', '^?$ionicScroll'],
    controller: '$ionicList',
    compile: function($element, $attr) {
      var listEl = jqLite('<div class="list">')
      .append( $element.contents() )
      .addClass($attr.type);
      $element.append(listEl);

      return function($scope, $element, $attrs, ctrls) {
        var listCtrl = ctrls[0];
        var scrollCtrl = ctrls[1];

        //Wait for child elements to render...
        $timeout(init);

        function init() {
          var listView = listCtrl.listView = new ionic.views.ListView({
            el: $element[0],
            listEl: $element.children()[0],
            scrollEl: scrollCtrl && scrollCtrl.element,
            scrollView: scrollCtrl && scrollCtrl.scrollView,
            onReorder: function(el, oldIndex, newIndex) {
              var itemScope = jqLite(el).scope();
              if (itemScope && itemScope.$onReorder) {
                //Make sure onReorder is called in apply cycle,
                //but also make sure it has no conflicts by doing
                //$evalAsync
                $timeout(function() {
                  itemScope.$onReorder(oldIndex, newIndex);
                });
              }
            },
            canSwipe: function() {
              return listCtrl.canSwipeItems();
            }
          });

          $scope.$on('$destroy', function() {
            if(listView) {
              listView.deregister && listView.deregister();
              listView = null;
            }
          });

          if (isDefined($attr.canSwipe)) {
            $scope.$watch('!!(' + $attr.canSwipe + ')', function(value) {
              listCtrl.canSwipeItems(value);
            });
          }
          if (isDefined($attr.showDelete)) {
            $scope.$watch('!!(' + $attr.showDelete + ')', function(value) {
              listCtrl.showDelete(value);
            });
          }
          if (isDefined($attr.showReorder)) {
            $scope.$watch('!!(' + $attr.showReorder + ')', function(value) {
              listCtrl.showReorder(value);
            });
          }

          $scope.$watch(function() {
            return listCtrl.showDelete();
          }, function(isShown, wasShown) {
            //Only use isShown=false if it was already shown
            if (!isShown && !wasShown) { return; }

            if (isShown) listCtrl.closeOptionButtons();
            listCtrl.canSwipeItems(!isShown);

            $element.children().toggleClass('list-left-editing', isShown);
            $element.toggleClass('disable-pointer-events', isShown);

            var deleteButton = jqLite($element[0].getElementsByClassName('item-delete'));
            setButtonShown(deleteButton, listCtrl.showDelete);
          });

          $scope.$watch(function() {
            return listCtrl.showReorder();
          }, function(isShown, wasShown) {
            //Only use isShown=false if it was already shown
            if (!isShown && !wasShown) { return; }

            if (isShown) listCtrl.closeOptionButtons();
            listCtrl.canSwipeItems(!isShown);

            $element.children().toggleClass('list-right-editing', isShown);
            $element.toggleClass('disable-pointer-events', isShown);

            var reorderButton = jqLite($element[0].getElementsByClassName('item-reorder'));
            setButtonShown(reorderButton, listCtrl.showReorder);
          });

          function setButtonShown(el, shown) {
            shown() && el.addClass('visible') || el.removeClass('active');
            ionic.requestAnimationFrame(function() {
              shown() && el.addClass('active') || el.removeClass('visible');
            });
          }
        }

      };
    }
  };
}]);

/**
 * @ngdoc directive
 * @name menuClose
 * @module ionic
 * @restrict AC
 *
 * @description
 * Closes a side menu which is currently opened. By default, navigation
 * transitions will not animate between views when the menu is open and
 * this directive is used to close the menu.
 *
 * @usage
 * Below is an example of a link within a side menu. Tapping this link would
 * automatically close the currently opened menu.
 *
 * ```html
 * <a menu-close href="#/home" class="item">Home</a>
 * ```
 */
IonicModule
.directive('menuClose', ['$ionicViewSwitcher', function($ionicViewSwitcher) {
  return {
    restrict: 'AC',
    link: function($scope, $element, $attr) {
      $element.bind('click', function(){
        // lower priority than navAnimation which allows navAnimation
        // to override this directives nextAnimation() call
        $ionicViewSwitcher.nextTransition('none');
        var sideMenuCtrl = $element.inheritedData('$ionSideMenusController');
        sideMenuCtrl && sideMenuCtrl.close();
      });
    }
  };
}]);

/**
 * @ngdoc directive
 * @name menuToggle
 * @module ionic
 * @restrict AC
 *
 * @description
 * Toggle a side menu on the given side.
 *
 * @usage
 * Below is an example of a link within a nav bar. Tapping this button
 * would open the given side menu, and tapping it again would close it.
 *
 * ```html
 * <ion-view>
 *   <ion-nav-buttons side="left">
 *    <button menu-toggle="left" class="button button-icon icon ion-navicon"></button>
 *   </ion-nav-buttons>
 *  ...
 * </ion-view>
 * ```
 */
IonicModule
.directive('menuToggle', function() {
  return {
    restrict: 'AC',
    link: function($scope, $element, $attr) {
      $element.bind('click', function(){
        var sideMenuCtrl = $element.inheritedData('$ionSideMenusController');
        sideMenuCtrl && sideMenuCtrl.toggle($attr.menuToggle);
      });
    }
  };
});


/*
 * We don't document the ionModal directive, we instead document
 * the $ionicModal service
 */
IonicModule
.directive('ionModal', [function() {
  return {
    restrict: 'E',
    transclude: true,
    replace: true,
    controller: [function(){}],
    template: '<div class="modal-backdrop">' +
                '<div class="modal-wrapper" ng-transclude></div>' +
                '</div>'
  };
}]);

IonicModule
.directive('ionModalView', function() {
  return {
    restrict: 'E',
    compile: function(element, attr) {
      element.addClass('modal');
    }
  };
});

/**
 * @ngdoc directive
 * @name ionNavBackButton
 * @module ionic
 * @restrict E
 * @parent ionNavBar
 * @description
 * Creates a back button inside an {@link ionic.directive:ionNavBar}.
 *
 * Will show up when the user is able to go back in the current navigation stack.
 *
 * By default, will go back when clicked.  If you wish for more advanced behavior, see the
 * examples below.
 *
 * @usage
 *
 * With default click action:
 *
 * ```html
 * <ion-nav-bar>
 *   <ion-nav-back-button class="button-clear">
 *     <i class="ion-arrow-left-c"></i> Back
 *   </ion-nav-back-button>
 * </ion-nav-bar>
 * ```
 *
 * With custom click action, using {@link ionic.service:$ionicNavBarDelegate}:
 *
 * ```html
 * <ion-nav-bar ng-controller="MyCtrl">
 *   <ion-nav-back-button class="button-clear"
 *     ng-click="goBack()">
 *     <i class="ion-arrow-left-c"></i> Back
 *   </ion-nav-back-button>
 * </ion-nav-bar>
 * ```
 * ```js
 * function MyCtrl($scope, $ionicNavBarDelegate) {
 *   $scope.goBack = function() {
 *     $ionicNavBarDelegate.back();
 *   };
 * }
 * ```
 */
IonicModule
.directive('ionNavBackButton', ['$ionicConfig', '$document', function($ionicConfig, $document) {
  return {
    restrict: 'E',
    require: '^ionNavBar',
    compile: function(tElement, tAttrs) {

      // clone the back button, but as a <div>
      var buttonEle = $document[0].createElement('button');
      for (var n in tAttrs) {
        if (isString(tAttrs[n])) {
          buttonEle.setAttribute(n, tAttrs[n]);
        }
      }

      if (!tElement.attr('ng-click')) {
        buttonEle.setAttribute('ng-click', '$goBack()');
      }

      buttonEle.className = 'button back-button hide buttons';
      buttonEle.innerHTML = tElement.html() || '';

      var childNode;
      var hasIcon = hasIconClass(tElement[0]);
      var hasInnerText;
      var hasButtonText;
      var hasPreviousTitle;

      for (var x = 0; x < tElement[0].childNodes.length; x++) {
        childNode = tElement[0].childNodes[x];
        if (childNode.nodeType === 1) {
          if (hasIconClass(childNode)) {
            hasIcon = true;
          } else if (childNode.classList.contains('default-title')) {
            hasButtonText = true;
          } else if (childNode.classList.contains('previous-title')) {
            hasPreviousTitle = true;
          }
        } else if (!hasInnerText && childNode.nodeType === 3) {
          hasInnerText = !!childNode.nodeValue.trim();
        }
      }

      function hasIconClass(ele) {
        return /ion-|icon/.test(ele.className);
      }

      var defaultIcon = $ionicConfig.backButton.icon();
      if (!hasIcon && defaultIcon && defaultIcon !== 'none') {
        buttonEle.innerHTML = '<i class="icon ' + defaultIcon + '"></i> ' + buttonEle.innerHTML;
        buttonEle.className += ' button-clear';
      }

      if (!hasInnerText) {
        var buttonTextEle = $document[0].createElement('span');
        buttonTextEle.className = 'back-text';

        if (!hasButtonText && $ionicConfig.backButton.text()) {
          buttonTextEle.innerHTML += '<span class="default-title">' + $ionicConfig.backButton.text() + '</span>';
        }
        if (!hasPreviousTitle && $ionicConfig.backButton.previousTitleText()) {
          buttonTextEle.innerHTML += '<span class="previous-title"></span>';
        }
        buttonEle.appendChild(buttonTextEle);

      }

      tElement.attr('class', 'hide');
      tElement.empty();

      return {
        pre: function($scope, $element, $attr, navBarCtrl) {
          // only register the plain HTML, the navBarCtrl takes care of scope/compile/link
          navBarCtrl.navElement('backButton', buttonEle.outerHTML);
          buttonEle = null;
        }
      };
    }
  };
}]);


/**
 * @ngdoc directive
 * @name ionNavBar
 * @module ionic
 * @delegate ionic.service:$ionicNavBarDelegate
 * @restrict E
 *
 * @description
 * If we have an {@link ionic.directive:ionNavView} directive, we can also create an
 * `<ion-nav-bar>`, which will create a topbar that updates as the application state changes.
 *
 * We can add a back button by putting an {@link ionic.directive:ionNavBackButton} inside.
 *
 * We can add buttons depending on the currently visible view using
 * {@link ionic.directive:ionNavButtons}.
 *
 * Note that the ion-nav-bar element will only work correctly if your content has an
 * ionView around it.
 *
 * @usage
 *
 * ```html
 * <body ng-app="starter">
 *   <!-- The nav bar that will be updated as we navigate -->
 *   <ion-nav-bar class="bar-positive">
 *   </ion-nav-bar>
 *
 *   <!-- where the initial view template will be rendered -->
 *   <ion-nav-view>
 *     <ion-view>
 *       <ion-content>Hello!</ion-content>
 *     </ion-view>
 *   </ion-nav-view>
 * </body>
 * ```
 *
 * @param {string=} delegate-handle The handle used to identify this navBar
 * with {@link ionic.service:$ionicNavBarDelegate}.
 * @param align-title {string=} Where to align the title of the navbar.
 * Available: 'left', 'right', 'center'. Defaults to 'center'.
 * @param {boolean=} no-tap-scroll By default, the navbar will scroll the content
 * to the top when tapped.  Set no-tap-scroll to true to disable this behavior.
 *
 * </table><br/>
 *
 * ### Alternative Usage
 *
 * Alternatively, you may put ion-nav-bar inside of each individual view's ion-view element.
 * This will allow you to have the whole navbar, not just its contents, transition every view change.
 *
 * This is similar to using a header bar inside your ion-view, except it will have all the power of a navbar.
 *
 * If you do this, simply put nav buttons inside the navbar itself; do not use `<ion-nav-buttons>`.
 *
 *
 * ```html
 * <ion-view title="myTitle">
 *   <ion-nav-bar class="bar-positive">
 *     <ion-nav-back-button>
 *       Back
 *     </ion-nav-back-button>
 *     <div class="buttons primary-buttons">
 *       <button class="button">
            Button
 *       </button>
 *     </div>
 *   </ion-nav-bar>
 * </ion-view>
 * ```
 */
IonicModule
.directive('ionNavBar', ['$ionicConfig', function($ionicConfig) {
  return {
    restrict: 'E',
    controller: '$ionNavBar',
    scope: true,
    compile: function(tElement) {
      //We cannot transclude here because it breaks element.data() inheritance on compile
      tElement.attr('class', 'nav-bar-container ' + $ionicConfig.navBar.transition());

      return function($scope, $element, $attr, navBarCtrl) {
        navBarCtrl.init();
      };
    }
  };
}]);


/**
 * @ngdoc directive
 * @name ionNavButtons
 * @module ionic
 * @restrict E
 * @parent ionNavView
 *
 * @description
 * Use ionNavButtons to set the buttons on your {@link ionic.directive:ionNavBar}
 * from within an {@link ionic.directive:ionView}.
 *
 * Any buttons you declare will be placed onto the navbar's corresponding side. Primary
 * buttons generally map to the left side of the header, and secondary buttons are
 * generally on the right side. However, their exact locations are platform specific.
 * For example, in iOS the primary buttons are on the far left of the header, and
 * secondary buttons are on the far right, with the header title centered between them.
 * For Android however, both groups of buttons are on the far right of the header,
 * with the header title aligned left.
 *
 * @usage
 * ```html
 * <ion-nav-bar>
 * </ion-nav-bar>
 * <ion-nav-view>
 *   <ion-view>
 *     <ion-nav-buttons side="primary">
 *       <button class="button" ng-click="doSomething()">
 *         I'm a button on the primary of the navbar!
 *       </button>
 *     </ion-nav-buttons>
 *     <ion-content>
 *       Some super content here!
 *     </ion-content>
 *   </ion-view>
 * </ion-nav-view>
 * ```
 *
 * @param {string} side The side to place the buttons on in the parent
 * {@link ionic.directive:ionNavBar}. Available: 'primary' or 'secondary'.
 */
IonicModule
.directive('ionNavButtons', ['$document', function($document) {
  return {
    require: '^ionNavBar',
    restrict: 'E',
    compile: function(tElement, tAttrs) {
      var spanEle = $document[0].createElement('span');
      var navElementType;

      if (tAttrs.side == 'secondary' || tAttrs.side == 'right') {
        spanEle.className = 'secondary-buttons';
        navElementType = 'secondaryButtons';
      } else {
        spanEle.className = 'primary-buttons';
        navElementType = 'primaryButtons';
      }

      spanEle.innerHTML = tElement.html();

      tElement.attr('class', 'hide');
      tElement.empty();

      return {
        pre: function($scope, $element, $attrs, navBarCtrl) {
          // only register the plain HTML, the navBarCtrl takes care of scope/compile/link

          var parentViewCtrl = $element.parent().data('$ionViewController');
          if (parentViewCtrl) {
            // if the parent is an ion-view, then these are ion-nav-buttons for JUST this ion-view
            parentViewCtrl.navElement(navElementType, spanEle.outerHTML);

          } else {
            // these are buttons for all views that do not have their own ion-nav-buttons
            navBarCtrl.navElement(navElementType, spanEle.outerHTML);
          }

          spanEle = null;
        }
      };
    }
  };
}]);

/**
 * @ngdoc directive
 * @name ionNavView
 * @module ionic
 * @restrict E
 * @codepen odqCz
 *
 * @description
 * As a user navigates throughout your app, Ionic is able to keep track of their
 * navigation history. By knowing their history, transitions between views
 * correctly enter and exit using the platform's transition style. An additional
 * benefit to Ionic's navigation system is its ability to manage multiple
 * histories.
 *
 * Ionic uses the AngularUI Router module so app interfaces can be organized
 * into various "states". Like Angular's core $route service, URLs can be used
 * to control the views. However, the AngularUI Router provides a more powerful
 * state manager in that states are bound to named, nested, and parallel views,
 * allowing more than one template to be rendered on the same page.
 * Additionally, each state is not required to be bound to a URL, and data can
 * be pushed to each state which allows much flexibility.
 *
 * The ionNavView directive is used to render templates in your application. Each template
 * is part of a state. States are usually mapped to a url, and are defined programatically
 * using angular-ui-router (see [their docs](https://github.com/angular-ui/ui-router/wiki),
 * and remember to replace ui-view with ion-nav-view in examples).
 *
 * @usage
 * In this example, we will create a navigation view that contains our different states for the app.
 *
 * To do this, in our markup we use ionNavView top level directive. To display a header bar we use
 * the {@link ionic.directive:ionNavBar} directive that updates as we navigate through the
 * navigation stack.
 *
 * Next, we need to setup our states that will be rendered.
 *
 * ```js
 * var app = angular.module('myApp', ['ionic']);
 * app.config(function($stateProvider) {
 *   $stateProvider
 *   .state('index', {
 *     url: '/',
 *     templateUrl: 'home.html'
 *   })
 *   .state('music', {
 *     url: '/music',
 *     templateUrl: 'music.html'
 *   });
 * });
 * ```
 * Then on app start, $stateProvider will look at the url, see it matches the index state,
 * and then try to load home.html into the `<ion-nav-view>`.
 *
 * Pages are loaded by the URLs given. One simple way to create templates in Angular is to put
 * them directly into your HTML file and use the `<script type="text/ng-template">` syntax.
 * So here is one way to put home.html into our app:
 *
 * ```html
 * <script id="home" type="text/ng-template">
 *   <!-- The title of the ion-view will be shown on the navbar -->
 *   <ion-view title="Home">
 *     <ion-content ng-controller="HomeCtrl">
 *       <!-- The content of the page -->
 *       <a href="#/music">Go to music page!</a>
 *     </ion-content>
 *   </ion-view>
 * </script>
 * ```
 *
 * This is good to do because the template will be cached for very fast loading, instead of
 * having to fetch them from the network.
 *
 * Please visit [AngularUI Router's docs](https://github.com/angular-ui/ui-router/wiki) for
 * more info. Below is a great video by the AngularUI Router guys that may help to explain
 * how it all works:
 *
 * <iframe width="560" height="315" src="//www.youtube.com/embed/dqJRoh8MnBo"
 * frameborder="0" allowfullscreen></iframe>
 *
 * @param {string=} name A view name. The name should be unique amongst the other views in the
 * same state. You can have views of the same name that live in different states. For more
 * information, see ui-router's [ui-view documentation](http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.directive:ui-view).
 */
IonicModule
.directive('ionNavView', [
  '$state',
  '$ionicConfig',
function($state, $ionicConfig) {
  // IONIC's fork of Angular UI Router, v0.2.10
  // the navView handles registering views in the history and how to transition between them
  return {
    restrict: 'E',
    terminal: true,
    priority: 2000,
    transclude: true,
    controller: '$ionNavView',
    compile: function (tElement, tAttrs, transclude) {

      // a nav view element is a container for numerous views
      tElement.addClass('view-container ' + $ionicConfig.views.transition());

      return function($scope, $element, $attr, navViewCtrl) {
        var latestLocals;

        // Put in the compiled initial view
        transclude($scope, function(clone){
          $element.append( clone );
        });

        var viewData = navViewCtrl.init();

        // listen for $stateChangeSuccess
        $scope.$on('$stateChangeSuccess', function() {
          updateView(false);
        });
        $scope.$on('$viewContentLoading', function() {
          updateView(false);
        });

        // initial load, ready go
        updateView(true);


        function updateView(firstTime) {
          // get the current local according to the $state
          var viewLocals = $state.$current && $state.$current.locals[viewData.name];

          // do not update THIS nav-view if its is not the container for the given state
          // if the viewLocals are the same as THIS latestLocals, then nothing to do
          if (!viewLocals || (!firstTime && viewLocals === latestLocals)) return;

          // update the latestLocals
          latestLocals = viewLocals;
          viewData.state = viewLocals.$$state;

          // register, update and transition to the new view
          navViewCtrl.register(viewLocals);
        }

      };
    }
  };
}]);


IonicModule

.config(['$provide', function($provide) {
  $provide.decorator('ngClickDirective', ['$delegate', function($delegate) {
    // drop the default ngClick directive
    $delegate.shift();
    return $delegate;
  }]);
}])

/**
 * @private
 */
.factory('$ionicNgClick', ['$parse', function($parse) {
  return function(scope, element, clickExpr) {
    var clickHandler = angular.isFunction(clickExpr) ?
      clickExpr :
      $parse(clickExpr);

    element.on('click', function(event) {
      scope.$apply(function() {
        clickHandler(scope, {$event: (event)});
      });
    });

    // Hack for iOS Safari's benefit. It goes searching for onclick handlers and is liable to click
    // something else nearby.
    element.onclick = function(event) { };
  };
}])

.directive('ngClick', ['$ionicNgClick', function($ionicNgClick) {
  return function(scope, element, attr) {
    $ionicNgClick(scope, element, attr.ngClick);
  };
}])

.directive('ionStopEvent', function () {
  return {
    restrict: 'A',
    link: function (scope, element, attr) {
      element.bind(attr.ionStopEvent, eventStopPropagation);
    }
  };
});
function eventStopPropagation(e) {
  e.stopPropagation();
}


/**
 * @ngdoc directive
 * @name ionPane
 * @module ionic
 * @restrict E
 *
 * @description A simple container that fits content, with no side effects.  Adds the 'pane' class to the element.
 */
IonicModule
.directive('ionPane', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attr) {
      element.addClass('pane');
    }
  };
});

/*
 * We don't document the ionPopover directive, we instead document
 * the $ionicPopover service
 */
IonicModule
.directive('ionPopover', [function() {
  return {
    restrict: 'E',
    transclude: true,
    replace: true,
    controller: [function(){}],
    template: '<div class="popover-backdrop">' +
                '<div class="popover-wrapper" ng-transclude></div>' +
              '</div>'
  };
}]);

IonicModule
.directive('ionPopoverView', function() {
  return {
    restrict: 'E',
    compile: function(element) {
      element.append( angular.element('<div class="popover-arrow"></div>') );
      element.addClass('popover');
    }
  };
});

/**
 * @ngdoc directive
 * @name ionRadio
 * @module ionic
 * @restrict E
 * @codepen saoBG
 * @description
 * The radio directive is no different than the HTML radio input, except it's styled differently.
 *
 * Radio behaves like any [AngularJS radio](http://docs.angularjs.org/api/ng/input/input[radio]).
 *
 * @usage
 * ```html
 * <ion-radio ng-model="choice" ng-value="'A'">Choose A</ion-radio>
 * <ion-radio ng-model="choice" ng-value="'B'">Choose B</ion-radio>
 * <ion-radio ng-model="choice" ng-value="'C'">Choose C</ion-radio>
 * ```
 * 
 * @param {string=} name The name of the radio input.
 * @param {expression=} value The value of the radio input.
 * @param {boolean=} disabled The state of the radio input.
 * @param {string=} icon The icon to use when the radio input is selected.
 * @param {expression=} ng-value Angular equivalent of the value attribute.
 * @param {expression=} ng-model The angular model for the radio input.
 * @param {boolean=} ng-disabled Angular equivalent of the disabled attribute.
 * @param {expression=} ng-change Triggers given expression when radio input's model changes
 */
IonicModule
.directive('ionRadio', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    transclude: true,
    template:
      '<label class="item item-radio">' +
        '<input type="radio" name="radio-group">' +
        '<div class="item-content disable-pointer-events" ng-transclude></div>' +
        '<i class="radio-icon disable-pointer-events icon ion-checkmark"></i>' +
      '</label>',

    compile: function(element, attr) {
      if(attr.icon) element.children().eq(2).removeClass('ion-checkmark').addClass(attr.icon);
      var input = element.find('input');
      forEach({
          'name': attr.name,
          'value': attr.value,
          'disabled': attr.disabled,
          'ng-value': attr.ngValue,
          'ng-model': attr.ngModel,
          'ng-disabled': attr.ngDisabled,
          'ng-change': attr.ngChange
      }, function(value, name) {
        if (isDefined(value)) {
            input.attr(name, value);
          }
      });

      return function(scope, element, attr) {
        scope.getValue = function() {
          return scope.ngValue || attr.value;
        };
      };
    }
  };
});


/**
 * @ngdoc directive
 * @name ionRefresher
 * @module ionic
 * @restrict E
 * @parent ionic.directive:ionContent, ionic.directive:ionScroll
 * @description
 * Allows you to add pull-to-refresh to a scrollView.
 *
 * Place it as the first child of your {@link ionic.directive:ionContent} or
 * {@link ionic.directive:ionScroll} element.
 *
 * When refreshing is complete, $broadcast the 'scroll.refreshComplete' event
 * from your controller.
 *
 * @usage
 *
 * ```html
 * <ion-content ng-controller="MyController">
 *   <ion-refresher
 *     pulling-text="Pull to refresh..."
 *     on-refresh="doRefresh()">
 *   </ion-refresher>
 *   <ion-list>
 *     <ion-item ng-repeat="item in items"></ion-item>
 *   </ion-list>
 * </ion-content>
 * ```
 * ```js
 * angular.module('testApp', ['ionic'])
 * .controller('MyController', function($scope, $http) {
 *   $scope.items = [1,2,3];
 *   $scope.doRefresh = function() {
 *     $http.get('/new-items')
 *      .success(function(newItems) {
 *        $scope.items = newItems;
 *      })
 *      .finally(function() {
 *        // Stop the ion-refresher from spinning
 *        $scope.$broadcast('scroll.refreshComplete');
 *      });
 *   };
 * });
 * ```
 *
 * @param {expression=} on-refresh Called when the user pulls down enough and lets go
 * of the refresher.
 * @param {expression=} on-pulling Called when the user starts to pull down
 * on the refresher.
 * @param {string=} pulling-icon The icon to display while the user is pulling down.
 * Default: 'ion-arrow-down-c'.
 * @param {string=} pulling-text The text to display while the user is pulling down.
 * @param {string=} refreshing-icon The icon to display after user lets go of the
 * refresher.
 * @param {string=} refreshing-text The text to display after the user lets go of
 * the refresher.
 * @param {boolean=} disable-pulling-rotation Disables the rotation animation of the pulling
 * icon when it reaches its activated threshold. To be used with a custom `pulling-icon`.
 *
 */
IonicModule
.directive('ionRefresher', ['$ionicBind', function($ionicBind) {
  return {
    restrict: 'E',
    replace: true,
    require: '^$ionicScroll',
    template:
    '<div class="scroll-refresher" collection-repeat-ignore>' +
      '<div class="ionic-refresher-content" ' +
      'ng-class="{\'ionic-refresher-with-text\': pullingText || refreshingText}">' +
        '<div class="icon-pulling" ng-class="{\'pulling-rotation-disabled\':disablePullingRotation}">' +
          '<i class="icon {{pullingIcon}}"></i>' +
        '</div>' +
        '<div class="text-pulling" ng-bind-html="pullingText"></div>' +
        '<i class="icon {{refreshingIcon}} icon-refreshing"></i>' +
        '<div class="text-refreshing" ng-bind-html="refreshingText"></div>' +
      '</div>' +
    '</div>',
    compile: function($element, $attrs) {
      if (angular.isUndefined($attrs.pullingIcon)) {
        $attrs.$set('pullingIcon', 'ion-ios7-arrow-down');
      }
      if (angular.isUndefined($attrs.refreshingIcon)) {
        $attrs.$set('refreshingIcon', 'ion-loading-d');
      }
      return function($scope, $element, $attrs, scrollCtrl) {
        $ionicBind($scope, $attrs, {
          pullingIcon: '@',
          pullingText: '@',
          refreshingIcon: '@',
          refreshingText: '@',
          disablePullingRotation: '@',
          $onRefresh: '&onRefresh',
          $onPulling: '&onPulling'
        });

        scrollCtrl._setRefresher($scope, $element[0]);
        $scope.$on('scroll.refreshComplete', function() {
          $scope.$evalAsync(function() {
            scrollCtrl.scrollView.finishPullToRefresh();
          });
        });
      };
    }
  };
}]);

/**
 * @ngdoc directive
 * @name ionScroll
 * @module ionic
 * @delegate ionic.service:$ionicScrollDelegate
 * @codepen mwFuh
 * @restrict E
 *
 * @description
 * Creates a scrollable container for all content inside.
 *
 * @usage
 *
 * Basic usage:
 *
 * ```html
 * <ion-scroll zooming="true" direction="xy" style="width: 500px; height: 500px">
 *   <div style="width: 5000px; height: 5000px; background: url('https://upload.wikimedia.org/wikipedia/commons/a/ad/Europe_geological_map-en.jpg') repeat"></div>
 *  </ion-scroll>
 * ```
 *
 * Note that it's important to set the height of the scroll box as well as the height of the inner
 * content to enable scrolling. This makes it possible to have full control over scrollable areas.
 *
 * If you'd just like to have a center content scrolling area, use {@link ionic.directive:ionContent} instead.
 *
 * @param {string=} delegate-handle The handle used to identify this scrollView
 * with {@link ionic.service:$ionicScrollDelegate}.
 * @param {string=} direction Which way to scroll. 'x' or 'y' or 'xy'. Default 'y'.
 * @param {boolean=} locking Whether to lock scrolling in one direction at a time. Useful to set to false when zoomed in or scrolling in two directions. Default true.
 * @param {boolean=} paging Whether to scroll with paging.
 * @param {expression=} on-refresh Called on pull-to-refresh, triggered by an {@link ionic.directive:ionRefresher}.
 * @param {expression=} on-scroll Called whenever the user scrolls.
 * @param {boolean=} scrollbar-x Whether to show the horizontal scrollbar. Default true.
 * @param {boolean=} scrollbar-y Whether to show the vertical scrollbar. Default true.
 * @param {boolean=} zooming Whether to support pinch-to-zoom
 * @param {integer=} min-zoom The smallest zoom amount allowed (default is 0.5)
 * @param {integer=} max-zoom The largest zoom amount allowed (default is 3)
 * @param {boolean=} has-bouncing Whether to allow scrolling to bounce past the edges
 * of the content.  Defaults to true on iOS, false on Android.
 */
IonicModule
.directive('ionScroll', [
  '$timeout',
  '$controller',
  '$ionicBind',
function($timeout, $controller, $ionicBind) {
  return {
    restrict: 'E',
    scope: true,
    controller: function() {},
    compile: function(element, attr) {
      element.addClass('scroll-view ionic-scroll');

      //We cannot transclude here because it breaks element.data() inheritance on compile
      var innerElement = jqLite('<div class="scroll"></div>');
      innerElement.append(element.contents());
      element.append(innerElement);

      return { pre: prelink };
      function prelink($scope, $element, $attr) {
        var scrollView, scrollCtrl;

        $ionicBind($scope, $attr, {
          direction: '@',
          paging: '@',
          $onScroll: '&onScroll',
          scroll: '@',
          scrollbarX: '@',
          scrollbarY: '@',
          zooming: '@',
          minZoom: '@',
          maxZoom: '@'
        });
        $scope.direction = $scope.direction || 'y';

        if (angular.isDefined($attr.padding)) {
          $scope.$watch($attr.padding, function(newVal) {
            innerElement.toggleClass('padding', !!newVal);
          });
        }
        if($scope.$eval($scope.paging) === true) {
          innerElement.addClass('scroll-paging');
        }

        if(!$scope.direction) { $scope.direction = 'y'; }
        var isPaging = $scope.$eval($scope.paging) === true;

        var scrollViewOptions= {
          el: $element[0],
          delegateHandle: $attr.delegateHandle,
          locking: ($attr.locking || 'true') === 'true',
          bouncing: $scope.$eval($attr.hasBouncing),
          paging: isPaging,
          scrollbarX: $scope.$eval($scope.scrollbarX) !== false,
          scrollbarY: $scope.$eval($scope.scrollbarY) !== false,
          scrollingX: $scope.direction.indexOf('x') >= 0,
          scrollingY: $scope.direction.indexOf('y') >= 0,
          zooming: $scope.$eval($scope.zooming) === true,
          maxZoom: $scope.$eval($scope.maxZoom) || 3,
          minZoom: $scope.$eval($scope.minZoom) || 0.5
        };
        if (isPaging) {
          scrollViewOptions.speedMultiplier = 0.8;
          scrollViewOptions.bouncing = false;
        }

        scrollCtrl = $controller('$ionicScroll', {
          $scope: $scope,
          scrollViewOptions: scrollViewOptions
        });
        scrollView = $scope.$parent.scrollView = scrollCtrl.scrollView;
      }
    }
  };
}]);

/**
 * @ngdoc directive
 * @name ionSideMenu
 * @module ionic
 * @restrict E
 * @parent ionic.directive:ionSideMenus
 *
 * @description
 * A container for a side menu, sibling to an {@link ionic.directive:ionSideMenuContent} directive.
 *
 * @usage
 * ```html
 * <ion-side-menu
 *   side="left"
 *   width="myWidthValue + 20"
 *   is-enabled="shouldLeftSideMenuBeEnabled()">
 * </ion-side-menu>
 * ```
 * For a complete side menu example, see the
 * {@link ionic.directive:ionSideMenus} documentation.
 *
 * @param {string} side Which side the side menu is currently on.  Allowed values: 'left' or 'right'.
 * @param {boolean=} is-enabled Whether this side menu is enabled.
 * @param {number=} width How many pixels wide the side menu should be.  Defaults to 275.
 */
IonicModule
.directive('ionSideMenu', function() {
  return {
    restrict: 'E',
    require: '^ionSideMenus',
    scope: true,
    compile: function(element, attr) {
      angular.isUndefined(attr.isEnabled) && attr.$set('isEnabled', 'true');
      angular.isUndefined(attr.width) && attr.$set('width', '275');

      element.addClass('menu menu-' + attr.side);

      return function($scope, $element, $attr, sideMenuCtrl) {
        $scope.side = $attr.side || 'left';

        var sideMenu = sideMenuCtrl[$scope.side] = new ionic.views.SideMenu({
          width: attr.width,
          el: $element[0],
          isEnabled: true
        });

        $scope.$watch($attr.width, function(val) {
          var numberVal = +val;
          if (numberVal && numberVal == val) {
            sideMenu.setWidth(+val);
          }
        });
        $scope.$watch($attr.isEnabled, function(val) {
          sideMenu.setIsEnabled(!!val);
        });
      };
    }
  };
});


/**
 * @ngdoc directive
 * @name ionSideMenuContent
 * @module ionic
 * @restrict E
 * @parent ionic.directive:ionSideMenus
 *
 * @description
 * A container for the main visible content, sibling to one or more
 * {@link ionic.directive:ionSideMenu} directives.
 *
 * @usage
 * ```html
 * <ion-side-menu-content
 *   edge-drag-threshold="true"
 *   drag-content="true">
 * </ion-side-menu-content>
 * ```
 * For a complete side menu example, see the
 * {@link ionic.directive:ionSideMenus} documentation.
 *
 * @param {boolean=} drag-content Whether the content can be dragged. Default true.
 * @param {boolean|number=} edge-drag-threshold Whether the content drag can only start if it is below a certain threshold distance from the edge of the screen.  Default false. Accepts three types of values:
   *  - If a non-zero number is given, that many pixels is used as the maximum allowed distance from the edge that starts dragging the side menu.
   *  - If true is given, the default number of pixels (25) is used as the maximum allowed distance.
   *  - If false or 0 is given, the edge drag threshold is disabled, and dragging from anywhere on the content is allowed.
 *
 */
IonicModule
.directive('ionSideMenuContent', [
  '$timeout',
  '$ionicGesture',
  '$window',
function($timeout, $ionicGesture, $window) {

  return {
    restrict: 'EA', //DEPRECATED 'A'
    require: '^ionSideMenus',
    scope: true,
    compile: function(element, attr) {
      element.addClass('menu-content pane');

      return { pre: prelink };
      function prelink($scope, $element, $attr, sideMenuCtrl) {
        var startCoord = null;
        var primaryScrollAxis = null;

        if (isDefined(attr.dragContent)) {
          $scope.$watch(attr.dragContent, function(value) {
            sideMenuCtrl.canDragContent(value);
          });
        } else {
          sideMenuCtrl.canDragContent(true);
        }

        if (isDefined(attr.edgeDragThreshold)) {
          $scope.$watch(attr.edgeDragThreshold, function(value) {
            sideMenuCtrl.edgeDragThreshold(value);
          });
        }

        // Listen for taps on the content to close the menu
        function onContentTap(gestureEvt) {
          if (sideMenuCtrl.getOpenAmount() !== 0) {
            sideMenuCtrl.close();
            gestureEvt.gesture.srcEvent.preventDefault();
            startCoord = null;
            primaryScrollAxis = null;
          } else if (!startCoord) {
            startCoord = ionic.tap.pointerCoord(gestureEvt.gesture.srcEvent);
          }
        }

        function onDragX(e) {
          if (!sideMenuCtrl.isDraggableTarget(e)) return;

          if ( getPrimaryScrollAxis(e) == 'x') {
            sideMenuCtrl._handleDrag(e);
            e.gesture.srcEvent.preventDefault();
          }
        }

        function onDragY(e) {
          if ( getPrimaryScrollAxis(e) == 'x' ) {
            e.gesture.srcEvent.preventDefault();
          }
        }

        function onDragRelease(e) {
          sideMenuCtrl._endDrag(e);
          startCoord = null;
          primaryScrollAxis = null;
        }

        function getPrimaryScrollAxis(gestureEvt) {
          // gets whether the user is primarily scrolling on the X or Y
          // If a majority of the drag has been on the Y since the start of
          // the drag, but the X has moved a little bit, it's still a Y drag

          if (primaryScrollAxis) {
            // we already figured out which way they're scrolling
            return primaryScrollAxis;
          }

          if (gestureEvt && gestureEvt.gesture) {

            if (!startCoord) {
              // get the starting point
              startCoord = ionic.tap.pointerCoord(gestureEvt.gesture.srcEvent);

            } else {
              // we already have a starting point, figure out which direction they're going
              var endCoord = ionic.tap.pointerCoord(gestureEvt.gesture.srcEvent);

              var xDistance = Math.abs(endCoord.x - startCoord.x);
              var yDistance = Math.abs(endCoord.y - startCoord.y);

              var scrollAxis = ( xDistance < yDistance ? 'y' : 'x' );

              if ( Math.max(xDistance, yDistance) > 30 ) {
                // ok, we pretty much know which way they're going
                // let's lock it in
                primaryScrollAxis = scrollAxis;
              }

              return scrollAxis;
            }
          }
          return 'x';
        }

        var content = {
          element: element[0],
          onDrag: function(e) {},
          endDrag: function(e) {},
          getTranslateX: function() {
            return $scope.sideMenuContentTranslateX || 0;
          },
          setTranslateX: ionic.animationFrameThrottle(function(amount) {
            var xTransform = content.offsetX + amount;
            $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(' + xTransform + 'px,0,0)';
            $timeout(function() {
              $scope.sideMenuContentTranslateX = amount;
            });
          }),
          setMarginLeft: ionic.animationFrameThrottle(function(amount) {
            if (amount) {
              amount = parseInt(amount, 10);
              $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(' + amount + 'px,0,0)';
              $element[0].style.width = ($window.innerWidth - amount) + 'px';
              content.offsetX = amount;
            } else {
              $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(0,0,0)';
              $element[0].style.width = '';
              content.offsetX = 0;
            }
          }),
          setMarginRight: ionic.animationFrameThrottle(function(amount) {
            if (amount) {
              amount = parseInt(amount, 10);
              $element[0].style.width = ($window.innerWidth - amount) + 'px';
              content.offsetX = amount;
            } else {
              $element[0].style.width = '';
              content.offsetX = 0;
            }
            // reset incase left gets grabby
            $element[0].style[ionic.CSS.TRANSFORM] = 'translate3d(0,0,0)';
          }),
          enableAnimation: function() {
            $scope.animationEnabled = true;
            $element[0].classList.add('menu-animated');
          },
          disableAnimation: function() {
            $scope.animationEnabled = false;
            $element[0].classList.remove('menu-animated');
          },
          offsetX: 0
        };

        sideMenuCtrl.setContent(content);

        // add gesture handlers
        var gestureOpts = { stop_browser_behavior: false };
        var contentTapGesture = $ionicGesture.on('tap', onContentTap, $element, gestureOpts);
        var dragRightGesture = $ionicGesture.on('dragright', onDragX, $element, gestureOpts);
        var dragLeftGesture = $ionicGesture.on('dragleft', onDragX, $element, gestureOpts);
        var dragUpGesture = $ionicGesture.on('dragup', onDragY, $element, gestureOpts);
        var dragDownGesture = $ionicGesture.on('dragdown', onDragY, $element, gestureOpts);
        var releaseGesture = $ionicGesture.on('release', onDragRelease, $element, gestureOpts);

        // Cleanup
        $scope.$on('$destroy', function() {
          if (content) {
            content.element = null;
            content = null;
          }
          $ionicGesture.off(dragLeftGesture, 'dragleft', onDragX);
          $ionicGesture.off(dragRightGesture, 'dragright', onDragX);
          $ionicGesture.off(dragUpGesture, 'dragup', onDragY);
          $ionicGesture.off(dragDownGesture, 'dragdown', onDragY);
          $ionicGesture.off(releaseGesture, 'release', onDragRelease);
          $ionicGesture.off(contentTapGesture, 'tap', onContentTap);
        });
      }
    }
  };
}]);

IonicModule

/**
 * @ngdoc directive
 * @name ionSideMenus
 * @module ionic
 * @delegate ionic.service:$ionicSideMenuDelegate
 * @restrict E
 *
 * @description
 * A container element for side menu(s) and the main content. Allows the left
 * and/or right side menu to be toggled by dragging the main content area side
 * to side.
 *
 * To automatically close an opened menu you can add the {@link ionic.directive:menuClose}
 * attribute directive. Including the `menu-close` attribute is usually added to
 * links and buttons within `ion-side-menu` content, so that when the element is
 * clicked then the opened side menu will automatically close.
 *
 * By default, side menus are hidden underneath its side menu content, and can be opened by
 * either swiping the content left or right, or toggling a button to show the side menu. However,
 * by adding the {@link ionic.directive:exposeAsideWhen} attribute directive to an
 * {@link ionic.directive:ionSideMenu} element directive, a side menu can be given instructions
 * on "when" the menu should be exposed (always viewable).
 *
 * ![Side Menu](http://ionicframework.com.s3.amazonaws.com/docs/controllers/sidemenu.gif)
 *
 * For more information on side menus, check out:
 *
 * - {@link ionic.directive:ionSideMenuContent}
 * - {@link ionic.directive:ionSideMenu}
 * - {@link ionic.directive:menuClose}
 * - {@link ionic.directive:exposeAsideWhen}
 *
 * @usage
 * To use side menus, add an `<ion-side-menus>` parent element,
 * an `<ion-side-menu-content>` for the center content,
 * and one or more `<ion-side-menu>` directives.
 *
 * ```html
 * <ion-side-menus>
 *   <!-- Center content -->
 *   <ion-side-menu-content ng-controller="ContentController">
 *   </ion-side-menu-content>
 *
 *   <!-- Left menu -->
 *   <ion-side-menu side="left">
 *   </ion-side-menu>
 *
 *   <!-- Right menu -->
 *   <ion-side-menu side="right">
 *   </ion-side-menu>
 * </ion-side-menus>
 * ```
 * ```js
 * function ContentController($scope, $ionicSideMenuDelegate) {
 *   $scope.toggleLeft = function() {
 *     $ionicSideMenuDelegate.toggleLeft();
 *   };
 * }
 * ```
 *
 * @param {string=} delegate-handle The handle used to identify this side menu
 * with {@link ionic.service:$ionicSideMenuDelegate}.
 *
 */
.directive('ionSideMenus', ['$ionicBody', function($ionicBody) {
  return {
    restrict: 'ECA',
    controller: '$ionicSideMenus',
    compile: function(element, attr) {
      attr.$set('class', (attr['class'] || '') + ' view');

      return { pre: prelink };
      function prelink($scope) {

        $scope.$on('$ionicExposeAside', function(evt, isAsideExposed){
          if(!$scope.$exposeAside) $scope.$exposeAside = {};
          $scope.$exposeAside.active = isAsideExposed;
          $ionicBody.enableClass(isAsideExposed, 'aside-open');
        });

        $scope.$on('$destroy', function(){
          $ionicBody.removeClass('menu-open', 'aside-open');
        });

      }
    }
  };
}]);

/**
 * @ngdoc directive
 * @name ionSlide
 * @parent ionic.directive:ionSlideBox
 * @module ionic
 *
 * @description
 * Displays a slide inside of a slidebox.
 *
 * For more complete examples, see {@link ionic.directive:ionSlideBox}.
 *
 * @usage
 * ```html
 * <ion-slide-box>
 *   <ion-slide>1</ion-slide>
 *   <ion-slide>2</ion-slide>
 * </ion-slide-box>
 * ```
 */
IonicModule
.directive('ionSlide', [function() {
  return {
    restrict: 'E',
    controller: '$ionSlide',
    scope: true,
    require: ['^ionSlideBox', 'ionSlide'],
    link: postLink
  };

  function postLink(scope, element, attr, ctrls) {
    var slideBoxCtrl = ctrls[0];
    var slideCtrl = ctrls[1];

    element.addClass('slider-slide');

    slideBoxCtrl.add(slideCtrl);
    element.on('$destroy', function() {
      slideBoxCtrl.remove(slideCtrl);
    });

  }
}]);

/**
 * @ngdoc directive
 * @name ionSlideBox
 * @module ionic
 * @delegate ionic.service:$ionicSlideBoxDelegate
 * @restrict E
 * @description
 * The Slide Box is a multi-page container where each page can be swiped or dragged between:
 *
 * ![SlideBox](http://ionicframework.com.s3.amazonaws.com/docs/controllers/slideBox.gif)
 *
 * Note: The slideBox will take up the whole width and height of its parent element.
 *
 * @usage
 * ```html
 * <ion-slide-box on-slide-changed="slideHasChanged($slideIndex)" loop="shouldLoop" auto-play="3000">
 *   <ion-slide>
 *     <div class="box blue"><h1>BLUE</h1></div>
 *   </ion-slide>
 *   <ion-slide>
 *     <div class="box yellow"><h1>YELLOW</h1></div>
 *   </ion-slide>
 *   <ion-slide>
 *     <div class="box pink"><h1>PINK</h1></div>
 *   </ion-slide>
 * </ion-slide-box>
 * ```
 *
 * @param {expression=} selected A model bound to the selected slide index.
 * @param {boolean=} loop Whether the slide box should loop. Default false.
 * @param {number=} auto-play If a positive number, then every time the given number of milliseconds have passed, slideBox will go to the next slide. Set to a non-positive number to disable. Default: -1.
 * @param {expression=} on-slide-changed Expression called whenever the slide is changed.  Is passed a '$slideIndex' variable.
 * @param {string=} delegate-handle The handle used to identify this slideBox with
 * {@link ionic.service:$ionicSlideBoxDelegate}.
 */
IonicModule
.directive('ionSlideBox', [
  '$ionicSlideBoxDelegate',
  '$window',
function($ionicSlideBoxDelegate, $window) {

  return {
    restrict: 'E',
    controller: '$ionSlideBox',
    require: 'ionSlideBox',
    transclude: true,
    scope: {
      selectedIndex: '=?selected',
      onSlideChanged: '&'
    },
    template: '<div class="slider-slides" ng-transclude></div>',
    compile: compile
  };

  function compile(element, attr) {
    // DEPRECATED attr.doesContinue
    isDefined(attr.doesContinue) && attr.$set('loop', attr.doesContinue);

    return postLink;
  }

  function postLink(scope, element, attr, slideBoxCtrl) {
    element.addClass('slider');

    var deregister = $ionicSlideBoxDelegate._registerInstance(slideBoxCtrl, attr.delegateHandle);
    scope.$on('$destroy', deregister);

    watchSelected();
    isDefined(attr.loop) && watchLoop();
    isDefined(attr.autoPlay) && watchAutoPlay();

    var throttledReposition = ionic.animationFrameThrottle(repositionSlideBox);
    throttledReposition();
    angular.element($window).on('resize', throttledReposition);

    scope.$on('$destroy', function() {
      angular.element($window).off('resize', throttledReposition);
    });

    // ***
    // Methods
    // ***

    // There is no way to make the slidebox stretch to a large enough size
    // when its children are all position: absolute elements.
    // We just make it so the slidebox is *always* as large as its offsetParent.
    function repositionSlideBox() {
      element.css({
        width: (element[0].offsetParent || element[0].parentNode || {}).offsetWidth + 'px',
        height: (element[0].offsetParent || element[0].parentNode || {}).offsetHeight + 'px'
      });
    }

    function watchSelected() {
      scope.$watch('selectedIndex', function selectedAttrWatchAction(newIndex) {
        if (slideBoxCtrl.isInRange(newIndex)) {
          scope.onSlideChanged({
            //DEPRECATED $index
            $index: newIndex,
            $slideIndex: newIndex
          });
          if (slideBoxCtrl.selected() !== newIndex) {
            slideBoxCtrl.select(newIndex);
          }
        }
      });
    }

    function watchLoop() {
      var unwatchParent = scope.$parent.$watch(attr.loop, slideBoxCtrl.loop);
      scope.$on('$destroy', unwatchParent);
    }

    function watchAutoPlay() {
      var unwatchParent = scope.$parent.$watch(attr.autoPlay, slideBoxCtrl.autoPlay);
      scope.$on('$destroy', unwatchParent);
    }
  }

}]);



/**
 * @ngdoc directive
 * @name ionSlidePager
 * @parent ionic.directive:ionSlideBox
 * @module ionic
 * @description
 * Shows a pager for the slidebox.
 *
 * A pager is a row of small buttons at the bottom of the slidebox, each
 * representing one slide. When the user clicks a pager, that slide will
 * be selected.
 *
 * For more complete examples, see {@link ionic.directive:ionSlideBox}.
 *
 * @usage
 * This will show four pager buttons, one for each slide.
 *
 * ```html
 * <ion-slide-box>
 *   <ion-slide-pager></ion-slide-pager>
 *   <ion-slide>1</ion-slide>
 *   <ion-slide>2</ion-slide>
 *   <ion-slide>3</ion-slide>
 *   <ion-slide>4</ion-slide>
 * </ion-slide-box>
 * ```
 *
 * If you provide your own `ng-click` attribute, it overrides the default
 * click behavior.
 *
 * ```html
 * <ion-slide-box>
 *   <ion-slide-pager ng-click="doSomething($slideIndex)"></ion-slide-pager>
 *   <ion-slide>1</ion-slide>
 *   <ion-slide>2</ion-slide>
 *   <ion-slide>3</ion-slide>
 * </ion-slide-box>
 * ```
 *
 * @param {expression=} ng-click By default, clicking a pager will select the corresponding
 * slide. You can override this by providing an ng-click expression. The ng-click
 * expression will be provided a `$slideIndex` variable, signifying the slide index
 * matching the click.
 */
IonicModule.directive('ionSlidePager', [
  '$parse',
function($parse) {
  return {
    restrict: 'E',
    require: '^ionSlideBox',
    scope: {},
    template:
      '<div class="slider-pager-page" ' +
           'ng-repeat="i in pages" ' +
           'ng-class="{active: i === slideBoxCtrl.selected()}" ' +
           'ng-click="click(i)">' +
      '</div>',
    link: postLink
  };

  function postLink(scope, element, attr, slideBoxCtrl) {
    var clickFn = attr.ngClick ?
      $parse(attr.ngClick) :
      function(scope, locals) {
        slideBoxCtrl.select(locals.$slideIndex);
      };

    element.addClass('slider-pager');
    scope.slideBoxCtrl = slideBoxCtrl;
    scope.pages = [];

    scope.click = onPagerClicked;
    scope.$watch(slideBoxCtrl.count, watchCountAction);

    function onPagerClicked(index) {
      clickFn(scope.$parent, {
        // DEPRECATED pass in `index` variable
        index: index,
        $slideIndex: index,
      });
    }

    function watchCountAction(slidesCount) {
      scope.pages.length = slidesCount;
      for (var i = 0; i < slidesCount; i++) {
        scope.pages[i] = i;
      }
    }
  }

}]);

/**
 * @ngdoc directive
 * @name ionTab
 * @module ionic
 * @restrict E
 * @parent ionic.directive:ionTabs
 *
 * @description
 * Contains a tab's content.  The content only exists while the given tab is selected.
 *
 * Each ionTab has its own view history.
 *
 * @usage
 * ```html
 * <ion-tab
 *   title="Tab!"
 *   icon="my-icon"
 *   href="#/tab/tab-link"
 *   on-select="onTabSelected()"
 *   on-deselect="onTabDeselected()">
 * </ion-tab>
 * ```
 * For a complete, working tab bar example, see the {@link ionic.directive:ionTabs} documentation.
 *
 * @param {string} title The title of the tab.
 * @param {string=} href The link that this tab will navigate to when tapped.
 * @param {string=} icon The icon of the tab. If given, this will become the default for icon-on and icon-off.
 * @param {string=} icon-on The icon of the tab while it is selected.
 * @param {string=} icon-off The icon of the tab while it is not selected.
 * @param {expression=} badge The badge to put on this tab (usually a number).
 * @param {expression=} badge-style The style of badge to put on this tab (eg tabs-positive).
 * @param {expression=} on-select Called when this tab is selected.
 * @param {expression=} on-deselect Called when this tab is deselected.
 * @param {expression=} ng-click By default, the tab will be selected on click. If ngClick is set, it will not.  You can explicitly switch tabs using {@link ionic.service:$ionicTabsDelegate#select $ionicTabsDelegate.select()}.
 */
IonicModule
.directive('ionTab', [
  '$compile',
  '$ionicConfig',
  '$ionicBind',
function($compile, $ionicConfig, $ionicBind) {

  //Returns ' key="value"' if value exists
  function attrStr(k,v) {
    return angular.isDefined(v) ? ' ' + k + '="' + v + '"' : '';
  }
  return {
    restrict: 'E',
    require: ['^ionTabs', 'ionTab'],
    controller: '$ionicTab',
    scope: true,
    compile: function(element, attr) {

      //We create the tabNavTemplate in the compile phase so that the
      //attributes we pass down won't be interpolated yet - we want
      //to pass down the 'raw' versions of the attributes
      var tabNavTemplate = '<ion-tab-nav' +
        attrStr('ng-click', attr.ngClick) +
        attrStr('title', attr.title) +
        attrStr('icon', attr.icon) +
        attrStr('icon-on', attr.iconOn) +
        attrStr('icon-off', attr.iconOff) +
        attrStr('badge', attr.badge) +
        attrStr('badge-style', attr.badgeStyle) +
        attrStr('hidden', attr.hidden) +
        attrStr('class', attr['class']) +
        '></ion-tab-nav>';

      //Remove the contents of the element so we can compile them later, if tab is selected
      var tabContent = document.createElement('div');
      tabContent.innerHTML = element.html();
      element.empty();

      var navViewName;
      if (tabContent.children.length && tabContent.children[0].tagName === 'ION-NAV-VIEW') {
        navViewName = tabContent.children[0].getAttribute('name');
      }

      return function link($scope, $element, $attr, ctrls) {
        var childScope;
        var childElement;
        var tabsCtrl = ctrls[0];
        var tabCtrl = ctrls[1];
        var isTabContentAttached = false;

        $ionicBind($scope, $attr, {
          onSelect: '&',
          onDeselect: '&',
          title: '@',
          uiSref: '@',
          href: '@'
        });

        tabsCtrl.add($scope);
        $scope.$on('$destroy', function() {
          if (!$scope.$tabsDestroy) {
            // if the containing ionTabs directive is being destroyed
            // then don't bother going through the controllers remove
            // method, since remove will reset the active tab as each tab
            // is being destroyed, causing unnecessary view loads and transitions
            tabsCtrl.remove($scope);
          }
          tabNavElement.isolateScope().$destroy();
          tabNavElement.remove();
          tabNavElement = childElement = null;
        });

        //Remove title attribute so browser-tooltip does not apear
        $element[0].removeAttribute('title');

        if (navViewName) {
          tabCtrl.navViewName = $scope.navViewName = navViewName;
        }
        $scope.$on('$stateChangeSuccess', selectIfMatchesState);
        selectIfMatchesState();
        function selectIfMatchesState() {
          if (tabCtrl.tabMatchesState()) {
            tabsCtrl.select($scope, false);
          }
        }

        var tabNavElement = jqLite(tabNavTemplate);
        tabNavElement.data('$ionTabsController', tabsCtrl);
        tabNavElement.data('$ionTabController', tabCtrl);
        tabsCtrl.$tabsElement.append($compile(tabNavElement)($scope));


        function tabSelected(isSelected) {
          if (isSelected && tabContent.childElementCount) {
            // this tab is being selected

            // check if the tab is already in the DOM
            // only do this if the tab has child elements
            if (!isTabContentAttached) {
              // tab should be selected and is NOT in the DOM
              // create a new scope and append it
              childScope = $scope.$new();
              childElement = jqLite('<div class="tab-content pane nav-view-cache">');
              childElement.html(tabContent.innerHTML);
              tabsCtrl.$element.append( childElement );
              $compile(childElement)(childScope);
              isTabContentAttached = true;
            }

            // remove the hide class so the tabs content shows up
            childElement && childElement.removeClass('nav-view-cache');

          } else if (isTabContentAttached && childElement) {
            // this tab should NOT be selected, and it is already in the DOM

            if ( $ionicConfig.views.maxCache() > 0 ) {
              // keep the tabs in the DOM, only css hide it
              childElement.addClass('nav-view-cache');

            } else {
              // do not keep tabs in the DOM
              childScope && childScope.$destroy();
              childScope = null;
              childElement && childElement.remove();
              childElement = null;
              isTabContentAttached = false;
            }

          }
        }

        $scope.$watch('$tabSelected', tabSelected);

        $scope.$on('$ionicView.afterEnter', function() {
          childElement && childElement.removeClass('nav-view-cache');
        });

      };
    }
  };
}]);

IonicModule
.directive('ionTabNav', [function() {
  return {
    restrict: 'E',
    replace: true,
    require: ['^ionTabs', '^ionTab'],
    template:
    '<a ng-class="{\'tab-item-active\': isTabActive(), \'has-badge\':badge, \'tab-hidden\':isHidden()}" ' +
      ' class="tab-item">' +
      '<span class="badge {{badgeStyle}}" ng-if="badge">{{badge}}</span>' +
      '<i class="icon {{getIconOn()}}" ng-if="getIconOn() && isTabActive()"></i>' +
      '<i class="icon {{getIconOff()}}" ng-if="getIconOff() && !isTabActive()"></i>' +
      '<span class="tab-title" ng-bind-html="title"></span>' +
    '</a>',
    scope: {
      title: '@',
      icon: '@',
      iconOn: '@',
      iconOff: '@',
      badge: '=',
      hidden: '@',
      badgeStyle: '@',
      'class': '@'
    },
    compile: function(element, attr, transclude) {
      return function link($scope, $element, $attrs, ctrls) {
        var tabsCtrl = ctrls[0],
          tabCtrl = ctrls[1];

        //Remove title attribute so browser-tooltip does not apear
        $element[0].removeAttribute('title');

        $scope.selectTab = function(e) {
          e.preventDefault();
          tabsCtrl.select(tabCtrl.$scope, true);
        };
        if (!$attrs.ngClick) {
          $element.on('click', function(event) {
            $scope.$apply(function() {
              $scope.selectTab(event);
            });
          });
        }

        $scope.isHidden = function() {
          if($attrs.hidden === 'true' || $attrs.hidden === true)return true;
          return false;
        };

        $scope.getIconOn = function() {
          return $scope.iconOn || $scope.icon;
        };
        $scope.getIconOff = function() {
          return $scope.iconOff || $scope.icon;
        };

        $scope.isTabActive = function() {
          return tabsCtrl.selectedTab() === tabCtrl.$scope;
        };
      };
    }
  };
}]);

/**
 * @ngdoc directive
 * @name ionTabs
 * @module ionic
 * @delegate ionic.service:$ionicTabsDelegate
 * @restrict E
 * @codepen KbrzJ
 *
 * @description
 * Powers a multi-tabbed interface with a Tab Bar and a set of "pages" that can be tabbed
 * through.
 *
 * Assign any [tabs class](/docs/components#tabs) or
 * [animation class](/docs/components#animation) to the element to define
 * its look and feel.
 *
 * See the {@link ionic.directive:ionTab} directive's documentation for more details on
 * individual tabs.
 *
 * Note: do not place ion-tabs inside of an ion-content element; it has been known to cause a
 * certain CSS bug.
 *
 * @usage
 * ```html
 * <ion-tabs class="tabs-positive tabs-icon-only">
 *
 *   <ion-tab title="Home" icon-on="ion-ios7-filing" icon-off="ion-ios7-filing-outline">
 *     <!-- Tab 1 content -->
 *   </ion-tab>
 *
 *   <ion-tab title="About" icon-on="ion-ios7-clock" icon-off="ion-ios7-clock-outline">
 *     <!-- Tab 2 content -->
 *   </ion-tab>
 *
 *   <ion-tab title="Settings" icon-on="ion-ios7-gear" icon-off="ion-ios7-gear-outline">
 *     <!-- Tab 3 content -->
 *   </ion-tab>
 *
 * </ion-tabs>
 * ```
 *
 * @param {string=} delegate-handle The handle used to identify these tabs
 * with {@link ionic.service:$ionicTabsDelegate}.
 */

IonicModule
.directive('ionTabs', [
  '$ionicTabsDelegate',
  '$ionicConfig',
function($ionicTabsDelegate, $ionicConfig) {
  return {
    restrict: 'E',
    scope: true,
    controller: '$ionicTabs',
    compile: function(tElement) {
      //We cannot use regular transclude here because it breaks element.data()
      //inheritance on compile
      var innerElement = jqLite('<div class="tab-nav tabs">');
      innerElement.append(tElement.contents());

      tElement.append(innerElement)
              .addClass( $ionicConfig.tabs.position() )
              .addClass( $ionicConfig.tabs.type() );

      return { pre: prelink, post: postLink };
      function prelink($scope, $element, $attr, tabsCtrl) {
        var deregisterInstance = $ionicTabsDelegate._registerInstance(
          tabsCtrl, $attr.delegateHandle
        );

        tabsCtrl.$scope = $scope;
        tabsCtrl.$element = $element;
        tabsCtrl.$tabsElement = jqLite($element[0].querySelector('.tabs'));

        $scope.$watch(function() { return $element[0].className; }, function(value) {
          var isTabsTop = value.indexOf('tabs-top') !== -1;
          var isHidden = value.indexOf('tabs-item-hide') !== -1;
          $scope.$hasTabs = !isTabsTop && !isHidden;
          $scope.$hasTabsTop = isTabsTop && !isHidden;
        });

        $scope.$on('$destroy', function(){
          // variable to inform child tabs that they're all being blown away
          // used so that while destorying an individual tab, each one
          // doesn't select the next tab as the active one, which causes unnecessary
          // loading of tab views when each will eventually all go away anyway
          $scope.$tabsDestroy = true;
          deregisterInstance();
          tabsCtrl.$tabsElement = tabsCtrl.$element = tabsCtrl.$scope = innerElement = null;
          delete $scope.$hasTabs;
          delete $scope.$hasTabsTop;
        });
      }

      function postLink($scope, $element, $attr, tabsCtrl) {
        if (!tabsCtrl.selectedTab()) {
          // all the tabs have been added
          // but one hasn't been selected yet
          tabsCtrl.select(0);
        }
      }
    }
  };
}]);

/**
 * @ngdoc directive
 * @name ionToggle
 * @module ionic
 * @codepen tfAzj
 * @restrict E
 *
 * @description
 * A toggle is an animated switch which binds a given model to a boolean.
 *
 * Allows dragging of the switch's nub.
 *
 * The toggle behaves like any [AngularJS checkbox](http://docs.angularjs.org/api/ng/input/input[checkbox]) otherwise.
 *
 * @param toggle-class {string=} Sets the CSS class on the inner `label.toggle` element created by the directive.
 *
 * @usage
 * Below is an example of a toggle directive which is wired up to the `airplaneMode` model
 * and has the `toggle-calm` CSS class assigned to the inner element.
 *
 * ```html
 * <ion-toggle ng-model="airplaneMode" toggle-class="toggle-calm">Airplane Mode</ion-toggle>
 * ```
 */
IonicModule
.directive('ionToggle', [
  '$ionicGesture',
  '$timeout',
function($ionicGesture, $timeout) {

  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    transclude: true,
    template:
      '<div class="item item-toggle">' +
        '<div ng-transclude></div>' +
        '<label class="toggle">' +
          '<input type="checkbox">' +
          '<div class="track">' +
            '<div class="handle"></div>' +
          '</div>' +
        '</label>' +
      '</div>',

    compile: function(element, attr) {
      var input = element.find('input');
      forEach({
        'name': attr.name,
        'ng-value': attr.ngValue,
        'ng-model': attr.ngModel,
        'ng-checked': attr.ngChecked,
        'ng-disabled': attr.ngDisabled,
        'ng-true-value': attr.ngTrueValue,
        'ng-false-value': attr.ngFalseValue,
        'ng-change': attr.ngChange
      }, function(value, name) {
        if (isDefined(value)) {
          input.attr(name, value);
        }
      });

      if(attr.toggleClass) {
        element[0].getElementsByTagName('label')[0].classList.add(attr.toggleClass);
      }

      return function($scope, $element, $attr) {
         var el, checkbox, track, handle;

         el = $element[0].getElementsByTagName('label')[0];
         checkbox = el.children[0];
         track = el.children[1];
         handle = track.children[0];

         var ngModelController = jqLite(checkbox).controller('ngModel');

         $scope.toggle = new ionic.views.Toggle({
           el: el,
           track: track,
           checkbox: checkbox,
           handle: handle,
           onChange: function() {
             if(checkbox.checked) {
               ngModelController.$setViewValue(true);
             } else {
               ngModelController.$setViewValue(false);
             }
             $scope.$apply();
           }
         });

         $scope.$on('$destroy', function() {
           $scope.toggle.destroy();
         });
      };
    }

  };
}]);

/**
 * @ngdoc directive
 * @name ionView
 * @module ionic
 * @restrict E
 * @parent ionNavView
 *
 * @description
 * A container for content, used to tell a parent {@link ionic.directive:ionNavBar}
 * about the current view.
 *
 * @usage
 * Below is an example where our page will load with a navbar containing "My Page" as the title.
 *
 * ```html
 * <ion-nav-bar></ion-nav-bar>
 * <ion-nav-view class="slide-left-right">
 *   <ion-view title="My Page">
 *     <ion-content>
 *       Hello!
 *     </ion-content>
 *   </ion-view>
 * </ion-nav-view>
 * ```
 *
 * @param {string=} title The title to display on the parent {@link ionic.directive:ionNavBar}.
 * @param {boolean=} hide-back-button Whether to hide the back button on the parent
 * {@link ionic.directive:ionNavBar} by default.
 * @param {boolean=} hide-nav-bar Whether to hide the parent
 * {@link ionic.directive:ionNavBar} by default.
 */
IonicModule
.directive('ionView', function() {
  return {
    restrict: 'EA',
    priority: 1000,
    controller: '$ionView',
    compile: function(tElement) {
      tElement.addClass('pane');
      return function link($scope, $element, $attrs, viewCtrl) {
        viewCtrl.init();
      };
    }
  };
});

/**
 * @ngdoc directive
 * @name viewDirection
 * @module ionic
 * @restrict A
 *
 * @description
 *
 * @usage
 *
 * ```html
 * <a view-direction="forward" href="#/home">Home</a>
 * ```
 */
IonicModule
.directive('viewDirection', ['$ionicViewSwitcher', function($ionicViewSwitcher) {
  return {
    restrict: 'A',
    priority: 1000,
    link: function($scope, $element, $attr) {
      $element.bind('click', function(){
        $ionicViewSwitcher.nextDirection( $attr.viewDirection );
      });
    }
  };
}]);

/**
 * @ngdoc directive
 * @name viewTransition
 * @module ionic
 * @restrict A
 *
 * @description
 *
 * @usage
 *
 * ```html
 * <a view-transition="none" href="#/home">Home</a>
 * ```
 */
IonicModule
.directive('viewTransition', ['$ionicViewSwitcher', function($ionicViewSwitcher) {
  return {
    restrict: 'A',
    priority: 1000,
    link: function($scope, $element, $attr) {
      $element.bind('click', function(){
        $ionicViewSwitcher.nextTransition( $attr.viewTransition );
      });
    }
  };
}]);

})();