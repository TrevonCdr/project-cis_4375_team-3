import flask
from flask import jsonify
from flask import request, make_response
import mysql.connector
from mysql.connector import Error
from SQL import create_connection
from SQL import execute_query
from SQL import execute_read_query
from SQL import new_read

#setting up the application
app = flask.Flask(__name__) #sets up the application
app.config["DEBUG"] = True #all to show errors in browser

#Establishing the connection to my server:

conn = create_connection('cis4375project.ceaacvjhw0y3.us-east-1.rds.amazonaws.com', 'admin', 'C!s4e75Gr0up3!', 'CIS4375Project')

# Report 6 Preferred Contact Method
#localhost:5000/api/Contacttype
@app.route('/api/Contacttype', methods=['GET'])
def api_contacttype():

    #query for sql to see contact type table:

    query = """SELECT contact_method_status as 'contactType'
FROM CIS4375Project.Customer
inner join CIS4375Project.ContactMethod
ON Customer.contact_method_id = ContactMethod.contact_method_id
Group by Customer.contact_method_id
order by count(*) DESC
Limit 1;"""

    methodinfo = new_read(query)

    #adds the data to a blank list then returns it with jsonify:

    contactmethoddata = []

    for method in methodinfo:
        contactmethoddata.append(method)
    
    return jsonify(contactmethoddata)

#localhost:5000/api/MostandLeastCommonService
@app.route('/api/MostandLeastCommonService', methods=['GET'])
def api_MostLeastCommon():

    #query for sql to see contact type table:

    query1 = """SELECT service_type as 'Most'from CIS4375Project.Service
    inner join CIS4375Project.AppointmentService
    ON AppointmentService.service_id = Service.service_id
    inner join CIS4375Project.Appointment
    ON AppointmentService.appointment_id = Appointment.appointment_id
    Group by AppointmentService.service_id
    Order by count(AppointmentService.service_id) desc
    limit 1;"""

    query2 = """SELECT service_type as 'Least' from CIS4375Project.Service
inner join CIS4375Project.AppointmentService
ON AppointmentService.service_id = Service.service_id
inner join CIS4375Project.Appointment
ON AppointmentService.appointment_id = Appointment.appointment_id
Group by AppointmentService.service_id
Order by count(AppointmentService.service_id) asc
LIMIT 1;"""

    serviceinfo = new_read(query1)
    serviceinfo2 = new_read(query2)

    #adds the data to a blank list then returns it with jsonify:

    commonservicedata = []
    leastcommondata = []

    for service in serviceinfo:
        commonservicedata.append(service)

    for service in serviceinfo2:
        leastcommondata.append(service)
    
    return jsonify(commonservicedata,leastcommondata)

#query for Earnings per year, week, day
#localhost:5000/api/Earnings
@app.route('/api/Earnings', methods=['GET'])
def api_Earnings():
        # Earnings Per Week
        query1 = """SELECT STR_TO_DATE(CONCAT(YEARWEEK(appointment_date, 0), ' ', 'Sunday'), '%X%V %W') AS 'Week Start', 
       STR_TO_DATE(CONCAT(YEARWEEK(appointment_date, 0), ' ', 'Saturday'), '%X%V %W') AS 'Week End',
        SUM(appointment_total) AS Earnings
        FROM Appointment
        WHERE appointment_status <> 'CANCELED'
        GROUP BY YEARWEEK(appointment_date)
        ORDER BY YEARWEEK(appointment_date);"""
        
        # Earnings Per Month and Year
        query2 = """SELECT year(appointment_date) as "Year", monthname(appointment_date) as "Month", sum(appointment_total) as "Earnings"
        from Appointment
        WHERE appointment_status <> 'CANCELED'
        group by year(appointment_date),month(appointment_date)
        order by year(appointment_date),month(appointment_date);"""
      
        #Earnings for the current date
        query3 = """SELECT curdate() as "Today's date", sum(appointment_total) "Today's earnings"
        from Appointment
        where appointment_date = curdate()
        AND appointment_status <> 'CANCELED';"""

        earningsinfo = execute_read_query(conn, query1)
        earningsinfo2 = execute_read_query(conn, query2)
        earningsinfo3 = execute_read_query(conn, query3)

    #adds the data to a blank list then returns it with jsonify:
        earningsperweek = []
        earningsweeklymonthly = []
        earningscurrent = []
               
        for earnings in earningsinfo:
            earningsperweek.append(earnings)

        for earnings in earningsinfo2:
            earningsweeklymonthly.append(earnings)
        
        for earnings in  earningsinfo3:
            earningscurrent.append(earnings)

    
        return jsonify(earningsperweek,earningsweeklymonthly,earningscurrent)

