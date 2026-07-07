import type { ServiceSchema } from './schema';

export type ServiceMeta = {
    term?: string;
    amount?: string;
    rate?: string;
    audience?: string;
};

export type CategoryRef = {
    slug: string;
    name: string;
    color: string | null;
    icon: string | null;
};

export type OrganizationRef = {
    name?: string;
    short_name: string | null;
    color: string | null;
};

export type ServiceCard = {
    slug: string;
    title: string;
    summary: string | null;
    is_popular: boolean;
    is_complex: boolean;
    meta: ServiceMeta | null;
    steps_count: number;
    category: CategoryRef | null;
    organization: OrganizationRef | null;
};

export type OrganizationFull = OrganizationRef & {
    description?: string | null;
    website?: string | null;
};

export type ServiceFull = Omit<ServiceCard, 'organization'> & {
    description: string | null;
    schema: ServiceSchema | null;
    organization: OrganizationFull | null;
};

export type Category = {
    slug: string;
    name: string;
    icon: string | null;
    color: string | null;
    services_count: number;
};

export type PortalStats = {
    services: number;
    organizations: number;
    projects: number;
    regions: number;
    financed: number;
};
