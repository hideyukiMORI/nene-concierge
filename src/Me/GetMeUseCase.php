<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

use NeNeConcierge\Auth\UserNotFoundException;
use NeNeConcierge\Auth\UserRepositoryInterface;
use NeNeConcierge\Organization\OrganizationRepositoryInterface;

final readonly class GetMeUseCase
{
    public function __construct(
        private UserRepositoryInterface         $users,
        private MembershipRepositoryInterface   $memberships,
        private OrganizationRepositoryInterface $organizations,
    ) {
    }

    public function execute(int $userId, ?int $currentOrganizationId): MeResult
    {
        $user = $this->users->findById($userId);
        if ($user === null) {
            throw new UserNotFoundException($userId);
        }

        $memberships = $this->memberships->listByUserId($userId);

        $current = null;
        if ($currentOrganizationId !== null) {
            $current = $this->organizations->findById($currentOrganizationId);
        }

        return new MeResult($user, $memberships, $current);
    }
}
