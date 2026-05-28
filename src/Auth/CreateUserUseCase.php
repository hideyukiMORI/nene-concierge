<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class CreateUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {
    }

    public function execute(CreateUserInput $input): User
    {
        if ($this->users->findByEmail($input->email) !== null) {
            throw new UserEmailConflictException($input->email);
        }

        $passwordHash = password_hash($input->password, PASSWORD_DEFAULT);

        return $this->users->create($input->email, $passwordHash, $input->role);
    }
}
