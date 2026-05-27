<?php

declare(strict_types=1);

namespace NeNeConcierge\Organization;

use RuntimeException;

final class OrganizationNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Organization {$id} not found.");
    }
}
