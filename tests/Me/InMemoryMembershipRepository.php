<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Me;

use NeNeConcierge\Me\Membership;
use NeNeConcierge\Me\MembershipRepositoryInterface;

final class InMemoryMembershipRepository implements MembershipRepositoryInterface
{
    /** @var array<int, list<Membership>> userId → list */
    private array $store = [];

    public function add(int $userId, Membership $membership): void
    {
        $this->store[$userId][] = $membership;
    }

    /** @return list<Membership> */
    public function listByUserId(int $userId): array
    {
        return $this->store[$userId] ?? [];
    }
}
