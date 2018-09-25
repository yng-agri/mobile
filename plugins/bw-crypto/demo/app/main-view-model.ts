import { Observable } from 'tns-core-modules/data/observable';
import { BwCrypto } from 'nativescript-bw-crypto';

export class HelloWorldModel extends Observable {
  public message: string;
  private bwCrypto: BwCrypto;

  constructor() {
    super();

    this.bwCrypto = new BwCrypto();
    this.message = this.bwCrypto.message;
  }
}
