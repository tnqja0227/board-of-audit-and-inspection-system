import bcrypt from 'bcrypt';
import { User } from '../../src/model';

export async function requestAsAdmin(agent: ChaiHttp.Agent) {
    const password = 'adminpassword';
    const encrypted_password = await bcrypt.hash(password, 10);
    await User.create({
        email: 'admin@kaist.ac.kr',
        password: encrypted_password,
        isAdmin: true,
    });

    return agent.post('/users/login').send({
        email: 'admin@kaist.ac.kr',
        password: password,
    });
}

export function requestAsUser(agent: ChaiHttp.Agent, email: string) {
    return agent.post('/users/login').send({
        email: email,
        password: 'password',
    });
}
