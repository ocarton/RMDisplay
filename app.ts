// TypeScript
import {Component, View, bootstrap} from 'angular2/angular2';

@Component({
    selector: 'hello-angular2'
})
@View({
    template: "<h1>Hello {{ name | lowercase }}</h1>"
})
class HelloAngular2Cmp {
    name:string = "Angular2";
}


bootstrap(HelloAngular2Cmp);