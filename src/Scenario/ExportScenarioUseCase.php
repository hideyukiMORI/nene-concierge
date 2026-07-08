<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\ClockInterface;

/**
 * Builds a portable ScenarioExportDocument from a stored scenario.
 *
 * The document strips all internal IDs (organization_id, scenario_id)
 * but preserves node positions, types, labels, data, and edge labels.
 */
final readonly class ExportScenarioUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface     $scenarios,
        private ScenarioNodeRepositoryInterface $nodes,
        private ScenarioEdgeRepositoryInterface $edges,
        private ClockInterface                  $clock,
    ) {
    }

    /** @throws ScenarioNotFoundException */
    public function execute(int $scenarioId, int $organizationId): ScenarioExportDocument
    {
        $scenario = $this->scenarios->findById($scenarioId, $organizationId);

        if ($scenario === null) {
            throw new ScenarioNotFoundException($scenarioId);
        }

        $nodes = $this->nodes->findByScenario($scenarioId, $organizationId);
        $edges = $this->edges->findByScenario($scenarioId, $organizationId);

        $nodeData = array_map(
            static fn (ScenarioNode $n): array => [
                'node_id'    => $n->nodeId,
                'type'       => $n->type->value,
                'label'      => $n->label,
                'data'       => $n->data,
                'position_x' => $n->positionX,
                'position_y' => $n->positionY,
            ],
            $nodes,
        );

        $edgeData = array_map(
            static fn (ScenarioEdge $e): array => [
                'source_node_id' => $e->sourceNodeId,
                'target_node_id' => $e->targetNodeId,
                'label'          => $e->label,
            ],
            $edges,
        );

        return new ScenarioExportDocument(
            name:        $scenario->name,
            exportedAt:  $this->clock->now()->format(\DateTimeInterface::ATOM),
            nodes:       $nodeData,
            edges:       $edgeData,
            description: $scenario->description,
        );
    }
}
