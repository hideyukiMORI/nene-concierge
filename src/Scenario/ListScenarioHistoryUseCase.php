<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ListScenarioHistoryUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface         $scenarios,
        private ScenarioRevisionRepositoryInterface $revisions,
    ) {
    }

    public function execute(int $scenarioId, int $organizationId, int $limit, int $offset): ListScenarioHistoryResult
    {
        if ($this->scenarios->findById($scenarioId, $organizationId) === null) {
            throw new ScenarioNotFoundException($scenarioId);
        }

        $revisions = $this->revisions->listByScenario($scenarioId, $organizationId, $limit, $offset);
        $items     = array_map(
            static fn (ScenarioRevision $r): ListScenarioHistoryItem => new ListScenarioHistoryItem(
                id:         $r->id ?? 0,
                revisionNo: $r->revisionNo,
                userId:     $r->userId,
                userEmail:  $r->userEmail,
                operation:  $r->operation,
                name:       $r->name,
                status:     $r->status,
                nodeCount:  $r->nodeCount,
                edgeCount:  $r->edgeCount,
                createdAt:  $r->createdAt,
            ),
            $revisions,
        );

        return new ListScenarioHistoryResult($items, $this->revisions->countByScenario($scenarioId, $organizationId));
    }
}
