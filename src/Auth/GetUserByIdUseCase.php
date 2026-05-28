<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class GetUserByIdUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {
    }

    public function execute(int $id): User
    {
        $user = $this->users->findById($id);
        if ($user === null) {
            throw new UserNotFoundException($id);
        }
        return $user;
    }
}
