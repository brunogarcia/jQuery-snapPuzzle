/*
	jQuery snapPuzzle v1.0.0
    Copyright (c) 2014 Hans Braxmeier / Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/jQuery-snapPuzzle
	License: http://www.opensource.org/licenses/mit-license.php
*/

(function($){
    $.fn.snapPuzzle = function(options){
        var o = $.extend({ pile: '', randomly: true, containment: 'document', rows: 5, columns: 5, onComplete: function(){} }, options);
        positions = [];

        // public methods
        if (typeof options == 'string') {
            this.each(function(){
                var that = $(this),
                    o = that.data('options'),
                    pieceWidth = that.width() / o.columns,
                    pieceHeight = that.height() / o.rows,
                    pile = $(o.pile),
                    maxX = pile.width() - pieceWidth,
                    maxY = pile.height() - pieceHeight,
                    puzzle_offset = that.closest('span').offset(),
                    pile_offset = pile.offset();

                if (options == 'destroy') {
                    $('.'+o.puzzle_class).remove();
                    that.unwrap().removeData('options');
                    pile.removeClass('snappuzzle-pile');
                } else if (options == 'refresh') {
                    if (!randomly) {
                      createPositions({'pieceWidth': pieceWidth, 'pieceHeight': pieceHeight, 'columns': o.columns, 'rows': o.rows});
                    }
                    $('.snappuzzle-slot.'+o.puzzle_class).each(function(){
                        var x_y = $(this).data('pos').split('_'), x = x_y[0], y = x_y[1];
                        $(this).css({
                            width: pieceWidth,
                            height: pieceHeight,
                            left: y*pieceWidth,
                            top: x*pieceHeight
                        });
                    });
                    $('.snappuzzle-piece.'+o.puzzle_class).each(function(){
                        var position = getPosition({'maxX': maxX, 'maxY': maxY});
                        if ($(this).data('slot')) {
                            // placed on slot
                            var x_y = $(this).data('slot').split('_'), slot_x = x_y[0], slot_y = x_y[1],
                                x_y = $(this).data('pos').split('_'), pos_x = x_y[0], pos_y = x_y[1];;
                            $(this).css({
                                width: pieceWidth,
                                height: pieceHeight,
                                left: slot_y*pieceWidth+puzzle_offset.left-pile_offset.left,
                                top: slot_x*pieceHeight+puzzle_offset.top-pile_offset.top,
                                backgroundPosition: (-pos_y*pieceWidth)+'px '+(-pos_x*pieceHeight)+'px',
                                backgroundSize: that.width()
                            });
                        } else {
                            // placed anywhere else
                            var x_y = $(this).data('pos').split('_'), x = x_y[0], y = x_y[1];
                            $(this).css({
                                width: pieceWidth,
                                height: pieceHeight,
                                left: position.left,
                                top: position.top,
                                backgroundPosition: (-y*pieceWidth)+'px '+(-x*pieceHeight)+'px',
                                backgroundSize: that.width()
                            });
                        }
                    });
                }
            });
            return this;
        }

        function init(that){
            var puzzle_class = 'sp_'+new Date().getTime(),
                puzzle = that.wrap('<span class="snappuzzle-wrap"/>').closest('span'),
                src = that.attr('src'),
                pieceWidth = that.width() / o.columns,
                pieceHeight = that.height() / o.rows,
                pile = $(o.pile).addClass('snappuzzle-pile'),
                maxX = pile.width() - pieceWidth,
                maxY = pile.height() - pieceHeight;
                randomly = o.randomly;

            o.puzzle_class = puzzle_class;
            that.data('options', o);

            if (!randomly) {
              createPositions({'pieceWidth': pieceWidth, 'pieceHeight': pieceHeight, 'columns': o.columns, 'rows': o.rows});
            }

            for (var x=0; x<o.rows; x++) {
                for (var y=0; y<o.columns; y++) {
                    var position = getPosition({'maxX': maxX, 'maxY': maxY});
                    $('<div class="snappuzzle-piece '+puzzle_class+'"/>').data('pos', x+'_'+y).css({
                        width: pieceWidth,
                        height: pieceHeight,
                        position: 'absolute',
                        left: position.left,
                        top: position.top,
                        zIndex: Math.floor((Math.random()*10)+1),
                        backgroundImage: 'url('+src+')',
                        backgroundPosition: (-y*pieceWidth)+'px '+(-x*pieceHeight)+'px',
                        backgroundSize: that.width()
                    }).draggable({
                        start: function(e, ui){ $(this).removeData('slot'); },
                        stack: '.snappuzzle-piece',
                        containment: o.containment
                    }).appendTo(pile).data('lastSlot', pile);

                    $('<div class="snappuzzle-slot '+puzzle_class+'"/>').data('pos', x+'_'+y).css({
                        width: pieceWidth,
                        height: pieceHeight,
                        left: y*pieceWidth,
                        top: x*pieceHeight
                    }).appendTo(puzzle).droppable({
                        accept: '.'+puzzle_class,
                        hoverClass: 'snappuzzle-slot-hover',
                        drop: function(e, ui){
                            var slot_pos = $(this).data('pos');

                            // prevent dropping multiple pieces on one slot
                            $('.snappuzzle-piece.'+puzzle_class).each(function(){
                                if ($(this).data('slot') == slot_pos) slot_pos = false;
                            });
                            if (!slot_pos) return false;

                            ui.draggable.data('lastSlot', $(this)).data('slot', slot_pos);
                            ui.draggable.position({ of: $(this), my: 'left top', at: 'left top' });
                            if (ui.draggable.data('pos')==slot_pos) {
                                ui.draggable.addClass('correct');
                                // fix piece
                                // $(this).droppable('disable').fadeIn().fadeOut();
                                $(this).droppable('disable').css('opacity', 1).fadeOut(1000);
                                ui.draggable.css({opacity: 0, cursor: 'default'}).draggable('disable');
                                if ($('.snappuzzle-piece.correct.'+puzzle_class).length == o.rows*o.columns) o.onComplete(that);
                            }
                        }
                    });
                }
            }
        }

        // if i wanna a nice grid of pieces instead of randomly scattered
        // https://github.com/Pixabay/jQuery-snapPuzzle/issues/1
        function createPositions(options) {
          for (var x=0; x < options.rows; x++) {
              for (var y=0; y < options.columns; y++) {
                positions.push({'left': y*options.pieceWidth, 'top': x*options.pieceHeight});
              }
          }
        }

        function getPosition(options) {
          var position;
          if (randomly) {
            position = {
              left: Math.floor((Math.random()*(options.maxX + 1))),
              top: Math.floor((Math.random()*(options.maxY + 1)))
            }
          } else {
            position = getRandomPosition(positions.length);
          }
          return position;
        }

        function getRandomPosition(total) {
          var random = getRandomInt(total);
          var result = positions[random];
          if (random > -1) {
            positions.splice(random, 1);
          }
          return result;
        }

        function getRandomInt(total) {
          var min = 0;
          var max = total - 1;
          return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        return this.each(function(){
            if (this.complete) init($(this));
            else $(this).load(function(){ init($(this)); });
        });
    };
}(jQuery));
