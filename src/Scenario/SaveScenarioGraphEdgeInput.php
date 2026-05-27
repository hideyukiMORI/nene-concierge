<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class SaveScenarioGraphEdgeInput
{
    public function __construct(
        public string  $sourceNodeId,
        public string  $targetNodeId,
        public ?string $label,
    ) {
    }
}
