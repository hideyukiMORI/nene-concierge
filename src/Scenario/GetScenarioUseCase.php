<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class GetScenarioUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface     $scenarios,
        private ScenarioNodeRepositoryInterface $nodes,
        private ScenarioEdgeRepositoryInterface $edges,
    ) {
    }

    public function execute(int $scenarioId, int $organizationId): GetScenarioResult
    {
        $scenario = $this->scenarios->findById($scenarioId, $organizationId);

        if ($scenario === null) {
            throw new ScenarioNotFoundException($scenarioId);
        }

        $nodes = $this->nodes->findByScenario($scenarioId, $organizationId);
        $edges = $this->edges->findByScenario($scenarioId, $organizationId);

        return new GetScenarioResult($scenario, $nodes, $edges);
    }
}
