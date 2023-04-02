var express = require('express');
var app = express();
var path = require('path');
const { default: axios } = require('axios');
const port = 8080;

app.set("views", path.resolve(__dirname, "views"));
app.set('view engine', 'ejs');


// render login page
app.get('/', (req, res) => {
    res.render('pages/login.ejs')
})

// render signup page
app.get('/signup', (req, res) => {
    res.render('pages/signup.ejs')
})

// render report page
app.get('/showreports', (req, res) => {

    const commonurl = 'http://127.0.0.1:5000/api/MostandLeastCommonService';
    const contacturl = 'http://127.0.0.1:5000/api/Contacttype'

    axios.all([axios.get(commonurl), axios.get(contacturl)]).then(axios.spread((response1, response2) => {
        var commonservicedata = response1.data;
        var contactdata = response2.data;
        res.render('pages/reports.ejs', {
            commonservicedata: commonservicedata,
            contactdata: contactdata
        });
    }));
});



app.listen(port);
console.log('listening for request on port' + port);