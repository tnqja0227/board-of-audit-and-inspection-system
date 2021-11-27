export const mockPassword = 'abcdefghjk!@';

export const mockEmail1 = 'test1@kaist.ac.kr';
export const mockEmail2 = 'test2@kaist.ac.kr';
export const mockEmail3 = 'test3@kaist.ac.kr';

export function createMockUser1(organizationId: number | string) {
    return {
        email: mockEmail1,
        password: mockPassword,
        initialPassword: mockPassword,
        OrganizationId: organizationId,
    };
}

export function createMockUser2(organizationId: number | string) {
    return {
        email: mockEmail2,
        password: mockPassword,
        initialPassword: mockPassword,
        OrganizationId: organizationId,
    };
}

export function createMockUser3(organizationId: number | string) {
    return {
        email: mockEmail3,
        password: mockPassword,
        initialPassword: mockPassword,
        OrganizationId: organizationId,
    };
}
