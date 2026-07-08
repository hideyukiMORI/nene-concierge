<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Http\ClockInterface;

final readonly class PdoUserRepository implements UserRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
        private ClockInterface $clock,
    ) {
    }

    public function findByEmail(string $email): ?User
    {
        $row = $this->query->fetchOne(
            'SELECT id, email, password_hash, role, status,
                    UNIX_TIMESTAMP(created_at) AS created_at,
                    UNIX_TIMESTAMP(updated_at) AS updated_at
             FROM users WHERE email = ?',
            [$email],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    public function findById(int $id): ?User
    {
        $row = $this->query->fetchOne(
            'SELECT id, email, password_hash, role, status,
                    UNIX_TIMESTAMP(created_at) AS created_at,
                    UNIX_TIMESTAMP(updated_at) AS updated_at
             FROM users WHERE id = ?',
            [$id],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    /** @return list<User> */
    public function list(): array
    {
        $rows = $this->query->fetchAll(
            'SELECT id, email, password_hash, role, status,
                    UNIX_TIMESTAMP(created_at) AS created_at,
                    UNIX_TIMESTAMP(updated_at) AS updated_at
             FROM users ORDER BY id ASC',
            [],
        );

        return array_map($this->mapRow(...), $rows);
    }

    public function create(string $email, string $passwordHash, string $role): User
    {
        $now = $this->clock->now()->format('Y-m-d H:i:s');
        $this->query->execute(
            'INSERT INTO users (email, password_hash, role, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)',
            [$email, $passwordHash, $role, 'active', $now, $now],
        );

        $user = $this->findByEmail($email);

        assert($user !== null);

        return $user;
    }

    public function updateRole(int $id, string $role): void
    {
        $this->query->execute(
            'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
            [$role, $id],
        );
    }

    public function updateStatus(int $id, string $status): void
    {
        $this->query->execute(
            'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
            [$status, $id],
        );
    }

    public function updatePassword(int $id, string $passwordHash): void
    {
        $this->query->execute(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [$passwordHash, $id],
        );
    }

    public function delete(int $id): void
    {
        $this->query->execute('DELETE FROM users WHERE id = ?', [$id]);
    }

    public function countByRole(string $role): int
    {
        $row = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM users WHERE role = ?',
            [$role],
        );

        return (int) ($row['cnt'] ?? 0);
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): User
    {
        return new User(
            id: (int) $row['id'],
            email: (string) $row['email'],
            passwordHash: (string) $row['password_hash'],
            role: (string) $row['role'],
            status: (string) ($row['status'] ?? 'active'),
            createdAt: isset($row['created_at']) ? (int) $row['created_at'] : null,
            updatedAt: isset($row['updated_at']) ? (int) $row['updated_at'] : null,
        );
    }
}
