<?php

declare(strict_types=1);

namespace NeNeConcierge\Organization;

interface UpdateOrganizationUseCaseInterface
{
    public function execute(UpdateOrganizationInput $input): UpdateOrganizationOutput;
}
