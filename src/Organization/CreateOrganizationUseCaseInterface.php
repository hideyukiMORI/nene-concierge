<?php

declare(strict_types=1);

namespace NeNeConcierge\Organization;

interface CreateOrganizationUseCaseInterface
{
    public function execute(CreateOrganizationInput $input): CreateOrganizationOutput;
}
