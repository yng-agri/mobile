import { Observable } from 'tns-core-modules/data/observable';

import { BwSecureStorage } from 'nativescript-bw-secure-storage';

export class HelloWorldModel extends Observable {
  message: string;

  constructor() {
    super();
    const bwCrypto = new BwSecureStorage();
    this.message = 'Hello World';
  }
}
