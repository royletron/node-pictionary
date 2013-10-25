
/**
 * Module dependencies.
 */

var express = require('express')
  , conf = require('./conf')
  , db = require('./db')
  , flash = require('express-flash')
  , engine = require('ejs-locals');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

var app = express();
var _ = require('underscore');

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
app.get('/start', routes.start);
app.get('/signin', routes.signin);
app.get('/create/:id', routes.create);
app.get('/join/:id', routes.join);
app.get('/play/:id', routes.play);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server)

io.set('loglevel',10) // set log level to get all debug messages

var usernames = {};
var colours = ["E08E79", "F1D4AF", "ECE5CE", "C5E0DC", "F4FCE2", "D3EBC7", "FFFFF7", "E9FCCF", "D8FCB3", "FFE1C9", "FAC7B4", "F7D7CD", "F3E7D7", "DFCCCC", "FFD3D3","EDF6F9", "CDD3D8", "CDE5E5", "FFF6DF", "8AC8C3","F3FFCC", "E9FCD9","DEFAE6","D4F7F2","C9F4FF", "EFC9B6", "F5E0CF","F6EAEA","FDFDFD"];
function getColour() {
   return colours[Math.floor(Math.random() * colours.length)];
}
io.sockets.on('connection',function(socket){
  //socket.emit('init',{msg:"test"});
  socket.emit('init',{msg:"Connected, now get a room!"});
  socket.on('adduser', function(username, room){
    console.log(room);
    db.Room.findOne({name: room}, function(err, dbRoom){
      if(dbRoom){
        db.User.findOne({username: username}, function(err, userData){
          dbRoom.users.addToSet({_id: username, avatar: userData.avatar, colour: getColour()});
          dbRoom.save();
          socket.username = username;
          socket.room = room;
          socket.join(room);
          socket.emit('init', {msg:"You have joined "+room });
          io.sockets.in(socket.room).emit('users', {users: dbRoom.users})
          console.log(dbRoom+"!!!!");
          if(dbRoom.started)
            socket.emit('imageinit', {drawing: dbRoom.drawing});
        });
        /*
        socket.emit*/
      }
      else{
        socket.emit('error', {msg:"Can't find the room!?"});
      }
    })
  })
  socket.on('send', function (data) {
    io.sockets.emit('message', data);
  });
  socket.on('draw', function(data){
    console.log(socket.room);
    db.Room.findOne({name: socket.room}, function(err, dbRoom){
      if(dbRoom)
      {
        console.log(dbRoom);
        for(var i = 0; i < data.length; i++)
        {
          dbRoom.drawing.addToSet(data[i]);
        }
        dbRoom.save();
      }
    });
    io.sockets.in(socket.room).emit('draw_update', data);
  });
  socket.on('start', function(){
    db.Room.findOne({name: socket.room}, function(err, dbRoom){
      if(dbRoom)
        if(dbRoom.user == socket.username)
        {
          dbRoom.started = true;
          dbRoom.current = dbRoom.user;
          dbRoom.save();
          io.sockets.in(socket.room).emit('move', { redirectUrl: '/play/'+socket.room})
        }
    })
  })
  socket.on('disconnect', function () {
    socket.leave(socket.room);
    db.Room.findOne({name: socket.room}, function(err, dbRoom){
      if(dbRoom){
        dbRoom.users.pull(socket.username);
        dbRoom.save();
        io.sockets.in(socket.room).emit('users', {users: dbRoom.users})
      }
    })
  });
});

passport.use(new TwitterStrategy({
    consumerKey: 'S3IDJkTdZLsuoK378cz57Q',
    consumerSecret: 'LYYjs4DbwHcPzzjWrgaVifHmdFJiBXamNoRU5rBIn7I',
    callbackURL: "http://picturetime.herokuapp.com/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    /*User.findOrCreate(..., function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });*/
    db.User.findOne({twitterID: profile.id}, function(err, oldUser){
      if(oldUser){
        done(null, oldUser);
      }
      else{
        var newUser = new db.User({
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
    db.User.findById(id,function(err,user){
        if(err) done(err);
        if(user){
            done(null,user);
        }else{
            db.User.findById(id, function(err,user){
                if(err) done(err);
                done(null,user);
            });
        }
    });
});

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/success',
                                     failureRedirect: '/fails ' }));