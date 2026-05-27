<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

interface ScenarioEdgeRepositoryInterface
{
    /** @return list<ScenarioEdge> */
    public function findByScenario(int $scenarioId, int $organizationId): array;

    /** @return list<ScenarioEdge> */
    public function findOutgoingEdges(string $nodeId, int $scenarioId, int $organizationId): array;

    /**
     * Delete all edges for the scenario and insert $edges.
     *
     * @param list<ScenarioEdge> $edges
     */
    public function replaceAll(int $scenarioId, int $organizationId, array $edges): void;
}
