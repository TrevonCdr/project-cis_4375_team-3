import flask
from flask import jsonify
from flask import request, make_response
import mysql.connector
from mysql.connector import Error
from SQL import create_connection
from SQL import execute_query
from SQL import execute_read_query

#setting up the application
app = flask.Flask(__name__) #sets up the application
app.config["DEBUG"] = True #all to show errors in browser

#Establishing the connection to my server:

conn = create_connection('cis4375project.ceaacvjhw0y3.us-east-1.rds.amazonaws.com', 'admin', 'C!s4e75Gr0up3!', 'CIS4375Project')

#localhost:5000/api/Account
@app.route('/api/Account', methods=['GET'])
def api_all_accounts():

    #query for sql to select account table:

    query = "SELECT * FROM Account"

    Accountinfo = execute_read_query(conn, query)

    #adds the data to a blank list then returns it with jsonify:

    accountdata = []

    for account in Accountinfo:
        accountdata.append(account)
    
    return jsonify(accountdata)


app.run()
