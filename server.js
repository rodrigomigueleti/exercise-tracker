const express = require('express')
const app = express()
const cors = require('cors')
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, 'sample.env') });
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var datejs = require('datejs');
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const mongoURI = process.env.MONGO_URI;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(mongoURI);

const Schema = mongoose.Schema;

const userSchema = new Schema({
	username: {type: String, required: true},
});

const exerciseSchema = new Schema({
	idUser: {type: String, required: true},
	username: {type: String, required: true},
	description: {type: String, required: true},
	duration: {type: Number, required: true, integer: true},
	date: {type: Date, required: true}
});

const logSchema = new Schema({
	username: {type: String, required: true},
	count: {type: Number, required: true, integer: true},
	log: {
		description: {type: String, required: true},
		duration: {type: Number, required: true, integer: true},
		date: {type: Date, required: true}
	}
});


app.get("/is-mongoose-ok", function (req, res) {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState });
  } else {
    res.json({ isMongooseOk: false });
  }
});

app.get("/myEnv", function (req, res) {
	res.json({port: process.env.PORT});
});

var UserObj = mongoose.model("UserObj", userSchema);
var ExerciseObj = mongoose.model("ExerciseObj", exerciseSchema);
var LogObj = mongoose.model("LogObj", logSchema);

app.post('/api/users', (req, res, next) => {
	var { username } = req.body;
	userObj = new UserObj({username : username});
	userObj.save((err, data) => {
		if (err) return next(err);
		res.json({username : data.username, _id : data._id});
	});
});

app.get('/api/users', (req, res, next) => {
	var usersArray = [];
	var users = UserObj.find({}, (err, users) => {
		res.json(users);
	});
	
});


app.post('/api/users/:_id/exercises', async function(req, res, next) {
	//var { _id } = req.body;
	var { _id: userId } = req.params;
	var { description } = req.body;
	var { duration } = req.body;
	var { date } = req.body;

	if (/^\s*$/.test(userId)) {
		return res.json({_id: 'Obrigatory!'});
	}

	if (/^\s*$/.test(description)) {
		return res.json({description: 'Obrigatory!'});
	}

	if (/^\s*$/.test(duration)) {
		return res.json({duration: 'Obrigatory!'});
	}

	if (!/^\d+$/.test(duration)) {
		return res.json({duration: 'Only integers!'});
	}

	var dtCad;

	if (/^\s*$/.test(date)) {
		dtCad = new Date();
	} else {
		dtCad = new Date(date);
	}

	if (!isValidDate(dtCad))
        throw Error("Invalid date");

   
    var userObj = await UserObj.findOne({_id : userId}).exec();

    if (!userObj)
    	throw Error('Invalid User _id');

	exerciseObj = new ExerciseObj({
		idUser : userObj._id,
		username : userObj.username,
		description : description,
		duration : duration,
		date : date
	});
	exerciseObj.save((err, data) => {
		if (err) return next(err);
		res.json({
			username : data.username,
			description : data.description,
			duration: data.duration,
			date: data.date.toString('yyyy-MM-dd'),
			_id : data._id});
	});
});

app.get('/api/users/:_id/logs', async function(req, res, next) {
	var { _id: userId } = req.params;
	var { from } = req.query;
	var { to } = req.query;
	var { limit } = req.query;
	
	var dtFrom = null;
	var dtTo = null;
	var limitInt = 0;

	if (!/^\s*$/.test(from)) {
		try {
			dtFrom = Date.parseExact(from, "yyyy-MM-dd");
		} catch (err) {
			return res.json({from: 'Invalid date format (yyyy-MM-dd)'});
		}
	}

	

	if (!/^\s*$/.test(to)) {
		try {
			dtTo = Date.parseExact(from, "yyyy-MM-dd");
		} catch (err) {
			return res.json({to: 'Invalid date format (yyyy-MM-dd)'});
		}
	}

	if (!/^\s*$/.test(limit)) {
		if (/^\d+$/.test(limit)) {
			limitInt = limit;
		} 
		else
			return res.json({limit: 'Must be integer!'});
	}

	var userObj = await UserObj.findOne({_id : userId}).exec();

    if (!userObj)
    	throw Error('Invalid User _id');

    var queryResult;
    var listLog = [];

    var result = {
    	username: userObj.username,
		count: 0,
		_id: userObj._id,
		log: []
    };
    if (dtFrom == null && dtTo == null && limitInt > 0) {
    	queryResult = await ExerciseObj.find({
    		idUser: userObj._id
    	}).limit(parseInt(limitInt)).exec();
    } else if (dtFrom != null && dtTo != null && limitInt > 0) {
    	queryResult = await ExerciseObj.find({
    		idUser: userObj._id,

    	}).limit(parseInt(limitInt)).exec();
    } else {
    	queryResult = await ExerciseObj.find({
    		idUser: userObj._id,
    		from: {
    			$gte: dtFrom,
    			$lte: dtTo
    		}
    	}).limit(parseInt(limitInt)).exec();
    }
    
    queryResult.forEach(function(exercise) {
    	listLog.push({
    		description: exercise.description,
    		duration: exercise.duration,
    		date: exercise.date.toString('yyyy-MM-dd')
    	});
    });
    result.count = queryResult.length;
    result.log = listLog;

    res.json(result);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

// Error handler
app.use(function (err, req, res, next) {
  if (err) {
    res
      .status(500)
      .type("json")
      .send({error: err.message});
  }
});
