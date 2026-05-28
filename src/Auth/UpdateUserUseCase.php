<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class UpdateUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {
    }

    public function execute(UpdateUserInput $input): User
    {
        $user = $this->users->findById($input->id);
        if ($user === null) {
            throw new UserNotFoundException($input->id);
        }

        // 最後の superadmin を降格させないガード
        if ($input->role !== null
            && $input->role !== Role::Superadmin->value
            && $user->role === Role::Superadmin->value
            && $this->users->countByRole(Role::Superadmin->value) <= 1
        ) {
            throw new UserOperationForbiddenException(
                reason: 'last_superadmin',
                message: 'Cannot demote the last superadmin.',
            );
        }

        if ($input->role !== null && $input->role !== $user->role) {
            $this->users->updateRole($input->id, $input->role);
        }

        if ($input->status !== null && $input->status !== $user->status) {
            $this->users->updateStatus($input->id, $input->status);
        }

        if ($input->password !== null && $input->password !== '') {
            $this->users->updatePassword($input->id, password_hash($input->password, PASSWORD_DEFAULT));
        }

        $updated = $this->users->findById($input->id);
        assert($updated !== null);
        return $updated;
    }
}
