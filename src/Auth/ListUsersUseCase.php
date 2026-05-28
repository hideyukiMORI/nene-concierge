<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class ListUsersUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {
    }

    public function execute(): ListUsersOutput
    {
        $items = array_map(
            static fn (User $u): ListUsersItem => new ListUsersItem(
                id: $u->id,
                email: $u->email,
                role: $u->role,
                status: $u->status,
                createdAt: $u->createdAt,
                updatedAt: $u->updatedAt,
            ),
            $this->users->list(),
        );

        return new ListUsersOutput(items: $items);
    }
}
