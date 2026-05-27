<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ScenarioNode
{
    /** @param array<string, mixed> $data */
    public function __construct(
        public string           $nodeId,
        public int              $scenarioId,
        public int              $organizationId,
        public ScenarioNodeType $type,
        public string           $label,
        public array            $data      = [],
        public float            $positionX = 0.0,
        public float            $positionY = 0.0,
    ) {
    }
}
