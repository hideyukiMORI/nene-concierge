<?php

declare(strict_types=1);

namespace NeNeConcierge\Organization;

interface DeleteOrganizationUseCaseInterface
{
    public function execute(DeleteOrganizationInput $input): void;
}
