<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class SaveScenarioGraphInput
{
    /**
     * @param list<SaveScenarioGraphNodeInput> $nodes
     * @param list<SaveScenarioGraphEdgeInput> $edges
     */
    public function __construct(
        public int   $scenarioId,
        public int   $organizationId,
        public array $nodes,
        public array $edges,
    ) {
    }
}
