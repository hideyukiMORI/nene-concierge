<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioEdgeRepositoryInterface;

final class InMemoryScenarioEdgeRepository implements ScenarioEdgeRepositoryInterface
{
    /** @var list<ScenarioEdge> */
    private array $store = [];

    /** @return list<ScenarioEdge> */
    public function findByScenario(int $scenarioId, int $organizationId): array
    {
        return array_values(array_filter(
            $this->store,
            static fn (ScenarioEdge $e) => $e->scenarioId === $scenarioId && $e->organizationId === $organizationId,
        ));
    }

    /** @return list<ScenarioEdge> */
    public function findOutgoingEdges(string $nodeId, int $scenarioId, int $organizationId): array
    {
        return array_values(array_filter(
            $this->store,
            static fn (ScenarioEdge $e) => $e->sourceNodeId === $nodeId
                && $e->scenarioId === $scenarioId
                && $e->organizationId === $organizationId,
        ));
    }

    /** @param list<ScenarioEdge> $edges */
    public function replaceAll(int $scenarioId, int $organizationId, array $edges): void
    {
        $this->store = array_values(array_filter(
            $this->store,
            static fn (ScenarioEdge $e) => !($e->scenarioId === $scenarioId && $e->organizationId === $organizationId),
        ));

        foreach ($edges as $edge) {
            $this->store[] = $edge;
        }
    }
}
