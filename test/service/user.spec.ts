import { expect } from 'chai';
import * as UserService from '../../src/service/user';

describe('UserService', function () {
    describe('generateRandomPassword()', function () {
        it('랜덤 비밀번호를 생성한다.', function () {
            const password = UserService.generateRandomPassword();
            expect(password.length).to.equal(12);
        });
    });
})