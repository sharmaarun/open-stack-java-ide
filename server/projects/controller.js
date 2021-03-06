/* 
 * Copyright 2016 arunsharma.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require('../commons/fs.service');
var io = require('socket.io-client');
var passport;


exports.saveProject = function (req, res) {
    //TODO: check passport authentication
    //TODO: check the incoming data

    //create the basic project structure in the hdfs directory
    //
    console.log(req.body);
    if (req.body.project == undefined || req.body.project.name == undefined) {
        return res.status(400).send({msg: 'Invalid Project Schema!'});
    }
    console.log("Starting Save...");

    fs.copy(app.conf.template.path + '/' + app.conf.template.name, app.conf.projects.path + "/" + req.body.project.name, function (out) {
        if (out.status !== undefined && (out.status == "OK" || (out.status == "ERROR" && out.code == "EXISTS"))) {

            //now save the project json file
            var projectExtract = JSON.parse(JSON.stringify(req.body.project));
            fs.writeJSON(projectExtract, app.conf.projects.path + "/" + req.body.project.name + "/" + "project.json", function (err) {
                if (err) {
                    return res.status(500).send({status: "ERROR", msg: "Project Not Saved!"});
                }

                // now write the code file
                fs.writeFile(req.body.project.code, app.conf.projects.path + "/" + req.body.project.name + "/" + "Main.java", function (err) {
                    if (err) {
                        return res.status(500).send({status: "ERROR", msg: "Project Not Saved! [ Code is invalid! ]"});
                    }
                    return res.status(200).send({status: "OK", msg: "Project Saved!"});
                });

                
            });

        } else {
            return res.status(200).send({status: "OK", msg: "Could not save Project!"});
        }
    });


}

exports.list = function (req, res) {
    try{
        fs.list(app.conf.projects.path, function (l) {
            return res.json(l);
        });
    } catch (e) {
        console.error(e);
       return res.status(500).send({status:"ERROR",msg:"Internal Server Error!"});
    }
}

exports.getJSON = function (req, res) {
    if (req.body.name == undefined || req.body.name == null) {
        return res.status(400).send({status: "ERROR", msg: "Invalid Project Name/ Project not found!"});
    }
    console.log(req.body.name);
    try {
        var projectJson = fs.readJSON(app.conf.projects.path + "/" + req.body.name + "/project.json");
        var code = "'" + fs.readFile(app.conf.projects.path + "/" + req.body.name + "/Main.java") + "'";
        console.log(code);
        return res.json(projectJson);
    } catch (e) {
        console.log(e);
        return res.status(500).send({status: "ERROR", msg: "Server Error!"});
    }

}


exports.compileProject = function (req, res) {
    if (req.body.name == undefined || req.body.name == null) {
        return res.status(400).send({status: "ERROR", msg: "Invalid Project Name/ Project not found!"});
    }
    try {

        //pass the project full path+name to compiler
        var compile = new fs.run_cmd("javac",
                [app.conf.projects.path + "/" + req.body.name + "/" + "Main.java"]);
        
        return res.json({status:"OK",msg:"Command Executed!",output:compile.stdout,error:compile.stderr});
        
        

    } catch (e) {
        console.log(e);
        return res.status(500).send({status: "ERROR", msg: "Server Error!"});
    }

}


exports.runProject = function (req, res) {
    if (req.body.name == undefined || req.body.name == null) {
        return res.status(400).send({status: "ERROR", msg: "Invalid Project Name/ Project not found!"});
    }
    try {

        var socket = io.connect('http://localhost:3456', {reconnect: true});

// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected!');
});
socket.emit('CH01', 'me', 'test msg');

        //pass the project full path+name to compiler
        var compile = new fs.run_cmd("java",
                ["-cp",app.conf.projects.path + "/" + req.body.name,"Main"]);
        
        return res.json({status:"OK",msg:"Command Executed!",output:compile.stdout,error:compile.stderr});
        
        

    } catch (e) {
        console.log(e);
        return res.status(500).send({status: "ERROR", msg: "Server Error!"});
    }

}

module.exports = function (_passport) {
    passport = _passport;
    return exports;
};
