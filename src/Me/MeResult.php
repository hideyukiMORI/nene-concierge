<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

use NeNeConcierge\Auth\User;
use NeNeConcierge\Organization\Organization;

final readonly class MeResult
{
    /** @param list<Membership> $memberships */
    public function __construct(
        public User          $user,
        public array         $memberships,
        public ?Organization $currentOrganization,
    ) {
    }
}
