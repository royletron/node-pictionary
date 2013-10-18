
/**
 * Module dependencies.
 */

var express = require('express')
  , conf = require('./conf')
  , users = require('./users')
  , flash = require('express-flash')
  , engine = require('ejs-locals');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);

app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.configure(function() {
  app.use(express.static('public'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(flash());
  app.use(express.session({ secret: 'boom boom shake' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
  app.use(app.router);
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/draw', routes.draw);
app.get('/success', routes.success);
app.get('/fails', routes.fails);
app.get('/logout', routes.logout);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server)

io.set('loglevel',10) // set log level to get all debug messages

io.sockets.on('connection',function(socket){
  //socket.emit('init',{msg:"test"});
  socket.on('send', function (data) {
    io.sockets.emit('message', data);
  });
});

passport.use(new TwitterStrategy({
    consumerKey: 'S3IDJkTdZLsuoK378cz57Q',
    consumerSecret: 'LYYjs4DbwHcPzzjWrgaVifHmdFJiBXamNoRU5rBIn7I',
    callbackURL: "http://repl-7896.euw1.actionbox.io:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    /*User.findOrCreate(..., function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });*/
    users.User.findOne({twitterID: profile.id}, function(err, oldUser){
      if(oldUser){
        done(null, oldUser);
      }
      else{
        var newUser = new users.User({
          twitterID: profile.id,
          name: profile.displayName,
          username: profile.username,
          avatar: profile.photos[0].value
        }).save(function(err, newUser){
          if(err) throw err;
          done(null, newUser);
        });
      }
    }); 
    //users.createOrLogin(profile, done);
  }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});


passport.deserializeUser(function(id, done) {
    users.User.findById(id,function(err,user){
        if(err) done(err);
        if(user){
            done(null,user);
        }else{
            users.User.findById(id, function(err,user){
                if(err) done(err);
                done(null,user);
            });
        }
    });
});

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/success',
                                     failureRedirect: '/login' }));