#Earnings Per Customer
#localhost:5000/api/earningspercustomer
@app.route('/api/earningspercustomer', methods=['GET'])
def api_CustomerEarnings():
        #Earnings Per Customer
        query1 = """SELECT Concat(Customer.first_name,' ', Customer.last_name) as 'Customer Name', sum(appointment_total) as 'Earnings' from Appointment
        join Customer
        on Appointment.customer_id = Customer.customer_id
        group by Appointment.customer_id;"""

        earningscustomer = execute_read_query(conn, query1)

        earningspercustomer= []

        for earnings in  earningscustomer:
            earningspercustomer.append(earnings)       
        return jsonify(earningspercustomer)

#Busiest Day of the Week
#localhost:5000/api/busiestdayofweek
@app.route('/api/busiestdayofweek', methods=['GET'])
def api_CustomerEarningsDay():
            query1 = """SELECT DAYNAME(appointment_date) as WeekDay, COUNT(*) as 'Number of Appointments'
            FROM Appointment
            GROUP BY DAYNAME(appointment_date)
            ORDER BY COUNT(*) DESC
            limit 1;"""

            busiestday = execute_read_query(conn, query1)

            busiestdayofweek = []

            for day in busiestdayofweek:
                 busiestday.append(day)
            return jsonify(busiestdayofweek)

#Customers that most cancel appointments
#localhost:5000/api/customersmostcancel
@app.route('/api/customersmostcancel', methods=['GET'])
def api_CustomerCancel():
            query1 = """SELECT concat(first_name, ' ', last_name) as Name, count(*) as 'Canceled Appointments'
            from CIS4375Project.Appointment a
            join CIS4375Project.Customer c on a.customer_id = c.customer_id
            where a.appointment_status = 'CANCELED'
            group by a.customer_id
            order by 'Canceled Appointments' desc;"""

            cancelledappointments = execute_read_query(conn, query1)

            mostcancelled = []

            for appointment in mostcancelled:
                 cancelledappointments.append(appointment)
            return jsonify(mostcancelled)

#Report 4 Number of Appointments per week, month, and year
@app.route('/api/numberofappointments', methods=['GET'])
def api_numberofappointments():
            #Number of Appointments per Week
            query1 = """SELECT count(appointment_date) as 'Number of Appointments',
            week(appointment_date) as 'Week of the year', 
            year(appointment_date) as 'Year'
            from Appointment
            group by week(appointment_date),year(appointment_date);"""

            #Number of appointments per month
            query2 = """SELECT count(appointment_date) as 'Number of Appointments', 
            monthname(appointment_date),
            year(appointment_date)
            from Appointment
            group by month(appointment_date),year(appointment_date);"""

            #Number of appointments per year
            query3= """SELECT count(appointment_date) as 'Number of Appointments', 
            year(appointment_date)
            from Appointment
            group by year(appointment_date);;"""

            appointmentsinfo = execute_read_query(conn, query1)
            appointmentsinfo2 = execute_read_query(conn, query2)
            appointmentsinfo3 = execute_read_query(conn, query3)
        
            appointmentsperweek = []
            appointmentsmonthly = []
            appointmentssyearly = []
               
            for appointments in appointmentsinfo:
                appointmentsperweek.append(appointments)

            for appointments in appointmentsinfo2:
                appointmentsmonthly.append(appointments)
        
            for appointments in  appointmentsinfo3:
                appointmentssyearly.append(appointments)

    
            return jsonify(appointmentsperweek,appointmentsmonthly,appointmentssyearly)




#Request to see all appointments:

@app.route('/api/Appointments', methods=['GET'])
def api_appointments():
    #query for sql to see appointment table:
    
    query = """Select * from Appointment;"""

    appointmentinfo = execute_read_query(conn, query)

    #adds the data to a blank list then returns it with jsonify:

    appointmentdata = []

    for appt in appointmentinfo:
        appointmentdata.append(appt)
    
    return jsonify(appointmentdata)

#Request to add an appointments:
    
@app.route('/api/add/appointment', methods=['POST'])
def add_appointment():
    request_data = request.get_json()

    #Getting employee_id based on name given:

    if 'Lennin Repizo' in request_data['employee_name']:
        newemployee_id = 1
    elif 'Jayme Scard' in request_data['employee_name']:
        newemployee_id = 2
    elif 'Valeriano Avila' in request_data['employee_name']:
        newemployee_id = 3
    elif 'Mariana Alvarez' in request_data['employee_name']:
        newemployee_id = 4
    
    #Getting customer_id based on phone number:

    phonenumber = request_data['phone_number']
    querycustid = """Select customer_id from Customer where phone_number = '%s'"""%(phonenumber)
    newcustidinfo = execute_read_query(conn, querycustid)
    data = newcustidinfo[0]
    for values in data.values():
        newcustid = values

    newappointment_date = request_data['appointment_date']
    newcustomer_note = request_data['customer_note']
    newappointment_status = request_data['appointment_status']

    #Appointment Total added based on service_type:
    if 'Haircut' in request_data['service_type']:
        newappointment_total = 25
    else:
         newappointment_total = 40

    #Query for inserting to appointment table:
    query_insert_appointment = """INSERT
    INTO Appointment ( customer_id, employee_id, appointment_date, customer_note, appointment_status, appointment_total) 
    values ('%s','%s','%s','%s','%s','%s')"""%(newcustid,newemployee_id, newappointment_date, newcustomer_note, newappointment_status, newappointment_total)

    execute_query(conn, query_insert_appointment)

    return 'Add request successful!'
 

