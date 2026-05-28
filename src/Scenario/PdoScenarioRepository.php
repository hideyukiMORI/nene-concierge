<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoScenarioRepository implements ScenarioRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findById(int $id, int $organizationId): ?Scenario
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM scenarios WHERE id = ? AND organization_id = ? LIMIT 1',
            [$id, $organizationId],
        );

        return $row !== null ? $this->hydrate($row) : null;
    }

    /** @return list<Scenario> */
    public function findAll(int $organizationId, int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM scenarios WHERE organization_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
            [$organizationId, $limit, $offset],
        );

        return array_map($this->hydrate(...), $rows);
    }

    public function count(int $organizationId): int
    {
        $row = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM scenarios WHERE organization_id = ?',
            [$organizationId],
        );

        return (int) ($row['cnt'] ?? 0);
    }

    public function save(Scenario $scenario): int
    {
        return $this->query->insert(
            'INSERT INTO scenarios (organization_id, name, description, status, created_by_user_id, updated_by_user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [
                $scenario->organizationId,
                $scenario->name,
                $scenario->description,
                $scenario->status->value,
                $scenario->createdByUserId,
                $scenario->updatedByUserId ?? $scenario->createdByUserId,
            ],
        );
    }

    public function update(Scenario $scenario): void
    {
        $affected = $this->query->execute(
            'UPDATE scenarios SET name = ?, description = ?, status = ?, updated_by_user_id = ?, updated_at = NOW()
             WHERE id = ? AND organization_id = ?',
            [
                $scenario->name,
                $scenario->description,
                $scenario->status->value,
                $scenario->updatedByUserId,
                $scenario->id,
                $scenario->organizationId,
            ],
        );

        if ($affected === 0) {
            throw new ScenarioNotFoundException($scenario->id ?? 0);
        }
    }

    public function touchUpdatedBy(int $id, int $organizationId, ?int $userId): void
    {
        $this->query->execute(
            'UPDATE scenarios SET updated_by_user_id = ?, updated_at = NOW() WHERE id = ? AND organization_id = ?',
            [$userId, $id, $organizationId],
        );
    }

    public function delete(int $id, int $organizationId): void
    {
        $affected = $this->query->execute(
            'DELETE FROM scenarios WHERE id = ? AND organization_id = ?',
            [$id, $organizationId],
        );

        if ($affected === 0) {
            throw new ScenarioNotFoundException($id);
        }
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): Scenario
    {
        return new Scenario(
            name:            (string) $row['name'],
            status:          ScenarioStatus::from((string) $row['status']),
            organizationId:  (int) $row['organization_id'],
            id:              (int) $row['id'],
            description:     isset($row['description']) ? (string) $row['description'] : null,
            createdAt:       isset($row['created_at']) ? (string) $row['created_at'] : null,
            updatedAt:       isset($row['updated_at']) ? (string) $row['updated_at'] : null,
            createdByUserId: isset($row['created_by_user_id']) ? (int) $row['created_by_user_id'] : null,
            updatedByUserId: isset($row['updated_by_user_id']) ? (int) $row['updated_by_user_id'] : null,
        );
    }
}
