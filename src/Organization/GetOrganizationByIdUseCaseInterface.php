<?php

declare(strict_types=1);

namespace NeNeConcierge\Organization;

interface GetOrganizationByIdUseCaseInterface
{
    public function execute(GetOrganizationByIdInput $input): GetOrganizationByIdOutput;
}
