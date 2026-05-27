<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;

final readonly class PdoScenarioNodeRepository implements ScenarioNodeRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface    $query,
        private DatabaseTransactionManagerInterface $tx,
    ) {
    }

    /** @return list<ScenarioNode> */
    public function findByScenario(int $scenarioId, int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM scenario_nodes WHERE scenario_id = ? AND organization_id = ? ORDER BY id ASC',
            [$scenarioId, $organizationId],
        );

        return array_map($this->hydrate(...), $rows);
    }

    public function findByNodeId(string $nodeId, int $scenarioId, int $organizationId): ?ScenarioNode
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM scenario_nodes WHERE node_id = ? AND scenario_id = ? AND organization_id = ? LIMIT 1',
            [$nodeId, $scenarioId, $organizationId],
        );

        return $row !== null ? $this->hydrate($row) : null;
    }

    /** @param list<ScenarioNode> $nodes */
    public function replaceAll(int $scenarioId, int $organizationId, array $nodes): void
    {
        $this->tx->transactional(function (DatabaseQueryExecutorInterface $executor) use (
            $scenarioId,
            $organizationId,
            $nodes,
        ): void {
            $executor->execute(
                'DELETE FROM scenario_nodes WHERE scenario_id = ? AND organization_id = ?',
                [$scenarioId, $organizationId],
            );

            foreach ($nodes as $node) {
                $executor->insert(
                    'INSERT INTO scenario_nodes (organization_id, scenario_id, node_id, type, label, data_json, position_x, position_y)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $organizationId,
                        $scenarioId,
                        $node->nodeId,
                        $node->type->value,
                        $node->label,
                        json_encode($node->data, JSON_THROW_ON_ERROR),
                        $node->positionX,
                        $node->positionY,
                    ],
                );
            }
        });
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): ScenarioNode
    {
        /** @var array<string, mixed> $data */
        $data = json_decode((string) $row['data_json'], true, 512, JSON_THROW_ON_ERROR);

        return new ScenarioNode(
            nodeId:         (string) $row['node_id'],
            scenarioId:     (int) $row['scenario_id'],
            organizationId: (int) $row['organization_id'],
            type:           ScenarioNodeType::from((string) $row['type']),
            label:          (string) $row['label'],
            data:           $data,
            positionX:      (float) $row['position_x'],
            positionY:      (float) $row['position_y'],
        );
    }
}
