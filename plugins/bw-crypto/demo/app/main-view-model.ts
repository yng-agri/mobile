import { Observable } from 'tns-core-modules/data/observable';

export class HelloWorldModel extends Observable {
  message: string;

  constructor() {
    super();
    this.message = 'Hello World';
  }
}
