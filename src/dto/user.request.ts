export class CreateUserDto {
    email: string;
    organizationName: string;
    password: string;
    initialPassword: string;

    constructor(email: string, organizationName: string) {
        this.email = email;
        this.organizationName = organizationName;
        this.initialPassword = this.generateRandomPassword();
        this.password = this.initialPassword;
    }

    private generateRandomPassword(length: number = 12) {
        const charset =
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        return password;
    }
}

export class LoginDto {
    email: string;
    password: string;

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }
}

export class ChangePasswordDto {
    email: string;
    oldPassword: string;
    newPassword: string;

    constructor(email: string, oldPassword: string, newPassword: string) {
        this.email = email;
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }
}
