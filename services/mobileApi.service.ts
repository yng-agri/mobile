import * as fe from 'fetch';

import { ApiService } from 'jslib/services/api.service';

import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { TokenService } from 'jslib/abstractions/token.service';

(global as any).fetch = fe.default;
(global as any).Request = fe.Request;
(global as any).Response = fe.Response;
(global as any).Headers = fe.Headers;
(global as any).FormData = fe.FormData;

export class MobileApiService extends ApiService {
    constructor(tokenService: TokenService, platformUtilsService: PlatformUtilsService,
        logoutCallback: (expired: boolean) => Promise<void>) {
        super(tokenService, platformUtilsService, logoutCallback);
    }
}
