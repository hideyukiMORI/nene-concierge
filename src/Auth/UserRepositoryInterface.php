<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    public function findById(int $id): ?User;

    /** @return list<User> */
    public function list(): array;

    public function create(string $email, string $passwordHash, string $role): User;

    public function updateRole(int $id, string $role): void;

    public function updatePassword(int $id, string $passwordHash): void;

    public function delete(int $id): void;

    public function countByRole(string $role): int;
}
