<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class SaveScenarioGraphNodeInput
{
    /** @param array<string, mixed> $data */
    public function __construct(
        public string           $nodeId,
        public ScenarioNodeType $type,
        public string           $label,
        public array            $data,
        public float            $positionX,
        public float            $positionY,
    ) {
    }
}
