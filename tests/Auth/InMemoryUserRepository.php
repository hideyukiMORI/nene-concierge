<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Auth;

use NeNeConcierge\Auth\User;
use NeNeConcierge\Auth\UserRepositoryInterface;

final class InMemoryUserRepository implements UserRepositoryInterface
{
    /** @var array<int, User> */
    private array $store = [];

    private int $nextId = 1;

    public function findByEmail(string $email): ?User
    {
        foreach ($this->store as $user) {
            if ($user->email === $email) {
                return $user;
            }
        }

        return null;
    }

    public function findById(int $id): ?User
    {
        return $this->store[$id] ?? null;
    }

    /** @return list<User> */
    public function list(): array
    {
        return array_values($this->store);
    }

    public function create(string $email, string $passwordHash, string $role): User
    {
        $id   = $this->nextId++;
        $now  = time();
        $user = new User(
            id:           $id,
            email:        $email,
            passwordHash: $passwordHash,
            role:         $role,
            status:       'active',
            createdAt:    $now,
            updatedAt:    $now,
        );
        $this->store[$id] = $user;

        return $user;
    }

    public function updateRole(int $id, string $role): void
    {
        $u = $this->store[$id] ?? null;
        if ($u === null) {
            return;
        }

        $this->store[$id] = new User(
            id:           $u->id,
            email:        $u->email,
            passwordHash: $u->passwordHash,
            role:         $role,
            status:       $u->status,
            createdAt:    $u->createdAt,
            updatedAt:    time(),
        );
    }

    public function updateStatus(int $id, string $status): void
    {
        $u = $this->store[$id] ?? null;
        if ($u === null) {
            return;
        }

        $this->store[$id] = new User(
            id:           $u->id,
            email:        $u->email,
            passwordHash: $u->passwordHash,
            role:         $u->role,
            status:       $status,
            createdAt:    $u->createdAt,
            updatedAt:    time(),
        );
    }

    public function updatePassword(int $id, string $passwordHash): void
    {
        $u = $this->store[$id] ?? null;
        if ($u === null) {
            return;
        }

        $this->store[$id] = new User(
            id:           $u->id,
            email:        $u->email,
            passwordHash: $passwordHash,
            role:         $u->role,
            status:       $u->status,
            createdAt:    $u->createdAt,
            updatedAt:    time(),
        );
    }

    public function delete(int $id): void
    {
        unset($this->store[$id]);
    }

    public function countByRole(string $role): int
    {
        return count(array_filter(
            $this->store,
            static fn (User $u) => $u->role === $role,
        ));
    }
}
