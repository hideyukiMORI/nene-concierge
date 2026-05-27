<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class GetScenarioResult
{
    /**
     * @param list<ScenarioNode> $nodes
     * @param list<ScenarioEdge> $edges
     */
    public function __construct(
        public Scenario $scenario,
        public array    $nodes,
        public array    $edges,
    ) {
    }
}
