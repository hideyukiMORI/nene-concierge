<?php

declare(strict_types=1);

namespace NeNeConcierge\Organization;

final readonly class DeleteOrganizationInput
{
    public function __construct(
        public int $id,
    ) {
    }
}
