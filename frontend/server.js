var express = require('express');
var app = express();
var path = require('path');
const axios = require('axios');
const port = 8080;
const bodyParser  = require('body-parser');

const { response } = require('express');
const { request } = require('express');

var selectedID = "";
app.use(bodyParser.urlencoded());

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
    
    // get customer's appointments' from api
     axios.get(`http://127.0.0.1:5000/api/AppointmentsCustomer`)
     .then((response)=>{
 
     var appointments = response.data;
     var tagline = "Here is the data coming from my own API";
     // render page of appointments
     res.render('pages/customerindex.ejs', {
         appointments: appointments,
         tagline: tagline
     });
  });
})

app.get('/createappointment', (req, res) => {
    
    const employeesurl = 'http://127.0.0.1:5000/api/Employees';
    const servicesurl = 'http://127.0.0.1:5000/api/Services';
    
    axios.get(employeesurl)
     .then((response)=>{
        var employees = response.data 

        axios.get(servicesurl)
        .then((response) =>{
            var services = response.data    
        
            res.render('pages/newappointment', {
                employees: employees,
                services: services
            })
        });
    });    
});
    
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

// add appointment info to database
app.post('/add_appointment', function(req, res){
    console.log(req.body)
    
    var date = req.body.date;
    var phoneNumber = req.body.phoneNumber;
    var employeeid = req.body.employeeid
    var serviceid = req.body.serviceid
    var customerNote = req.body.customerNote
    
    var appointmentinfo = {
    'appointment_date': date,
    'phone_number': phoneNumber,
    'employee_id' : employeeid,
    'service_id' : serviceid,
    'customer_note' : customerNote
    }
    
    /* send to backend api
    axios.post('http://127.0.0.1:5000/api/add/appointment', appointmentinfo)
    .then(function (response) {
        if ((response.data.result) === 'good') {
            res.render('pages/customerindex.ejs')
        }
        else {
            console.log(response.data)
        }
    })*/
})

  
app.listen(port);
console.log('listening for request on port' + port);
