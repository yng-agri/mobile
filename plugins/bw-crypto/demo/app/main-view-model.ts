import { Observable } from 'tns-core-modules/data/observable';

import { BwCrypto } from 'nativescript-bw-crypto';

export class HelloWorldModel extends Observable {
  message: string;

  constructor() {
    super();
    const bwCrypto = new BwCrypto();
    this.message = 'Hello World';
  }
}
