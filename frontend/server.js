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
});


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
    const earningsurl = 'http://127.0.0.1:5000/api/Earnings'
    const custearningsurl = 'http://127.0.0.1:5000/api/earningspercustomer'
    const busydayurl = 'http://127.0.0.1:5000/api/busiestdayofweek'
    const custcancelurl = 'http://127.0.0.1:5000/api/customersmostcancel'
    const numappointmentsurl = 'http://127.0.0.1:5000/api/numberofappointments'
    const employeeappointmenturl = 'http://127.0.0.1:5000/api/ScheduledAppointmentsPerEmployee'
    const profitableurl = 'http://127.0.0.1:5000/api/ServiceProfitability'

    axios.all([
        axios.get(commonurl),
        axios.get(contacturl),
        axios.get(earningsurl),
        axios.get(custearningsurl),
        axios.get(busydayurl),
        axios.get(custcancelurl),
        axios.get(numappointmentsurl),
        axios.get(employeeappointmenturl),
        axios.get(profitableurl)
    ]).then(axios.spread((
        response1,
        response2,
        response3,
        response4,
        response5,
        response6,
        response7,
        response8,
        response9
        ) => {
        var commonservicedata = response1.data;
        var contactdata = response2.data;
        var earningsdata = response3.data;
        var custearningsdata = response4.data;
        var busydaydata = response5.data;
        var custcanceldata = response6.data;
        var numappointmentsdata = response7.data;
        var employeeappointmentdata = response8.data;
        var profitabledata = response9.data;
        res.render('pages/reports.ejs', {
            commonservicedata: commonservicedata,
            contactdata: contactdata,
            earningsdata: earningsdata,
            custearningsdata: custearningsdata,
            busydaydata: busydaydata,
            custcanceldata: custcanceldata,
            numappointmentsdata: numappointmentsdata,
            employeeappointmentdata: employeeappointmentdata,
            profitabledata: profitabledata
        });
    }));
});

// add appointment info to database
app.post('/add_appointment', function(req, res){
    console.log(req.body)
    
    var date = req.body.date;
    var time = req.body.time;
    var phoneNumber = req.body.phoneNumber;
    var employeeid = req.body.employeeid;

    // split service id and price info
    var serviceinfo = req.body.serviceinfo.split(" ");
    var serviceid = serviceinfo[0];
    var servicePrice = serviceinfo[1];

    var customerNote = req.body.comments;
    
    
    var appointmentinfo = {
    'appointment_date': date,
    'appointment_time': time,
    'phone_number': phoneNumber,
    'employee_id' : employeeid,
    'service_id' : serviceid,
    'appointment_total': servicePrice,
    'customer_note' : customerNote
    }
    console.log(appointmentinfo)
    
    //send to backend api
    axios.post('http://127.0.0.1:5000/api/add/appointment', appointmentinfo)
    .then(function (response) {
        if ((response.data.result) === 'good') {
            res.render('pages/customerindex.ejs')
        }
        else {
            console.log(response.data)
        }
    })
})

// cancel page
app.get('/cancelappointment', (req, res) => {
    axios.get(`http://127.0.0.1:5000/api/CancelAppointment`)
     .then((response)=>{
     var appointments = response.data;
     // render page of cancel appointments
     res.render('pages/cancelappointment.ejs', {
         appointments: appointments,
     });
  });

});

app.get('/cancelsuccess', (req, res) => {
    res.render('pages/cancelsuccess.ejs')
})


app.put

  
app.listen(port);
console.log('listening for request on port' + port);
