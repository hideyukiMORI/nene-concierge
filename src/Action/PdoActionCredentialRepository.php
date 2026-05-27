<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoActionCredentialRepository implements ActionCredentialRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findById(int $id, int $organizationId): ?ActionCredential
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM action_credentials WHERE id = ? AND organization_id = ? LIMIT 1',
            [$id, $organizationId],
        );

        return $row !== null ? $this->hydrate($row) : null;
    }

    /** @return list<ActionCredential> */
    public function findAll(int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM action_credentials WHERE organization_id = ? ORDER BY id ASC',
            [$organizationId],
        );

        return array_map($this->hydrate(...), $rows);
    }

    public function save(ActionCredential $credential): int
    {
        return $this->query->insert(
            'INSERT INTO action_credentials (organization_id, name, adapter, config_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())',
            [
                $credential->organizationId,
                $credential->name,
                $credential->adapter,
                json_encode($credential->config, JSON_THROW_ON_ERROR),
            ],
        );
    }

    public function update(ActionCredential $credential): void
    {
        $affected = $this->query->execute(
            'UPDATE action_credentials SET name = ?, adapter = ?, config_json = ?, updated_at = NOW()
             WHERE id = ? AND organization_id = ?',
            [
                $credential->name,
                $credential->adapter,
                json_encode($credential->config, JSON_THROW_ON_ERROR),
                $credential->id,
                $credential->organizationId,
            ],
        );

        if ($affected === 0) {
            throw new ActionCredentialNotFoundException($credential->id ?? 0);
        }
    }

    public function delete(int $id, int $organizationId): void
    {
        $affected = $this->query->execute(
            'DELETE FROM action_credentials WHERE id = ? AND organization_id = ?',
            [$id, $organizationId],
        );

        if ($affected === 0) {
            throw new ActionCredentialNotFoundException($id);
        }
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): ActionCredential
    {
        /** @var array<string, mixed> $config */
        $config = json_decode((string) $row['config_json'], true, 512, JSON_THROW_ON_ERROR);

        return new ActionCredential(
            organizationId: (int) $row['organization_id'],
            name:           (string) $row['name'],
            adapter:        (string) $row['adapter'],
            config:         $config,
            id:             (int) $row['id'],
            createdAt:      isset($row['created_at']) ? (string) $row['created_at'] : null,
            updatedAt:      isset($row['updated_at']) ? (string) $row['updated_at'] : null,
        );
    }
}
