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

app.get('/employeehome', function(req, res) {
    
    // get customer's appointments' from api
    axios.get(`http://127.0.0.1:5000/api/AppointmentsCustomer`)
        .then((response)=>{
    
        var appointments = response.data;
        var tagline = "Here is the data coming from my own API";
        // render page of appointments
        res.render('pages/employeeindex.ejs', {
            appointments: appointments,
            tagline: tagline
        });
    });       
});

app.get('/customerhome', function(req, res) {
    res.render('pages/customerindex.ejs')
})

app.get('/showreports', (req, res) => {

    const commonurl = 'http://127.0.0.1:5000/api/MostandLeastCommonService';
    const contacturl = 'http://127.0.0.1:5000/api/Contacttype'
    const earningsurl = 'http://127.0.0.1:5000/api/Earnings'
    const custearnings = 'http://127.0.0.1:5000/api/earningspercustomer'

    axios.all([
        axios.get(commonurl),
        axios.get(contacturl),
        axios.get(earningsurl),
        axios.get(custearnings)
    ]).then(axios.spread((
        response1,
        response2,
        response3,
        response4
        ) => {
        var commonservicedata = response1.data;
        var contactdata = response2.data;
        var earningsdata = response3.data;
        var custearningsdata = response4.data;
        res.render('pages/reports.ejs', {
            commonservicedata: commonservicedata,
            contactdata: contactdata,
            earningsdata: earningsdata,
            custearningsdata: custearningsdata
        });
    }));
});

app.listen(port);
console.log('listening for request on port' + port);
