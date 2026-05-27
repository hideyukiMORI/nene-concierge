<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

interface ScenarioNodeRepositoryInterface
{
    /** @return list<ScenarioNode> */
    public function findByScenario(int $scenarioId, int $organizationId): array;

    public function findByNodeId(string $nodeId, int $scenarioId, int $organizationId): ?ScenarioNode;

    /**
     * Delete all nodes for the scenario and insert $nodes.
     *
     * @param list<ScenarioNode> $nodes
     */
    public function replaceAll(int $scenarioId, int $organizationId, array $nodes): void;
}
