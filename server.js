const express = require('express')
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const mongooseUniqueValidator = require('mongoose-unique-validator')

const app = express()

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', (req, res) => {
    res.render('index.html');
});


/*
* Task 1
* GET endpoint to return prime numbers upto 'n'
*/

app.get('/prime/:n', (req, res) => {
    var arr = []
    var n = parseInt(req.params.n)
    for(var i = 2; i < n + 1; i++) {
        var f = 0
        for(var j = 2; j < Math.sqrt(i); j++) {
            if (i % j == 0){
                f = 1
                break
            }
        }
        if (f == 0) {
            arr.push(i)
        }
    }
    res.render('prime.html', {n: n, arr: arr})
})


/*
* Task 2, 3
* POST endpoint to write user and contact data to mongodb with pre/post hooks
*/

mongoose.set('useCreateIndex', true)
mongoose.connect(process.env.MONGOURL, {useNewUrlParser: true, useUnifiedTopology: true})

var userSchema = new mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
    password: String,
    address: String,
    phone: {type: Number, unique: true,},
    dob: String,
    userContacts: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Contact' 
    }]
})

userSchema.plugin(mongooseUniqueValidator)

var contactSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    email: String,
})

var User = mongoose.model('User', userSchema, 'users');
var Contact = mongoose.model('Contact', contactSchema, 'contacts');

app.get('/users', (req, res) => {
    User.find().populate('userContacts').exec(function(err, users) {
        if (err) console.log(err)
        res.render('users.html', {users: users})
    })    
})

app.get('/user/add', (req, res) => {
    res.render('user_add.html')
})

app.post('/user/add', (req, res) => {
    var user = new User(req.body)
    
    var c1 = new Contact({
        user: user._id,
        email: 'abc@xyz.com',
    })
    var c2 = new Contact({
        user: user._id,
        email: 'johndoe@example.com',
    })

    user.userContacts.push(c1);
    user.userContacts.push(c2);

    user.save(function(err) {
        if (err) console.log(err)

        c1.save(function(err) {
            if (err) console.log(err)
        })        
        c2.save(function(err) {
            if (err) console.log(err)
        })
        res.send('user created successfully')
    })
})

app.get('/user/delete/:id', (req, res) => {
    User.deleteMany({ _id: req.params.id }, function(err) {
        if(err) console.log(err)
    })
    Contact.deleteMany({ user: req.params.id }, function(err) {
        if (err) console.log(err)
    })
    res.send('user deleted successfully')
})

app.listen(3000, () => {
    console.log('Listening on Port 3000')
})
