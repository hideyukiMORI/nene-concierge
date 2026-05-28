<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoScenarioRevisionRepository implements ScenarioRevisionRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function append(ScenarioRevision $revision): int
    {
        return $this->query->insert(
            'INSERT INTO scenario_revisions
                (organization_id, scenario_id, revision_no, user_id, user_email, operation,
                 name, description, status, node_count, edge_count, snapshot_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [
                $revision->organizationId,
                $revision->scenarioId,
                $revision->revisionNo,
                $revision->userId,
                $revision->userEmail,
                $revision->operation,
                $revision->name,
                $revision->description,
                $revision->status,
                $revision->nodeCount,
                $revision->edgeCount,
                $revision->snapshotJson,
            ],
        );
    }

    public function nextRevisionNo(int $scenarioId, int $organizationId): int
    {
        $row = $this->query->fetchOne(
            'SELECT COALESCE(MAX(revision_no), 0) AS max_no
             FROM scenario_revisions WHERE scenario_id = ? AND organization_id = ?',
            [$scenarioId, $organizationId],
        );

        return ((int) ($row['max_no'] ?? 0)) + 1;
    }

    /** @return list<ScenarioRevision> */
    public function listByScenario(int $scenarioId, int $organizationId, int $limit, int $offset): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM scenario_revisions
             WHERE scenario_id = ? AND organization_id = ?
             ORDER BY revision_no DESC
             LIMIT ? OFFSET ?',
            [$scenarioId, $organizationId, $limit, $offset],
        );

        return array_map($this->hydrate(...), $rows);
    }

    public function countByScenario(int $scenarioId, int $organizationId): int
    {
        $row = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM scenario_revisions
             WHERE scenario_id = ? AND organization_id = ?',
            [$scenarioId, $organizationId],
        );

        return (int) ($row['cnt'] ?? 0);
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): ScenarioRevision
    {
        return new ScenarioRevision(
            scenarioId:     (int) $row['scenario_id'],
            organizationId: (int) $row['organization_id'],
            revisionNo:     (int) $row['revision_no'],
            userId:         isset($row['user_id']) ? (int) $row['user_id'] : null,
            userEmail:      isset($row['user_email']) ? (string) $row['user_email'] : null,
            operation:      (string) $row['operation'],
            name:           isset($row['name']) ? (string) $row['name'] : null,
            description:    isset($row['description']) ? (string) $row['description'] : null,
            status:         isset($row['status']) ? (string) $row['status'] : null,
            nodeCount:      (int) ($row['node_count'] ?? 0),
            edgeCount:      (int) ($row['edge_count'] ?? 0),
            snapshotJson:   isset($row['snapshot_json']) ? (string) $row['snapshot_json'] : null,
            id:             (int) $row['id'],
            createdAt:      isset($row['created_at']) ? (string) $row['created_at'] : null,
        );
    }
}
