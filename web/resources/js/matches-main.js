Handlebars.registerHelper( 'ifCond', function( v1, operator, v2, options ){
    switch( operator ){
        case '==':
            return ( v1 == v2 ) ? options.fn( this ) : options.inverse( this );
        case '===':
            return ( v1 === v2 ) ? options.fn( this ) : options.inverse( this );
        case '<':
            return ( v1 < v2 ) ? options.fn( this ) : options.inverse( this );
        case '<=':
            return ( v1 <= v2 ) ? options.fn( this ) : options.inverse( this );
        case '>':
            return ( v1 > v2 ) ? options.fn( this ) : options.inverse( this );
        case '>=':
            return ( v1 >= v2 ) ? options.fn( this ) : options.inverse( this );
        case '&&':
            return ( v1 && v2 ) ? options.fn( this ) : options.inverse( this );
        case '||':
            return ( v1 || v2 ) ? options.fn( this ) : options.inverse( this );
        default:
            return options.inverse( this );
    }
});

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

(function( $ ){
    'use strict';
    var matches = {
            matches : {},
            template : false,
            $matchesList : $( '.js-matches' ),
            $progressBar : $( '.js-progress-bar' ),
            requestsSent : 0,
            requestsDone : 0,
            init : function(){
                var _this = this;

                this.loadTemplate();
                this.loadStreams();

                setInterval( function(){
                    _this.loadStreams();
                }, 60000 );
            },
            loadStreams : function(){
                this.loadData( 'hitbox' );
                this.loadData( 'twitch' );
                this.loadData( 'azubu' );
                this.loadData( 'mlg' );
            },
            loadTemplate : function(){
                var _this = this,
                    xhr = $.ajax({
                        url: 'resources/matchtemplate.handlebars'
                    });

                this.requestsSent = this.requestsSent + 1;

                xhr.done(function( response ){
                    _this.requestsDone = _this.requestsDone + 1;

                    _this.updateProgressbar();
                    
                    _this.template = Handlebars.compile( response );
                });
            },
            loadData : function( service ){
                var _this = this,
                    xhr = $.ajax({
                        url: 'matches-ajax.php',
                        data: {
                            'site': service
                        }
                    });

                this.requestsSent = this.requestsSent + 1;

                xhr.done(function( response ){
                    _this.requestsDone = _this.requestsDone + 1;

                    _this.updateProgressbar();

                    _this.handleResponse( response );
                });
            },
            handleResponse : function( response ){
                var _this = this;

                $.each( response, function( index, data ){
                    var identifiers = [ data.teams[ 0 ].identifier, data.teams[ 1 ].identifier ],
                        identifier;

                    identifier = identifiers.sort().toString();

                    if( _this.matches[ identifier ] === undefined ){
                        _this.matches[ identifier ] = data;
                    } else {
                        _this.matches[ identifier ].streams.concat( data.streams );
                    }
                });

                this.updateData();
            },
            updateProgressbar : function(){
                var _this = this;

                if( this.$progressBar.length > 0 ){
                    if( this.requestsSent == this.requestsDone ) {
                        this.$progressBar.css({
                            width: '100%'
                        });

                        // Try to wait until the progressbar is filled before removing it
                        setTimeout( function(){
                            _this.$progressBar.remove();
                        }, 600 );
                    } else {
                        this.$progressBar.css({
                            width: ( _this.requestsDone / _this.requestsSent * 100 ).toString() + '%'
                        });
                    }
                }

            },
            updateData : function(){
                var matchIdentifier,
                    _this = this;

                if( this.matches === {} && this.template === false ){
                    setTimeout( function(){
                        matches.updateData();
                    }, 50 );

                    return false;
                }

                if( this.requestsSent == this.requestsDone ) {
                    this.updateProgressbar();

                    if( Object.keys( this.matches ).length === 0 ){
                        this.$matchesList.html( '<h1>Sorry, no livestreamed matches at the moment</h1>' );
                    }
                }

                if( Object.keys( this.matches ).length > 0 ){
                    this.$matchesList.html( ' ' );
                    for( matchIdentifier in this.matches ){
                        if( this.matches.hasOwnProperty( matchIdentifier ) ){
                            this.$matchesList.append( this.template( this.matches[ matchIdentifier ] ) );
                        }
                    }

                    $( '[data-toggle="popover"]' ).popover();
                }
            }
        };

    window.matches = matches;

    $(function(){
        matches.init();
    });
})( $ );
