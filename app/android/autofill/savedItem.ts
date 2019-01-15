import { CipherType } from 'jslib/enums/cipherType';

export class SavedItem {
    type: CipherType;
    login: LoginItem;
    card: CardItem;
}

export class LoginItem {
    username: string;
    password: string;
}

export class CardItem {
    name: string;
    number: string;
    expMonth: string;
    expYear: string;
    code: string;
}
