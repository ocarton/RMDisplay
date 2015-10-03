/// <reference path="typings/angular2/angular2.d.ts" />
import {Component, View, bootstrap} from 'angular2/angular2';

    // Annotation section
    @Component({
      selector: 'my-app'
    })
    @View({
      template: '<h1>Hello {{ nom }}</h1>'
    })
    // Component controller
    class MyAppComponent {
      nom: string;
      constructor() {
        this.nom = 'Alice';
      }
    }
	
	bootstrap(MyAppComponent);