<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Database\DatabaseQueryExecutorInterface;
use Nene2\Database\DatabaseTransactionManagerInterface;

final readonly class PdoScenarioEdgeRepository implements ScenarioEdgeRepositoryInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface      $query,
        private DatabaseTransactionManagerInterface $tx,
    ) {
    }

    /** @return list<ScenarioEdge> */
    public function findByScenario(int $scenarioId, int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM scenario_edges WHERE scenario_id = ? AND organization_id = ? ORDER BY id ASC',
            [$scenarioId, $organizationId],
        );

        return array_map($this->hydrate(...), $rows);
    }

    /** @return list<ScenarioEdge> */
    public function findOutgoingEdges(string $nodeId, int $scenarioId, int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT * FROM scenario_edges WHERE source_node_id = ? AND scenario_id = ? AND organization_id = ? ORDER BY id ASC',
            [$nodeId, $scenarioId, $organizationId],
        );

        return array_map($this->hydrate(...), $rows);
    }

    /** @param list<ScenarioEdge> $edges */
    public function replaceAll(int $scenarioId, int $organizationId, array $edges): void
    {
        $this->tx->transactional(function (DatabaseQueryExecutorInterface $executor) use (
            $scenarioId,
            $organizationId,
            $edges,
        ): void {
            $executor->execute(
                'DELETE FROM scenario_edges WHERE scenario_id = ? AND organization_id = ?',
                [$scenarioId, $organizationId],
            );

            foreach ($edges as $edge) {
                $executor->insert(
                    'INSERT INTO scenario_edges (organization_id, scenario_id, source_node_id, target_node_id, label)
                     VALUES (?, ?, ?, ?, ?)',
                    [
                        $organizationId,
                        $scenarioId,
                        $edge->sourceNodeId,
                        $edge->targetNodeId,
                        $edge->label,
                    ],
                );
            }
        });
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): ScenarioEdge
    {
        return new ScenarioEdge(
            scenarioId:     (int) $row['scenario_id'],
            organizationId: (int) $row['organization_id'],
            sourceNodeId:   (string) $row['source_node_id'],
            targetNodeId:   (string) $row['target_node_id'],
            label:          isset($row['label']) ? (string) $row['label'] : null,
        );
    }
}
