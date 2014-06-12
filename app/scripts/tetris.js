//# sourceURL=dynamicScript.js
'use strict';

/* Original Author: Jake S. Gordon
   https://github.com/jakesgordon

   Modified by: Eddie Ng
   https://github.com/wardsng
*/


//-------------------------------------------------------------------------
// base helper methods
//-------------------------------------------------------------------------

function get(id)        { return document.getElementById(id);  }
function hide(id)       { get(id).style.visibility = 'hidden'; }
function show(id)       { get(id).style.visibility = null;     }
function html(id, htmlInner) { get(id).innerHTML = htmlInner;  }

//------------------------------------------------
// do the bit manipulation and iterate through each
// occupied block (x,y) for a given piece
//------------------------------------------------
function eachblock(type, x, y, dir, fn) {
  var bit, result, row = 0, col = 0, blocks = type.blocks[dir];
  for (bit = 0x8000 ; bit > 0 ; bit = bit >> 1) {
    if (blocks & bit) {
      fn(x + col, y + row);
    }
    if (++col === 4) {
      col = 0;
      ++row;
    }
  }
}

function getBlock(blocks,x,y)   { return (blocks && blocks[x] ? blocks[x][y] : null); }

function draw(ctx, canvas, uctx, boardRepresentation) {
  ctx.save();
  ctx.lineWidth = uctx.lineWidth = 1;
  ctx.translate(0.5, 0.5); // for crisp 1px black lines

  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.shadowBlur = 1;
  ctx.shadowColor = 'rgba(204, 204, 204, 0.5)';

  ctx.globalAlpha = uctx.globalAlpha = 0.7;

  drawCourt(ctx, canvas, boardRepresentation);
  drawNext(uctx, canvas, boardRepresentation);

  ctx.restore();
}

function drawCourt(ctx, canvas, boardRepresentation) {
  var invalid = boardRepresentation.invalid;
  var current = boardRepresentation.current;
  var playing = boardRepresentation.playing;
  var blocks = boardRepresentation.blocks;

  var nx = boardRepresentation.nx;
  var ny = boardRepresentation.ny;

  var dx = canvas.width  / nx / 2; // pixel size of a single tetris block
  var dy = canvas.height / ny; // (ditto)

  if (invalid.court) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (playing){
      drawPiece(ctx, current.type, current.x, current.y, current.dir, dx, dy);
    }

    var x, y, block;
    for(y = 0 ; y < ny ; y++) {
      for (x = 0 ; x < nx ; x++) {
        block = getBlock(blocks, x, y);
        if (block) {
          drawBlock(ctx, x, y, block.color, dx, dy);
        }
      }
    }
    ctx.strokeStyle = 'white';
    ctx.strokeRect(0, 0, nx*dx - 1, ny*dy - 1); // court boundary
    invalid.court = false;
  }
}

// var counter = 0;
function drawNext(uctx, canvas, boardRepresentation) {
  var invalid = boardRepresentation.invalid;
  var next = boardRepresentation.next;
  var nu = boardRepresentation.nu;
  var nx = boardRepresentation.nx;
  var ny = boardRepresentation.ny;

  var dx = canvas.width  / nx / 2; // pixel size of a single tetris block
  var dy = canvas.height / ny; // (ditto)

  if (invalid.next) {
    var padding = (nu - next.type.size) / 2; // half-arsed attempt at centering next piece display
    uctx.save();
    uctx.translate(0.5, 0.5);
    uctx.clearRect(0, 0, nu*dx, nu*dy);
    drawPiece(uctx, next.type, padding, padding, next.dir, dx, dy);
    uctx.strokeStyle = 'black';
    uctx.strokeRect(0, 0, nu*dx - 1, nu*dy - 1);
    uctx.restore();
    invalid.next = false;
  }
}

function drawVScore(scoreID, boardRepresentation) {
  var invalid = boardRepresentation.invalid;
  var vscore = boardRepresentation.vscore;

  if (invalid.score) {
    html(scoreID, ("00000" + Math.floor(vscore)).slice(-5));
    invalid.score = false;
  }
}

function drawScore(scoreID, boardRepresentation) {
  var invalid = boardRepresentation.invalid;
  var score = boardRepresentation.score;

  if (invalid.score) {
    html(scoreID, ("00000" + Math.floor(score)).slice(-5));
    invalid.score = false;
  }
}

