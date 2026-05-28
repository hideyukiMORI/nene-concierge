<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class DeleteUserUseCase
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {
    }

    public function execute(int $id, ?int $requesterUserId): void
    {
        $user = $this->users->findById($id);
        if ($user === null) {
            throw new UserNotFoundException($id);
        }

        // 自分自身の削除を禁止
        if ($requesterUserId !== null && $requesterUserId === $id) {
            throw new UserOperationForbiddenException(
                reason: 'self_delete',
                message: 'You cannot delete your own account.',
            );
        }

        // 最後の superadmin を削除させないガード
        if ($user->role === Role::Superadmin->value
            && $this->users->countByRole(Role::Superadmin->value) <= 1
        ) {
            throw new UserOperationForbiddenException(
                reason: 'last_superadmin',
                message: 'Cannot delete the last superadmin.',
            );
        }

        $this->users->delete($id);
    }
}
