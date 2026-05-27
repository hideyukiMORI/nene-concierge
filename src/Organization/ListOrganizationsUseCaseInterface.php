<?php

declare(strict_types=1);

namespace NeNeConcierge\Organization;

interface ListOrganizationsUseCaseInterface
{
    public function execute(ListOrganizationsInput $input): ListOrganizationsOutput;
}
