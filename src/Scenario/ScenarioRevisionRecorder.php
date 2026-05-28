<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use NeNeConcierge\Auth\ActorContext;

final readonly class ScenarioRevisionRecorder
{
    public function __construct(
        private ScenarioRevisionRepositoryInterface $revisions,
        private ScenarioNodeRepositoryInterface     $nodes,
        private ScenarioEdgeRepositoryInterface     $edges,
    ) {
    }

    public function record(
        Scenario $scenario,
        string $operation,
        ActorContext $actor,
        bool $captureSnapshot = true,
    ): void {
        $scenarioId = $scenario->id ?? 0;
        if ($scenarioId === 0) {
            return;
        }

        $orgId = $scenario->organizationId;

        $nodes      = $captureSnapshot ? $this->nodes->findByScenario($scenarioId, $orgId) : [];
        $edges      = $captureSnapshot ? $this->edges->findByScenario($scenarioId, $orgId) : [];
        $nodeCount  = count($nodes);
        $edgeCount  = count($edges);

        $snapshotJson = null;
        if ($captureSnapshot) {
            $snapshotJson = json_encode([
                'name'        => $scenario->name,
                'description' => $scenario->description,
                'status'      => $scenario->status->value,
                'nodes'       => array_map(
                    static fn (ScenarioNode $n): array => [
                        'node_id'    => $n->nodeId,
                        'type'       => $n->type->value,
                        'label'      => $n->label,
                        'data'       => $n->data,
                        'position_x' => $n->positionX,
                        'position_y' => $n->positionY,
                    ],
                    $nodes,
                ),
                'edges'       => array_map(
                    static fn (ScenarioEdge $e): array => [
                        'source_node_id' => $e->sourceNodeId,
                        'target_node_id' => $e->targetNodeId,
                        'label'          => $e->label,
                    ],
                    $edges,
                ),
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            if ($snapshotJson === false) {
                $snapshotJson = null;
            }
        }

        $this->revisions->append(new ScenarioRevision(
            scenarioId:     $scenarioId,
            organizationId: $orgId,
            revisionNo:     $this->revisions->nextRevisionNo($scenarioId, $orgId),
            userId:         $actor->userId,
            userEmail:      $actor->email,
            operation:      $operation,
            name:           $scenario->name,
            description:    $scenario->description,
            status:         $scenario->status->value,
            nodeCount:      $nodeCount,
            edgeCount:      $edgeCount,
            snapshotJson:   $snapshotJson,
        ));
    }
}
