var Immutable = require('immutable');

/**
*
* Immutable State constructor with state history stack
* @constructor
* @param {object} initialState
*/

module.exports = function State(initialState){

  // private stack of app states
  // never manipulate history stack directly, use State methods
  var history = [ new Immutable.Map(initialState) ];
  // pointer to current state of history
  var historyIndex = 0;


  Object.defineProperty(this,'state',{
    get: function(){
      return new Immutable.Map(history[historyIndex]).toJS();
    },
    // ensure that setting state via assignment performs an immutable operation
    set: function(s){
      let currentState = history[historyIndex];
      if(typeof s === 'function'){
        s = s( history[historyIndex].toJS() );
      }

      let newState = currentState.merge(s);
      history = history.slice(0,historyIndex + 1);
      history.push(newState);
      historyIndex++;
      return new Immutable.Map(history[historyIndex]).toJS();
    }
  });


  /**
  *
  * @name setState
  * @desc merge create a new state by merging into the current state and
  * updating the historyIndex
  * @param {object|function} s - If passed as an object, a new state is created by merging `s` into the current
  *   state. If passed as a function, the function receives the current state as a javascript object, and the
  *   function's return value is merged into the current state to create a new state
  * @param {boolean} asIterable - If `true`, and a function is passed as first argument, then that function
  *   will get the current state passed to it as an Immutable.Map, rather than a raw javascript object.
  * @returns {object} state
  */
  this.setState = function setState(s,asIterable){
    if(typeof s === 'function'){
      if(asIterable === true){
        s = s(this.getImmutableState());
      }else{
        s = s(this.state);
      }
    }
    let newState = this.getImmutableState().merge(s);
    history = history.slice(0,historyIndex + 1);
    history.push(newState);
    historyIndex++;
    return this.state;
  };


  /**
  *
  * @name getImmutable
  * @desc return the current state as an Immutable Map
  * @returns Immutable.Map
  */
  this.getImmutableState = function getImmutableState(){
    return new Immutable.Map( history[historyIndex]);
  };


  /**
  *
  * @name getInitialState
  * @desc get the initial app state that was passed to the constructor
  * @returns {object} state
  */
  this.getInitialState = function getInitialState(){
    return new Immutable.Map( history[0] ).toJS();
  };


  /**
  *
  * @name getStateAtVersion
  * @desc get the app's state at a version in the state history
  * @param {int} index
  * @returns {object} state
  */
  this.getStateAtVersion = function getStateAtVersion(index){
    return new Immutable.Map( history[index] ).toJS();
  };


  /**
  *
  * @name reset
  * @desc reset the app to it's original state
  * @param {boolean} force - delete state history
  * @returns {object} state
  */
  this.reset = function reset(force){
    let _initialState = this.getInitialState();
    if(force === true){
      // hard reset, clears the entire history stack, no previous history are saved
      history = [new Immutable.Map(_initialState)];
      historyIndex = 0;
    }else{
      // soft reset, push the initial state to the end of the history stack
      history.push(new Immutable.Map(_initialState));
      historyIndex++;
    }
    return this.state;
  };


  /**
  *
  * @name rewind
  * @desc rewind the app history n versions. If `n` is greater than length of
  * history stack, history will rewind to initial state.
  * If `n` is less than zero, no rewind will occur
  * @param {int} n - number of versions back to go
  * @returns {object} state
  */
  this.rewind = function rewind(n){
    if(n < 0) n = 0;
    let target = historyIndex - n;
    if(target > 0){
      historyIndex = target;
    }else{
      historyIndex = 0;
    }
    return this.state;
  };

  /**
  *
  * @name canUndo
  * @desc can an undo operation be performed on the state?
  * @returns {boolean}
  */
  Object.defineProperty(this,'canUndo',{
    get: function(){
      return (historyIndex > 0);
    }
  });


  /**
  *
  * @name canRedo
  * @desc can a redo operation be performed on the state?
  * @returns {boolean}
  */
  Object.defineProperty(this,'canRedo',{
    get: function(){
      return historyIndex !== (history.length - 1);
    }
  });

  /**
  *
  * @name undo
  * @desc If possible, move the history stack's HEAD back one version
  * @returns {object} state
  */
  this.undo = function undo(){
    if(this.canUndo){
      historyIndex = historyIndex - 1;
    }
    return this.state;
  };

  /**
  *
  * @name redo
  * @desc If possible, move the history stack's HEAD ahead one version
  * @returns {object} state
  */
  this.redo = function redo(){
    if(this.canRedo){
      historyIndex++;
    }
    return this.state;
  };

  this.getIndex = function getIndex(){
    return historyIndex;
  };
}
