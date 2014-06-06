'use strict';

angular.module('gameRtcApp.directives')
  .directive('tetrisCanvas', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        var ctx = element[0].getContext('2d');
        var uctx =





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
          ctx.lineWidth = 1;
          ctx.translate(0.5, 0.5); // for crisp 1px black lines

          drawCourt(ctx, canvas, boardRepresentation);
          drawNext(uctx, boardRepresentation);
          drawScore(boardRepresentation);
          drawRows(boardRepresentation);

          ctx.restore();
        }

        function drawCourt(ctx, canvas, boardRepresentation) {
          var invalid = boardRepresentation.invalid;
          var current = boardRepresentation.current;
          var playing = boardRepresentation.playing;
          var blocks = boardRepresentation.blocks;
          var dx = boardRepresentation.dx;
          var dy = boardRepresentation.dy;
          var nx = boardRepresentation.nx;
          var ny = boardRepresentation.ny;

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
            //ctx.strokeRect(0, 0, nx*dx - 1, ny*dy - 1); // court boundary
            invalid.court = false;
          }
        }

        function drawNext(uctx, boardRepresentation) {
          var invalid = boardRepresentation.invalid;
          var next = boardRepresentation.next;
          var nu = boardRepresentation.nu;
          var dx = boardRepresentation.dx;
          var dy = boardRepresentation.dy;

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

        function drawScore(boardRepresentation) {
          var invalid = boardRepresentation.invalid;
          var vscore = boardRepresentation.vscore;

          if (invalid.score) {
            html('score', ("00000" + Math.floor(vscore)).slice(-5));
            invalid.score = false;
          }
        }

        function drawRows(boardRepresentation) {
          var invalid = boardRepresentation.invalid;
          var rows = boardRepresentation.rows;

          if (invalid.rows) {
            html('rows', rows);
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
        }








      }
    };
  });
