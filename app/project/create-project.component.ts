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


import {Component} from '@angular/core';
import {HTTP_PROVIDERS, Http, Response, Headers, RequestOptions} from "@angular/http";
import {Observable} from "rxjs/Rx";
import {ActivatedRoute} from '@angular/router';
import {Commons} from '../home/commons.component';
@Component({
    templateUrl: 'app/project/create-project.component.html'
     providers: [HTTP_PROVIDERS]
})

export class CreateProjectPage {

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.projectName = params['name']; // (+) converts string 'id' to a number
            if(params['name']!==undefined && params['name']!==null && params['name']!==""){
            this.preloadProject = true;
        }
            // In a real app: dispatch action to load the details here.
        });
    }

    public projectName = "";
    preloadProject = false;
    title = "Create Project"
    

    public project = {name : "Undefined"};
    public output = "Please save and compile first!";
    public headers = new Headers({ 'Content-Type': 'application/json' });
    public codeEditor;
    public constructor(public _http: Http, public route: ActivatedRoute) {
        var _this_ = this;

        //starting setup
        var tmp = 'Untitiled' + new Date().getMilliseconds();
        _this_.setProjectName(tmp);

        setTimeout(function() {
            console.log("Project : " );
            console.log(_this_.project);
            _this_.saSetup();
            CreateProjectPage.__LOAD_ONCE_EDITOR = false;
        }, 1000);

        var _this_ = this;
        
        

    }

    public setProjectName(name) {
        var _this_ = this;
        _this_.projectName = name;
        _this_.project.name = name;
    }
    
    public saSetup() {
        
        var _this_ = this;
        //if project is to be reloaded [comming from the projects page]
        if(_this_.preloadProject) {
            _this_.setProjectName(_this_.projectName);

            // do http get for getting project details

            _this_._http.post('api/projects/json',{name:_this_.project.name}, _this_.headers).map(response => response.json())
           .subscribe(p => { 
               _this_.project = p;
               _this_.setProjectName(p.name);
               $("#editorMain").val(p.code);
               _this_.setupEditor();
           }, e => { console.log(e); }, s => { console.log(s); });

        } else {
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

        

    }

    public setupEditor() {
        var _this_ = this;
        //initialize the code editor
        _this_.codeEditor = CodeMirror.fromTextArea($("#editorMain")[0],{
            mode : "text/x-java",
            value: "package com.osjide ;"
        });
    }

    

    public save() {
        var _this_ = this;
        _this_.project.code = _this_.codeEditor.getValue();
        Commons.loaderShow();
        console.log(_this_.project);
        //fill up fixed props
        this._http.post('api/projects/save', { project: _this_.project }, this.headers).map(response => response.json())
            .subscribe(d => { console.log(d);
            Commons.loaderDone();
              }, e => { console.log(e); }, s => { console.log(s); });


    }

    public clearOutput() {
        this.output="";
    }
    
    public compile(cb) {
        var _this_ = this;
        var calledBack = false;
        Commons.loaderShow();
        this.output = "<br/>Starting compiling ...";
        this._http.post('/api/projects/compile', { name: _this_.projectName }, this.headers).map(response => response.json())
            .subscribe(p => {
                _this_.output += "<br/>Done compiling! Output:";
                if(p.output!==undefined && p.output!==null && p.output!==""){
                    
                    _this_.output += "<br/><b>" + p.output.replace("\n","<br/>") +"</b>";
                    
                } 
                if(p.error!==undefined && p.error!==null && p.error!==""){
                    _this_.output += "<br/><b>" + p.error.replace("\n","<br/>") +"</b>";
                    
                } 
                    _this_.output += "<br/>" + p.msg.replace("\n","<br/>").replace("\n","<br/>");
                    Commons.loaderDone("");
                
                if(cb && !calledBack){
                    calledBack = true;
                    cb(p);
                }
              
            }, e => { Commons.loaderDone(e);
                if(cb && !calledBack ){
                    calledBack = true;
                    cb(e);
                }
                }, s => { console.log(s); if(cb && !calledBack) {calledBack = true; cb(s);});

    }

    public run(cb) {
        var _this_ = this;
        _this_.compile(function(d){
            console.log(d);
            if(d.msg==undefined || d.msg==null || d.msg=="") {
                _this_.output+="<br/> Not running because unable to compile!";
                return;
            }
            Commons.loaderShow();
            //now run
            _this_._http.post('/api/projects/run', { name: _this_.projectName }, _this_.headers).map(response => response.json())
            .subscribe(p => {
                _this_.output += "<br/> Done executing! Output:";
                if(p.output!==undefined && p.output!==null && p.output!==""){
                    
                    _this_.output += "<br/><b>" + p.output.replace("\n","<br/>") +"</b>";
                    
                } 
                if(p.error!==undefined && p.error!==null && p.error!==""){
                    _this_.output += "<br/><b>" + p.error.replace("\n","<br/>") + "</b>";
                    
                } 
                    _this_.output += "<br/>" + p.msg.replace("\n","<br/>");
                    Commons.loaderDone("");
                
                if(cb)
                cb(p);
              
            }, e => { Commons.loaderDone(e);
                if(cb)
                cb(e);
                }, s => { console.log(s); if(cb) cb(s);});

        });
    }

}