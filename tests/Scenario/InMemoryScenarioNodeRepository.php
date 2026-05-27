<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeRepositoryInterface;

final class InMemoryScenarioNodeRepository implements ScenarioNodeRepositoryInterface
{
    /** @var array<string, ScenarioNode> key = "{scenarioId}:{nodeId}" */
    private array $store = [];

    /** @return list<ScenarioNode> */
    public function findByScenario(int $scenarioId, int $organizationId): array
    {
        return array_values(array_filter(
            $this->store,
            static fn (ScenarioNode $n) => $n->scenarioId === $scenarioId && $n->organizationId === $organizationId,
        ));
    }

    public function findByNodeId(string $nodeId, int $scenarioId, int $organizationId): ?ScenarioNode
    {
        $key  = "{$scenarioId}:{$nodeId}";
        $node = $this->store[$key] ?? null;

        if ($node === null || $node->organizationId !== $organizationId) {
            return null;
        }

        return $node;
    }

    /** @param list<ScenarioNode> $nodes */
    public function replaceAll(int $scenarioId, int $organizationId, array $nodes): void
    {
        // Remove existing
        foreach (array_keys($this->store) as $key) {
            if (str_starts_with($key, "{$scenarioId}:")) {
                unset($this->store[$key]);
            }
        }

        foreach ($nodes as $node) {
            $this->store["{$scenarioId}:{$node->nodeId}"] = $node;
        }
    }
}
