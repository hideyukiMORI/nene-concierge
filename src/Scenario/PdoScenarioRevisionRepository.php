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

    /**
     * @return list<array<string, mixed>>
     */
    public function searchByOrganization(
        int $organizationId,
        ?int $scenarioId,
        ?int $userId,
        ?string $operation,
        ?string $query,
        ?int $dateFromUnix,
        ?int $dateToUnix,
        int $limit,
        int $offset,
    ): array {
        [$where, $params] = $this->buildWhere(
            $organizationId,
            $scenarioId,
            $userId,
            $operation,
            $query,
            $dateFromUnix,
            $dateToUnix,
        );

        $sql = 'SELECT r.*, s.name AS scenario_name
                FROM scenario_revisions r
                LEFT JOIN scenarios s ON s.id = r.scenario_id
                WHERE ' . $where . '
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT ? OFFSET ?';

        $params[] = $limit;
        $params[] = $offset;

        return $this->query->fetchAll($sql, $params);
    }

    public function countByOrganization(
        int $organizationId,
        ?int $scenarioId,
        ?int $userId,
        ?string $operation,
        ?string $query,
        ?int $dateFromUnix,
        ?int $dateToUnix,
    ): int {
        [$where, $params] = $this->buildWhere(
            $organizationId,
            $scenarioId,
            $userId,
            $operation,
            $query,
            $dateFromUnix,
            $dateToUnix,
        );

        $row = $this->query->fetchOne(
            'SELECT COUNT(*) AS cnt FROM scenario_revisions r WHERE ' . $where,
            $params,
        );

        return (int) ($row['cnt'] ?? 0);
    }

    public function findById(int $id, int $organizationId): ?ScenarioRevision
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM scenario_revisions WHERE id = ? AND organization_id = ? LIMIT 1',
            [$id, $organizationId],
        );

        return $row !== null ? $this->hydrate($row) : null;
    }

    public function findPreviousFor(int $scenarioId, int $organizationId, int $revisionNo): ?ScenarioRevision
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM scenario_revisions
             WHERE scenario_id = ? AND organization_id = ? AND revision_no < ?
             ORDER BY revision_no DESC
             LIMIT 1',
            [$scenarioId, $organizationId, $revisionNo],
        );

        return $row !== null ? $this->hydrate($row) : null;
    }

    /**
     * @return array{0: string, 1: list<scalar|null>}
     */
    private function buildWhere(
        int $organizationId,
        ?int $scenarioId,
        ?int $userId,
        ?string $operation,
        ?string $query,
        ?int $dateFromUnix,
        ?int $dateToUnix,
    ): array {
        $clauses = ['r.organization_id = ?'];
        $params  = [$organizationId];

        if ($scenarioId !== null) {
            $clauses[] = 'r.scenario_id = ?';
            $params[]  = $scenarioId;
        }

        if ($userId !== null) {
            $clauses[] = 'r.user_id = ?';
            $params[]  = $userId;
        }

        if ($operation !== null && $operation !== '') {
            $clauses[] = 'r.operation = ?';
            $params[]  = $operation;
        }

        if ($query !== null && $query !== '') {
            $clauses[] = '(r.name LIKE ? OR r.user_email LIKE ?)';
            $like      = '%' . $query . '%';
            $params[]  = $like;
            $params[]  = $like;
        }

        if ($dateFromUnix !== null) {
            $clauses[] = 'r.created_at >= FROM_UNIXTIME(?)';
            $params[]  = $dateFromUnix;
        }

        if ($dateToUnix !== null) {
            $clauses[] = 'r.created_at < FROM_UNIXTIME(?)';
            $params[]  = $dateToUnix;
        }

        return [implode(' AND ', $clauses), $params];
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
