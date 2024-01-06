import express from 'express';
import { wrapAsync } from '../middleware';
import { validateIsAdmin } from '../middleware/auth';
import { UserController } from '../controller';

export function createUsersRouter() {
    const router = express.Router();
    const userController = new UserController();

    router.get(
        '/',
        wrapAsync(validateIsAdmin),
        wrapAsync(userController.findAll),
    );

    // 계정 생성
    // TODO: email sanitize (kaist email만 가능하도록)
    router.post('/', wrapAsync(userController.createUser));

    // 로그인
    router.post('/login', wrapAsync(userController.login));

    // 비밀번호 변경
    // TODO: 로그인 상태에서만 호출가능하도록 수정
    router.post('/password', wrapAsync(userController.changePassword));

    // 계정 비활성화
    router.put(
        '/disable',
        wrapAsync(validateIsAdmin),
        wrapAsync(userController.disableUser),
    );

    // 계정 활성화
    router.put(
        '/enable',
        wrapAsync(validateIsAdmin),
        wrapAsync(userController.enableUser),
    );

    return router;
}