function drawRows(rowsID, boardRepresentation) {
  var invalid = boardRepresentation.invalid;
  var rows = boardRepresentation.rows;

  if (invalid.rows) {
    html(rowsID, rows);
    invalid.rows = false;
  }
}

function drawPiece(ctx, type, x, y, dir, dx, dy) {
  eachblock(type, x, y, dir, function(x, y) {
    drawBlock(ctx, x, y, type.color, dx, dy);
  });
}

function drawBlock(ctx, x, y, color, dx, dy) {
  ctx.fillStyle = color;
  ctx.fillRect(x*dx, y*dy, dx, dy);
  ctx.strokeRect(x*dx, y*dy, dx, dy);

  ctx.save();

  ctx.fillStyle = '#333';
  ctx.fillRect(x*dx+2, y*dy+2, dx-4, dy-4);

  ctx.restore();
}

window.eachblock = eachblock;
window.getBlock = getBlock;
window.draw = draw;
window.drawCourt = drawCourt;
window.drawNext = drawNext;
window.drawScore = drawScore;
window.drawVScore = drawVScore;
window.drawRows = drawRows;
window.drawPiece = drawPiece;
window.drawBlock = drawBlock;


(function() {
  function timestamp()           { return new Date().getTime();                             }
  function random(min, max)      { return (min + (Math.random() * (max - min)));            }
  function randomChoice(choices) { return choices[Math.round(random(0, choices.length-1))]; }

  if (!window.requestAnimationFrame) {
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
                                   window.mozRequestAnimationFrame    ||
                                   window.oRequestAnimationFrame      ||
                                   window.msRequestAnimationFrame     ||
                                   function(callback, element) {
                                     window.setTimeout(callback, 1000 / 60);
                                   };
  }

  //-------------------------------------------------------------------------
  // game constants
  //-------------------------------------------------------------------------

  var KEY     = { ESC: 27, SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 },
      DIR     = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3, MIN: 0, MAX: 3 },
      stats   = new Stats(),
      canvas  = get('my-gamecanvas'),
      ctx     = canvas.getContext('2d'),
      ucanvas = get('upcoming'),
      uctx    = ucanvas.getContext('2d'),
      // othercanvas  = get('their-gamecanvas'),
      // otherctx     = othercanvas.getContext('2d'),
      // otherucanvas = get('their-upcoming'),
      // otheructx    = otherucanvas.getContext('2d'),
      speed   = { start: 0.6, decrement: 0.005, min: 0.1 }, // how long before piece drops by 1 row (seconds)
      nx      = 10, // width of tetris court (in blocks)
      ny      = 20, // height of tetris court (in blocks)
      nu      = 5;  // width/height of upcoming preview (in blocks)

  //-------------------------------------------------------------------------
  // game variables (initialized during reset)
  //-------------------------------------------------------------------------

  var dx, dy,        // pixel size of a single tetris block
      blocks,        // 2 dimensional array (nx*ny) representing tetris court - either empty block or occupied by a 'piece'
      actions,       // queue of user actions (inputs)
      tasks,         // queue of game actions (e.g. garbage blocks)
      playing,       // true|false - game is in progress
      dt,            // time since starting this game
      current,       // the current piece
      next,          // the next piece
      score,         // the current score
      vscore,        // the currently displayed score (it catches up to score in small chunks - like a spinning slot machine)
      rows,          // number of completed rows in the current game
      step;          // how long before current piece drops by 1 row

  //-------------------------------------------------------------------------
  // tetris pieces
  //
  // blocks: each element represents a rotation of the piece (0, 90, 180, 270)
  //         each element is a 16 bit integer where the 16 bits represent
  //         a 4x4 set of blocks, e.g. j.blocks[0] = 0x44C0
  //
  //             0100 = 0x4 << 3 = 0x4000
  //             0100 = 0x4 << 2 = 0x0400
  //             1100 = 0xC << 1 = 0x00C0
  //             0000 = 0x0 << 0 = 0x0000
  //                               ------
  //                               0x44C0
  //
  //-------------------------------------------------------------------------

  var tetrominosCollection = {
    i: { size: 4, blocks: [0x0F00, 0x2222, 0x00F0, 0x4444], color: 'cyan' },
    j: { size: 3, blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20], color: 'blue' },
    l: { size: 3, blocks: [0x4460, 0x0E80, 0xC440, 0x2E00], color: 'orange' },
    o: { size: 2, blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00], color: 'yellow' },
    s: { size: 3, blocks: [0x06C0, 0x8C40, 0x6C00, 0x4620], color: 'green' },
    t: { size: 3, blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640], color: 'purple' },
    z: { size: 3, blocks: [0x0C60, 0x4C80, 0xC600, 0x2640], color: 'red' }
  };

  var garbageBlock = { color: 'D3D3D3'};

  //-----------------------------------------------------
  // check if a piece can fit into a position in the grid
  //-----------------------------------------------------
  function occupied(type, x, y, dir) {
    var result = false;
    eachblock(type, x, y, dir, function(x, y) {
      if ((x < 0) || (x >= nx) || (y < 0) || (y >= ny) || getBlock(blocks,x,y)) {
        result = true;
      }
    });
    return result;
  }

  function unoccupied(type, x, y, dir) {
    return !occupied(type, x, y, dir);
  }

  //-----------------------------------------
  // start with 4 instances of each piece and
  // pick randomly until the 'bag is empty'
  //-----------------------------------------
  var pieces = [];
  function shuffle(o) {
    for(var j, x, i = o.length; i;
      j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  }

  function randomPiece(instances) {
    if (pieces.length === 0) {
      var types = Object.keys(tetrominosCollection);
      var instanceCounts = instances || 4;
      types.forEach(function(type) {
        for (var count = 0; count < instanceCounts; count++) {
          pieces.push(tetrominosCollection[type]);
        }
      });
      pieces = shuffle(pieces);
    }
    var piece = pieces.pop();
    return { type: piece, dir: DIR.UP, x: 2, y: 0 };
  }


  //-------------------------------------------------------------------------
  // GAME LOOP
  //-------------------------------------------------------------------------

  var gameOverEvent = new Event('gameOver');
  var gameStartEvent = new Event('gameStart');
  var boardChangeEvent = new Event('boardChange');
  var garbageRowEvent = new Event('garbageRow');

  function run() {

    showStats(); // initialize FPS counter
    addEvents(); // attach keydown and resize events

    var last, now, sendTimeLast, sendTimeNow;
    last = now = timestamp();
    sendTimeLast = sendTimeNow = timestamp();

    function frame() {
      var boardRepresentation;

      now = timestamp();

      if (playing) {
        update(Math.min(1, (now - last) / 1000.0));

        sendTimeNow = timestamp();

        if (sendTimeNow - sendTimeLast > 1000/30) {
          boardRepresentation = collectBoardRepresentation();

          // Dispatch the event
          boardChangeEvent.boardRepresentation = boardRepresentation;
          document.dispatchEvent(boardChangeEvent);

          // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
          draw(ctx, canvas, uctx, boardRepresentation);
          drawVScore('score', boardRepresentation);
          drawRows('cleared-rows', boardRepresentation);

          resetBoardInvalidity(boardRepresentation);

          sendTimeLast = sendTimeNow;
        }
      }

      stats.update();
      last = now;
      window.requestAnimationFrame(frame, canvas);
    }

    resize(); // setup all our sizing information
    reset();  // reset the per-game variables
    frame();  // start the first frame

  }

  function showStats() {
    stats.domElement.id = 'stats';
    get('stats-menu').appendChild(stats.domElement);
  }

  function addEvents() {
    document.addEventListener('keydown', keydown, false);
    window.addEventListener('resize', resize, false);
  }

  function resize(event) {
    canvas.width   = canvas.clientWidth;  // set canvas logical size equal to its physical size
    canvas.height  = canvas.clientHeight; // (ditto)
    ucanvas.width  = ucanvas.clientWidth;
    ucanvas.height = ucanvas.clientHeight;

    dx = canvas.width  / nx / 2; // pixel size of a single tetris block
    dy = canvas.height / ny; // (ditto)
    invalidate();
    invalidateNext();
  }

  function keydown(ev) {
    var handled = false;
    if (playing) {
      switch(ev.keyCode) {
        case KEY.LEFT:   actions.push(DIR.LEFT);  handled = true; break;
        case KEY.RIGHT:  actions.push(DIR.RIGHT); handled = true; break;
        case KEY.UP:     actions.push(DIR.UP);    handled = true; break;
        case KEY.DOWN:   actions.push(DIR.DOWN);  handled = true; break;
        // case KEY.ESC:    lose(true);                  handled = true; break;
        case KEY.SPACE:  actions.push('FASTDROP'); handled = true; break;
      }
    }
    // if (ev.keyCode == KEY.ESC) {
    //   play();
    //   handled = true;
    // }
    if (handled){
      ev.preventDefault(); // prevent arrow keys from scrolling the page (supported in IE9+ and all other browsers)
    }
  }

  //-------------------------------------------------------------------------
  // GAME LOGIC
  //-------------------------------------------------------------------------

  function play() {
    reset();
    playing = true;
    console.log('Starting game!');
  }
  window.play = play;

  function lose(orig) {
    if (orig) {
      dispatchGameOver();
    }
    setVisualScore();
    playing = false;
  }
  window.lose = lose;

  function dispatchGameOver() {
    gameOverEvent.gameOver = true;
    document.dispatchEvent(gameOverEvent);
  }

  function setVisualScore(n)      { vscore = n || score; invalidateScore(); }
  function setScore(n)            { score = n; setVisualScore(n);  }
  function addScore(n)            { score = score + n;   }
  function clearScore()           { setScore(0); }
  function clearRows()            { setRows(0); }
  function setRows(n)             { rows = n; step = Math.max(speed.min, speed.start - (speed.decrement*rows)); invalidateRows(); }
  function addRows(n)             { setRows(rows + n); }
  function setBlock(x,y,type)     { blocks[x] = blocks[x] || []; blocks[x][y] = type; invalidate(); }
  function clearBlocks()          { blocks = []; invalidate(); }
  function clearActions()         { actions = []; }
  function clearTasks()           { tasks = []; }
  function setCurrentPiece(piece) { current = piece || randomPiece(); invalidate();     }
  function setNextPiece(piece)    { next    = piece || randomPiece(); invalidateNext(); }

  function reset() {
    dt = 0;
    clearActions();
    clearTasks();
    clearBlocks();
    clearRows();
    clearScore();
    setCurrentPiece(next);
    setNextPiece();
  }

  function update(idt) {
    if (playing) {
      if (vscore < score) {
        setVisualScore(vscore + 1);
      }
      handle(actions.shift());
      dt = dt + idt;
      if (dt > step) {
        dt = dt - step;
        drop();
      }
    }
  }

  function handle(action) {
    switch(action) {
      case DIR.LEFT:  move(DIR.LEFT);  break;
      case DIR.RIGHT: move(DIR.RIGHT); break;
      case DIR.UP:    rotate();        break;
      case DIR.DOWN:  drop();          break;
      case 'FASTDROP': fastdrop();     break;
    }
  }

  function move(dir) {
    var x = current.x, y = current.y;
    switch(dir) {
      case DIR.RIGHT: x = x + 1; break;
      case DIR.LEFT:  x = x - 1; break;
      case DIR.DOWN:  y = y + 1; break;
    }
    if (unoccupied(current.type, x, y, current.dir)) {
      current.x = x;
      current.y = y;
      invalidate();
      return true;
    }
    else {
      return false;
    }
  }

  function rotate(dir) {
    var newdir = (current.dir === DIR.MAX ? DIR.MIN : current.dir + 1);
    if (unoccupied(current.type, current.x, current.y, newdir)) {
      current.dir = newdir;
      invalidate();
    }
  }

  function fastdrop() {
    while(move(DIR.DOWN)) {}
    drop();
  }

  function drop() {
    if (!move(DIR.DOWN)) {
      addScore(10);
      dropPiece();
      removeLines();
      setCurrentPiece(next);
      setNextPiece(randomPiece());
      clearActions();
      handleQueuedTasks();
      if (occupied(current.type, current.x, current.y, current.dir)) {
        lose(true);
      }
    }
  }

  function dropPiece() {
    eachblock(current.type, current.x, current.y, current.dir, function(x, y) {
      setBlock(x, y, current.type);
    });
  }

  function removeLines() {
    var x, y, complete, n = 0;
    for(y = ny ; y > 0 ; --y) {
      complete = true;
      for(x = 0 ; x < nx ; ++x) {
        if (!getBlock(blocks, x, y))
          complete = false;
      }
      if (complete) {
        removeLine(y);
        y = y + 1; // recheck same line
        n++;
      }
    }
    if (n > 0) {
      addRows(n);
      addScore(100*Math.pow(2,n-1)); // 1: 100, 2: 200, 3: 400, 4: 800

      // Emit garbage rows
      garbageRowEvent.garbageRows = n;
      document.dispatchEvent(garbageRowEvent);

    }
  }

  function addGarbageLines(n) {
    // console.log("Adding ", n, " garbage lines");
    var x, y;
    var holeIndex = Math.floor(Math.random()*nx);

    // Push everything up by "n"
    for (y = 0; y < ny-n ; ++y) {
      for(x = 0; x < nx; ++x) {
        setBlock(x, y, getBlock(blocks, x, y+n));
      }
    }

    for(y = ny; y >= ny-n ; --y) {
      for(x = 0 ; x < nx ; ++x) {
        setBlock(x, y, garbageBlock);
      }
      setBlock(holeIndex, y, null);
    }
  }

  window.queueGarbageLines = function(n) {
    tasks.push( function() { addGarbageLines(n); } );
  };

  function handleQueuedTasks() {
    tasks.forEach(function(task) {
      task.call(null);
    });
    clearTasks();
  }

  function removeLine(n) {
    var x, y;
    for(y = n ; y >= 0 ; --y) {
      for(x = 0 ; x < nx ; ++x)
        setBlock(x, y, (y == 0) ? null : getBlock(blocks, x, y-1));
    }
  }

  // contains game board representation
  // function GameBoard() {
  //   this.current; // current piece
  //   this.next; // next piece
  //   this.ny; // rows (in blocks)
  //   this.nx; // cols (in blocks)
  //   this.nu; // width/height of upcoming preview (in blocks)


  //   this.blocks;   // 2 dimensional array (nx*ny) representing tetris court - either empty block or occupied by a 'piece'
  //   this.playing;       // true|false - game is in progress
  //   this.dt;            // time since starting this game
  //   this.current;       // the current piece
  //   this.next;          // the next piece
  //   this.score;         // the current score
  //   this.vscore;        // the currently displayed score (it catches up to score in small chunks - like a spinning slot machine)
  //   this.rows;          // number of completed rows in the current game
  //   this.step;          // how long before current piece drops by 1 row
  // }

  function collectBoardRepresentation() {
    var result = {
      invalid: invalid,
      blocks: blocks,
      playing: playing,
      current: current,
      next: next,
      score: score,
      vscore: vscore,
      rows: rows,
      step: step,
      nu: nu,
      nx: nx,
      ny: ny
    };
    return result;
  }

  function resetBoardInvalidity(boardRepresentation) {
    invalid = boardRepresentation.invalid;
  }

  //-------------------------------------------------------------------------
  // RENDERING
  //-------------------------------------------------------------------------

  var invalid = {};

  function invalidate()         { invalid.court  = true; }
  function invalidateNext()     { invalid.next   = true; }
  function invalidateScore()    { invalid.score  = true; }
  function invalidateRows()     { invalid.rows   = true; }

  //-------------------------------------------------------------------------
  // FINALLY, lets run the game
  //-------------------------------------------------------------------------

  run();

  soundManager.setup({
    url: '/sounds/',
    onready: function() {
      console.log('SoundManager ready');
      var tetrisTheme = soundManager.createSound({
        url: '/sounds/tetris-theme.mp3'
      });

      function loopSound(sound) {
        sound.play({
          onfinish: function() {
            loopSound(sound);
          }
        });
      }

      tetrisTheme.loopSound = loopSound.bind(null, tetrisTheme);

      // Make tetrisTheme globally available to window
      window.tetrisMusic = tetrisTheme;
    },
    ontimeout: function() {
      console.log('No HTML5 support, SWF missing, Flash blocked, or other issue');
    }

  });

})();