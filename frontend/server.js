var express = require('express');
var app = express();
var path = require('path');
const axios = require('axios');
const port = 8080;

app.set("views", path.resolve(__dirname, "views"));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index.ejs')
})

app.get('/customerhome', function(req, res) {
    
    // get customer's appointments' from api
    axios.get(`http://localhost:5000/api/Appointments`)
        .then((response)=>{
    
        var appointments = response.data;
        var tagline = "Here is the data coming from my own API";
        // render page of appointments
        res.render('pages/customerindex.ejs', {
            appointments: appointments,
            tagline: tagline
        });
    });       
    
});

app.listen(port);
console.log('listening for request on port' + port);
