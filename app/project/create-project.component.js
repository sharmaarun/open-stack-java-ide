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
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var http_1 = require("@angular/http");
var router_1 = require('@angular/router');
var commons_component_1 = require('../home/commons.component');
var CreateProjectPage = (function () {
    function CreateProjectPage(_http, route) {
        this._http = _http;
        this.route = route;
        this.projectName = "";
        this.preloadProject = false;
        this.title = "Create Project";
        this.project = { name: "Undefined" };
        this.output = "Please save and compile first!";
        this.headers = new http_1.Headers({ 'Content-Type': 'application/json' });
        var _this_ = this;
        //starting setup
        var tmp = 'Untitiled' + new Date().getMilliseconds();
        _this_.setProjectName(tmp);
        setTimeout(function () {
            console.log("Project : ");
            console.log(_this_.project);
            _this_.saSetup();
            CreateProjectPage.__LOAD_ONCE_EDITOR = false;
        }, 1000);
        var _this_ = this;
    }
    CreateProjectPage.prototype.ngOnInit = function () {
        var _this = this;
        this.route.params.subscribe(function (params) {
            _this.projectName = params['name']; // (+) converts string 'id' to a number
            if (params['name'] !== undefined && params['name'] !== null && params['name'] !== "") {
                _this.preloadProject = true;
            }
            // In a real app: dispatch action to load the details here.
        });
    };
    CreateProjectPage.prototype.setProjectName = function (name) {
        var _this_ = this;
        _this_.projectName = name;
        _this_.project.name = name;
    };
    CreateProjectPage.prototype.saSetup = function () {
        var _this_ = this;
        //if project is to be reloaded [comming from the projects page]
        if (_this_.preloadProject) {
            _this_.setProjectName(_this_.projectName);
            // do http get for getting project details
            _this_._http.post('api/projects/json', { name: _this_.project.name }, _this_.headers).map(function (response) { return response.json(); })
                .subscribe(function (p) {
                _this_.project = p;
                _this_.setProjectName(p.name);
                $("#editorMain").val(p.code);
                _this_.setupEditor();
            }, function (e) { console.log(e); }, function (s) { console.log(s); });
        }
        else {
            //initialize startup code
            var _code = "//NOTE: Do not remove the class name \n\
public class Main { \n\
  public static void main (String args[]) { \n\
    \n\
    //TODO : Place your code here\n\
    System.out.println(\"Hello World!\");\n\
  }\n\
}";
            $("#editorMain").val(_code);
            _this_.setupEditor();
        }
    };
    CreateProjectPage.prototype.setupEditor = function () {
        var _this_ = this;
        //initialize the code editor
        _this_.codeEditor = CodeMirror.fromTextArea($("#editorMain")[0], {
            mode: "text/x-java",
            value: "package com.osjide ;"
        });
    };
    CreateProjectPage.prototype.save = function () {
        var _this_ = this;
        _this_.project.code = _this_.codeEditor.getValue();
        commons_component_1.Commons.loaderShow();
        console.log(_this_.project);
        //fill up fixed props
        this._http.post('api/projects/save', { project: _this_.project }, this.headers).map(function (response) { return response.json(); })
            .subscribe(function (d) {
            console.log(d);
            commons_component_1.Commons.loaderDone();
        }, function (e) { console.log(e); }, function (s) { console.log(s); });
    };
    CreateProjectPage.prototype.clearOutput = function () {
        this.output = "";
    };
    CreateProjectPage.prototype.compile = function (cb) {
        var _this_ = this;
        var calledBack = false;
        commons_component_1.Commons.loaderShow();
        this.output = "<br/>Starting compiling ...";
        this._http.post('/api/projects/compile', { name: _this_.projectName }, this.headers).map(function (response) { return response.json(); })
            .subscribe(function (p) {
            _this_.output += "<br/>Done compiling! Output:";
            if (p.output !== undefined && p.output !== null && p.output !== "") {
                _this_.output += "<br/><b>" + p.output.replace("\n", "<br/>") + "</b>";
            }
            if (p.error !== undefined && p.error !== null && p.error !== "") {
                _this_.output += "<br/><b>" + p.error.replace("\n", "<br/>") + "</b>";
            }
            _this_.output += "<br/>" + p.msg.replace("\n", "<br/>").replace("\n", "<br/>");
            commons_component_1.Commons.loaderDone("");
            if (cb && !calledBack) {
                calledBack = true;
                cb(p);
            }
        }, function (e) {
            commons_component_1.Commons.loaderDone(e);
            if (cb && !calledBack) {
                calledBack = true;
                cb(e);
            }
        }, function (s) { console.log(s); if (cb && !calledBack) {
            calledBack = true;
            cb(s);
        } });
    };
    CreateProjectPage.prototype.run = function (cb) {
        var _this_ = this;
        _this_.compile(function (d) {
            console.log(d);
            if (d.msg == undefined || d.msg == null || d.msg == "") {
                _this_.output += "<br/> Not running because unable to compile!";
                return;
            }
            commons_component_1.Commons.loaderShow();
            //now run
            _this_._http.post('/api/projects/run', { name: _this_.projectName }, _this_.headers).map(function (response) { return response.json(); })
                .subscribe(function (p) {
                _this_.output += "<br/> Done executing! Output:";
                if (p.output !== undefined && p.output !== null && p.output !== "") {
                    _this_.output += "<br/><b>" + p.output.replace("\n", "<br/>") + "</b>";
                }
                if (p.error !== undefined && p.error !== null && p.error !== "") {
                    _this_.output += "<br/><b>" + p.error.replace("\n", "<br/>") + "</b>";
                }
                _this_.output += "<br/>" + p.msg.replace("\n", "<br/>");
                commons_component_1.Commons.loaderDone("");
                if (cb)
                    cb(p);
            }, function (e) {
                commons_component_1.Commons.loaderDone(e);
                if (cb)
                    cb(e);
            }, function (s) { console.log(s); if (cb)
                cb(s); });
        });
    };
    CreateProjectPage = __decorate([
        core_1.Component({
            templateUrl: 'app/project/create-project.component.html',
            providers: [http_1.HTTP_PROVIDERS]
        }), 
        __metadata('design:paramtypes', [http_1.Http, router_1.ActivatedRoute])
    ], CreateProjectPage);
    return CreateProjectPage;
}());
exports.CreateProjectPage = CreateProjectPage;
//# sourceMappingURL=create-project.component.js.map