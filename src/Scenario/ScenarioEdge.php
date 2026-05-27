<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ScenarioEdge
{
    public function __construct(
        public int     $scenarioId,
        public int     $organizationId,
        public string  $sourceNodeId,
        public string  $targetNodeId,
        public ?string $label = null,
    ) {
    }
}
