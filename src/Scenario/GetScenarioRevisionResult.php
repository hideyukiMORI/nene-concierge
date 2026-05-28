<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class GetScenarioRevisionResult
{
    public function __construct(
        public ScenarioRevision  $revision,
        public ?ScenarioRevision $previous,
    ) {
    }
}
