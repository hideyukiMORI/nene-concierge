<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use NeNeConcierge\Auth\ActorContext;

final readonly class SaveScenarioGraphUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface     $scenarios,
        private ScenarioNodeRepositoryInterface $nodes,
        private ScenarioEdgeRepositoryInterface $edges,
        private ScenarioRevisionRecorder        $revisions,
    ) {
    }

    public function execute(SaveScenarioGraphInput $input, ActorContext $actor): void
    {
        $scenario = $this->scenarios->findById($input->scenarioId, $input->organizationId);

        if ($scenario === null) {
            throw new ScenarioNotFoundException($input->scenarioId);
        }

        $nodes = array_map(
            static fn (SaveScenarioGraphNodeInput $n): ScenarioNode => new ScenarioNode(
                nodeId:         $n->nodeId,
                scenarioId:     $input->scenarioId,
                organizationId: $input->organizationId,
                type:           $n->type,
                label:          $n->label,
                data:           $n->data,
                positionX:      $n->positionX,
                positionY:      $n->positionY,
            ),
            $input->nodes,
        );

        $edges = array_map(
            static fn (SaveScenarioGraphEdgeInput $e): ScenarioEdge => new ScenarioEdge(
                scenarioId:     $input->scenarioId,
                organizationId: $input->organizationId,
                sourceNodeId:   $e->sourceNodeId,
                targetNodeId:   $e->targetNodeId,
                label:          $e->label,
            ),
            $input->edges,
        );

        $this->nodes->replaceAll($input->scenarioId, $input->organizationId, $nodes);
        $this->edges->replaceAll($input->scenarioId, $input->organizationId, $edges);

        $this->scenarios->touchUpdatedBy($input->scenarioId, $input->organizationId, $actor->userId);

        $reloaded = $this->scenarios->findById($input->scenarioId, $input->organizationId);
        if ($reloaded !== null) {
            $this->revisions->record($reloaded, 'graph_save', $actor);
        }
    }
}
