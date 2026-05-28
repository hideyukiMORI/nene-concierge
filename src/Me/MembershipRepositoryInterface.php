<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

interface MembershipRepositoryInterface
{
    /** @return list<Membership> */
    public function listByUserId(int $userId): array;
}
