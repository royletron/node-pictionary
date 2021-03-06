var mongoose = require('mongoose');
mongoose.connect('mongodb://root:oxford1@ds047968.mongolab.com:47968/piction');


exports.mongoose = mongoose

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('Connected');
});

var userSchema = mongoose.Schema({
  name: String,
  username: String,
  avatar: String,
  twitterID: String
});

var roomSchema = mongoose.Schema({
  name: String,
  user: String,
  users: [{_id: String, avatar: String, colour: String}],
  started: { type: Boolean, default: false },
  drawing: [{fromx: Number, fromy: Number, tox: Number, toy: Number, colour: String}],
  date: { type: Date, default: Date.now }
});

var User = mongoose.model('users', userSchema);
var Room = mongoose.model('rooms', roomSchema);

exports.User = User;
exports.Room = Room;

exports.createOrLogin = function (profile, done){
  var user = User.find
}
exports.addTwitterUser = function (profile){
  var collection = db.collection('users');
  collection.insert({twitterId: profile.id, name: profile.name, screen: profile.screen_name, avatar: profile.profile_image_url});
  return collection.findOne({twitterId: profile.id});
}
