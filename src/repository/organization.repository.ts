import { Organization } from '../model';

class OrganizationRepository {
    async findById(organization_id: string | number) {
        return Organization.findByPk(organization_id);
    }

    async findByName(organization_name: string) {
        return Organization.findOne({
            where: {
                name: organization_name,
            },
        });
    }

    async findAll() {
        return Organization.findAll();
    }

    async createOrganization(organization_name: string) {
        return Organization.create({
            name: organization_name,
        });
    }
}

export { OrganizationRepository };
