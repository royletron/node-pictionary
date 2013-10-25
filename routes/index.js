
/*
 * GET home page.
 */
 var randword = require('randword');
 var db = require('../db');

 function isLogged(req){
  req.session.lastPage = req.url;
  return req.user != undefined
}
exports.index = function(req, res){
  res.render('index', { active: 'index', logged: isLogged(req), user: req.user});
};

exports.play = function(req, res){
  db.Room.findOne({name: req.params.id}, function(err, room){
    if(!room){
      res.render('error', {active: '', logged: isLogged(req), user: req.user});
    }
    else{
      res.render('draw', {active: 'draw', logged: isLogged(req), user: req.user, room: room});
    }
  })
}

exports.draw = function(req, res){
  if(isLogged(req))
    res.render('draw', { active: 'draw', logged: isLogged(req), user: req.user });
  else
    res.render('signin', { active: '', logged: isLogged(req)});
};

exports.signin = function(req, res){
  res.render('signin', { active: '', logged: isLogged(req)});
}

exports.success = function(req, res){
  req.flash('success', 'Yo '+req.user.username+' you is now logged in!');
  if(req.session.lastPage)
    res.redirect(req.session.lastPage);
  else
    res.render('home', { active: 'home', logged: isLogged(req), user: req.user });
};

exports.fails = function(req, res){
  req.flash('fail', 'Yo, not sure what you did, but you need to log in using a Twitter account!');
  res.render('index', { active: 'index', logged: isLogged(req) });
};

exports.logout = function(req, res){
  req.flash('info', 'Your loss, guess you have a life or something');
  req.logout();
  res.render('index', { active: 'index', logged: isLogged(req) });
}

exports.start = function(req, res){
  if(isLogged(req))
    getWords(res, 'start', { active: 'start', logged: isLogged(req), user: req.user, words: [] });  
  else
    res.render('signin', { active: '', logged: isLogged(req)});
}

exports.join = function(req, res){
  if(isLogged(req))
  {
    db.Room.findOne({name: req.params.id}, function(err, room){
      if(!room){

      }
      else{
        if(room.started)
          res.render('draw', {active: 'draw', logged: isLogged(req), user: req.user, room: room});
        else
          res.render('lobby', { active: 'start', logged: isLogged(req), user: req.user, room: room });
      }
    })
  }
  else{
    res.render('signin', { active: '', logged: isLogged(req)});
  }
}

exports.create = function(req, res){
  if(isLogged(req))
  {
    db.Room.findOne({name: req.params.id}, function(err, oldRoom){
      if(!oldRoom)
      {
        var newRoom = new db.Room({
          name: req.params.id,
          user: req.user.username,
          drawing: []
        }).save(function(err, newRoom){
          if(err) throw err;
          res.render('lobby', { active: 'start', logged: isLogged(req), user: req.user, room: newRoom })
        });
      }
      else
      {
        if(oldRoom.user == req.user.username)
        {
          res.render('lobby', { active: 'start', logged: isLogged(req), user: req.user, room: oldRoom });
        }
        else
        {
          req.flash('fail', 'I don\'t know what you\'re doing, but I don\'t like it!');
          res.render('home', { active: '', logged: isLogged(req), user: req.user });
        }
      }
    });
  }
  else
  {
    res.render('signin', { active: '', logged: isLogged(req)});
  }
}

function getWords(res, request, vars){
  if(vars.words.length < 10)
  {
    randword(function(err, word) {
      db.Room.findOne({name: word}, function(err, currentRoom){
        if(!currentRoom){
          vars.words.push(word);
        }
        getWords(res, request, vars);
      });
    });
  }
  else{
    res.render(request, vars);
  }
}