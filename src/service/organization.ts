import { Organization } from '../model';
import { NotFoundError } from '../utils/errors';

export async function findById(organization_id: string | number) {
    const organization = await Organization.findByPk(organization_id);
    if (!organization) {
        throw new NotFoundError(
            `${organization_id} 피감기관이 존재하지 않습니다`,
        );
    }
    return organization;
}

export async function findByName(organization_name: string) {
    const organization = await Organization.findOne({
        where: {
            name: organization_name,
        },
    });
    if (!organization) {
        throw new NotFoundError(
            `피감기구 ${organization_name}을 찾을 수 없습니다.`,
        );
    }
    return organization;
}
