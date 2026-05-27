<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class UpdateScenarioUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface     $scenarios,
        private ScenarioNodeRepositoryInterface $nodes,
        private ScenarioEdgeRepositoryInterface $edges,
    ) {
    }

    public function execute(UpdateScenarioInput $input, int $organizationId): void
    {
        $scenario = $this->scenarios->findById($input->scenarioId, $organizationId);

        if ($scenario === null) {
            throw new ScenarioNotFoundException($input->scenarioId);
        }

        $updated = new Scenario(
            name:           $input->name ?? $scenario->name,
            status:         $input->status ?? $scenario->status,
            organizationId: $organizationId,
            id:             $scenario->id,
            description:    $input->description ?? $scenario->description,
            createdAt:      $scenario->createdAt,
        );

        $this->scenarios->update($updated);

        if ($input->nodes !== null) {
            $nodeEntities = array_map(
                fn (array $n) => $this->hydrateNode($n, $input->scenarioId, $organizationId),
                $input->nodes,
            );
            $this->nodes->replaceAll($input->scenarioId, $organizationId, $nodeEntities);
        }

        if ($input->edges !== null) {
            $edgeEntities = array_map(
                fn (array $e) => $this->hydrateEdge($e, $input->scenarioId, $organizationId),
                $input->edges,
            );
            $this->edges->replaceAll($input->scenarioId, $organizationId, $edgeEntities);
        }
    }

    /** @param array<string, mixed> $n */
    private function hydrateNode(array $n, int $scenarioId, int $organizationId): ScenarioNode
    {
        return new ScenarioNode(
            nodeId:         (string) $n['node_id'],
            scenarioId:     $scenarioId,
            organizationId: $organizationId,
            type:           ScenarioNodeType::from((string) $n['type']),
            label:          (string) ($n['label'] ?? ''),
            data:           (array) ($n['data'] ?? []),
            positionX:      (float) ($n['position_x'] ?? 0.0),
            positionY:      (float) ($n['position_y'] ?? 0.0),
        );
    }

    /** @param array<string, mixed> $e */
    private function hydrateEdge(array $e, int $scenarioId, int $organizationId): ScenarioEdge
    {
        return new ScenarioEdge(
            scenarioId:     $scenarioId,
            organizationId: $organizationId,
            sourceNodeId:   (string) $e['source_node_id'],
            targetNodeId:   (string) $e['target_node_id'],
            label:          isset($e['label']) ? (string) $e['label'] : null,
        );
    }
}