@app.route('/api/AppointmentsCustomer', methods=['GET'])
def api_appointmentscust():
    #query for sql to see appointment table:
   
    query = """Select Concat(Customer.first_name,' ', Customer.last_name) AS 'Name',
appointment_date, appointment_status, email,
phone_number From Appointment
join Customer
on Appointment.customer_id = Customer.customer_id;
"""
 
    appointmentinfo = execute_read_query(conn, query)
 
    #adds the data to a blank list then returns it with jsonify:
 
    appointmentdata = []
 
    for appt in appointmentinfo:
        appointmentdata.append(appt)
   
    return jsonify(appointmentdata)

# (report 7) Number of scheduled appointments per employee
@app.route('/api/ScheduledAppointmentsPerEmployee', methods=['GET'])
def api_scheduledperemployee():
     #SQL query to group the number of scheduled appointments per employee

    query = """SELECT 
    Employee.employee_first_name, 
    Employee.employee_last_name, 
    COUNT(Appointment.appointment_id) AS NumAppointments
FROM 
    Employee
    JOIN Appointment ON Employee.employee_id = Appointment.employee_id
WHERE 
    Appointment.appointment_status = 'SCHEDULED'
GROUP BY 
    Employee.employee_first_name, 
    Employee.employee_last_name;
"""
 
    appointmentinfo = execute_read_query(conn, query)
 
    #adds the data to a blank list then returns it with jsonify:
 
    appointmentdata = []
 
    for appt in appointmentinfo:
        appointmentdata.append(appt)
   
    return jsonify(appointmentdata)

# (report 8) Most and Least Profitable Service To date
@app.route('/api/ServiceProfitability', methods=['GET'])
def api_profitability():
     
# Most Profitable
    query1 = """select service_type as 'Most Profitable Service', sum(price) as 'Total Earned'from
    CIS4375Project.Service inner join CIS4375Project.AppointmentService
    on Service.service_id =  AppointmentService.service_id
    inner join CIS4375Project.Appointment
    ON AppointmentService.appointment_id = Appointment.appointment_id
    where appointment_status != 'CANCELED'
    group by service_type
    order by sum(price) desc
    limit 1;"""

# Least Profitable
    query2 = """select service_type as 'Least Profitable Service', sum(price) as 'Total Earned'from
    CIS4375Project.Service inner join CIS4375Project.AppointmentService
    on Service.service_id =  AppointmentService.service_id
    inner join CIS4375Project.Appointment
    ON AppointmentService.appointment_id = Appointment.appointment_id
    where appointment_status != 'CANCELED'
    group by service_type
    order by sum(price) asc
    limit 1;"""

# Most and Least Profitable Service This Week
    #Most Profitable
    query3 = """select service_type as 'Most Profitable Service This Week', sum(price) as 'Total Earned' from
    CIS4375Project.Service inner join CIS4375Project.AppointmentService
    on Service.service_id =  AppointmentService.service_id
    inner join CIS4375Project.Appointment
    ON AppointmentService.appointment_id = Appointment.appointment_id
    where appointment_status != 'CANCELED'
    and appointment_date between date_sub(now(), interval 1 week) and now()
    group by service_type
    order by sum(price) desc
    limit 1;"""

    #Least Profitable
    query4 = """select service_type as 'Least Profitable Service This Week', sum(price) as 'Total Earned' from
    CIS4375Project.Service inner join CIS4375Project.AppointmentService
    on Service.service_id =  AppointmentService.service_id
    inner join CIS4375Project.Appointment
    ON AppointmentService.appointment_id = Appointment.appointment_id
    where appointment_status != 'CANCELED'
    and appointment_date between date_sub(now(), interval 1 week) and now()
    group by service_type
    order by sum(price) asc
    limit 1;"""

    profitinfo = execute_read_query(conn, query1)
    profitinfo2 = execute_read_query(conn, query2)
    profitinfo3 = execute_read_query(conn, query3)
    profitinfo4 = execute_read_query(conn, query4)

    mostprofitable = []
    leastprofitable = []
    mostprofitableweek = []
    leastprofitableweek = []


    for profit in profitinfo:
            mostprofitable.append(profit)
    
    for profit in profitinfo2:
            leastprofitable.append(profit)
    
    for profit in profitinfo3:
            mostprofitableweek.append(profit)

    for profit in profitinfo4:
            leastprofitableweek.append(profit)

    return jsonify(mostprofitable,leastprofitable, mostprofitableweek, leastprofitableweek)


     
     

app.run()