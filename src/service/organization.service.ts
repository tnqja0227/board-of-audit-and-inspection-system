import { OrganizationRepository } from '../repository';

class OrganizationService {
    private organizationRepository: OrganizationRepository =
        new OrganizationRepository();

    async findAll() {
        return this.organizationRepository.findAll();
    }

    async createOrganization(organization_name: string) {
        const organization =
            await this.organizationRepository.createOrganization(
                organization_name,
            );
        return organization;
    }
}

export { OrganizationService };
