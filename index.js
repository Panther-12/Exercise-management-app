const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Connect to mongoDB
mongoose.connect('mongodb+srv://Nimrod:12%4017y017g3sa%3F@cluster0.ewm8bcv.mongodb.net/exercise-tracker?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true}, ()=>{
    console.log("Database connected successfully")
})
// mongoose.set('strictQuery', true);

// Declare variable that hold the model objects
let User;
let Exercise;

// Create the schemas for the models
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    log: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise"
    }]
})

const exerciseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

// Define the models
User = mongoose.model('User', userSchema)
Exercise = mongoose.model('Exercise', exerciseSchema)

app.post('/api/users', (req, res)=>{
    // check to ensure the user does not already exist
    User.findOne({username: req.body.username}, (err, data)=>{
        if(err || data===null){
            user = new User({
                username: req.body.username
            })
            user.save((err, data)=>{
                if(err){
                   return console.error(err);  
                }
                else{
                    res.json({
                        username: data.username,
                        _id: data.id
                    })
                    console.log(`user ${data.username} created successfully`)
                }
            })
        }
        else{
            console.log(`${data}user already exists`)
        }
    })
})

// Get all users and list them
app.get('/api/users', (req, res)=>{
    var users = []
    User.find({}, (err, data)=>{
        if(err){
            return console.log(err)
        }
        else{
            data.forEach((user)=>{
                users.push({
                    username: user.username,
                    _id: user._id
                })
            })
            res.json(users)
            return users
        }
    })
})

// create a new exercise belonging to a particular user
app.post("/api/users/:_id/exercises", (req, res)=>{
    let actualDate;
    
    if(req.body.date){
        actualDate = new Date(String(req.body.date)).toDateString();
    }
    else{
        actualDate = new Date().toDateString()
    }
    //console.log(actualDate);
    
    const exercise = new Exercise({
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: actualDate,
        user: req.params._id
    })
    exercise.save((err, data)=>{
        if(err){
            return console.error(err)
        }
        else{
            User.find({_id: req.params._id}, (err, person)=>{
                if(err){
                    return console.log(err)
                }
                else{
                    res.json({
                        username:person[0].username,
                        description:data.description,
                        duration:data.duration,
                        date:actualDate,
                        _id: req.params._id
                    })
                }
            })
        }
    })
})

// Get exercise log for a particular user
app.get("/api/users/:_id/logs", (req, res)=>{
    // Array that stores user exercise logs
    const logs = [];
    // define variables 
    let query;
    var actualDate;
    var from = null;
    var to = null;
        // 
if(req.query.from!==undefined||req.query.to!==undefined||req.query.limit!==undefined){
        if (req.query.from!==undefined) {
            from = new Date(req.query.from)
            if (req.query.to!==undefined) {
                to = new Date(req.query.to)
                if (req.query.limit!==undefined) {
                    query = Exercise.find({user: req.params._id}).where("date").gte(from).lte(to).limit(parseInt(req.query.limit))
                }
                else{
                    query = Exercise.find({user: req.params._id}).where("date").gte(from).lte(to)
                }
            }
            else{
                if (req.query.limit!==undefined) {
                    query = Exercise.find({user: req.params._id}).where("date").gte(from).limit(parseInt(req.query.limit))   
                }
                else{
                    query = Exercise.find({user: req.params._id}).where("date").gte(from)
                }
            }
        }
        else if(req.query.to!==undefined){
            to = new Date(req.query.to)
            if (req.query.limit!==undefined) {
                query = Exercise.find({user: req.params._id}).where("date").lte(to).limit(parseInt(req.query.limit))
            }
            else{
                query = Exercise.find({user: req.params._id}).where("date").lte(req.to)
            }
        }
        else{
            query = Exercise.find({user: req.params._id}).limit(parseInt(req.query.limit))
        }
        
        console.log("query params passed") 
    // Execution of the actual query           
query.exec((err, data)=>{
        if(err){
            return console.log(err)
        }
        else{
            User.find({_id: req.params._id}, (err, person)=>{
                if(err){
                    return console.log(err)
                }
                else{
                    if(data.length>0){
                        data.forEach((item)=>{
                         actualDate = new Date(item.date).toDateString()
                            console.log(`user: ${item.user} date: ${typeof(actualDate)} storedDate:${item.date}`)
                            logs.push({
                            description:item.description,
                                duration:item.duration,
                           date:actualDate,
                            })
                        })
                    }
                    res.json({
                        username:person[0].username,
                            count:data.length,
                            _id:req.params._id,
                            log:logs
                        })
                    }
                })
            }
        })
    }
    else{
        console.log("No query params passed")
Exercise.find({user:req.params._id}, (err, data)=>{
        if(err){
            return console.log(err)
        }
        else{
                User.find({_id: req.params._id}, (err, person)=>{
                    if(err){
                        return console.log(err)
                    }
                    else{
                        if(data.length>0){                     data.forEach((item)=>{
                            actualDate= new Date(item.date).toDateString()
                                        console.log(`user: ${item.user} date: ${typeof(actualDate)}`)
                          logs.push({
                            description:item.description,
                                duration:item.duration,
                            date:actualDate,
                                })
                            })
                        }
                        res.json({
                         username:person[0].username,
                            count:data.length,
                            _id:req.params._id,
                            log:logs
                        })
                    }
                })
    
            }
        })
    }
})


const listener = app.listen(3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
