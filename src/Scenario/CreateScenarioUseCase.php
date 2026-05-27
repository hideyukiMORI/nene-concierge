<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class CreateScenarioUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface     $scenarios,
        private ScenarioNodeRepositoryInterface $nodes,
        private ScenarioEdgeRepositoryInterface $edges,
    ) {
    }

    public function execute(CreateScenarioInput $input, int $organizationId): int
    {
        $scenario = new Scenario(
            name:           $input->name,
            status:         ScenarioStatus::Draft,
            organizationId: $organizationId,
            description:    $input->description,
        );

        $scenarioId = $this->scenarios->save($scenario);

        if ($input->nodes !== []) {
            $nodeEntities = array_map(
                fn (array $n) => $this->hydrateNode($n, $scenarioId, $organizationId),
                $input->nodes,
            );
            $this->nodes->replaceAll($scenarioId, $organizationId, $nodeEntities);
        }

        if ($input->edges !== []) {
            $edgeEntities = array_map(
                fn (array $e) => $this->hydrateEdge($e, $scenarioId, $organizationId),
                $input->edges,
            );
            $this->edges->replaceAll($scenarioId, $organizationId, $edgeEntities);
        }

        return $scenarioId;
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
