import { SetMetadata } from '@nestjs/common';

export const ORGANIZATION_CONTEXT_PARAM = 'dx-os:organization-context-param';

export function OrganizationContext(parameterName = 'organizationId'): MethodDecorator & ClassDecorator {
  return SetMetadata(ORGANIZATION_CONTEXT_PARAM, parameterName);
}
