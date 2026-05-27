<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use NeNeConcierge\Session\SessionOutcome;

final readonly class StepSessionResult
{
    public function __construct(
        public NodeView       $node,
        public SessionOutcome $outcome,
    ) {
    }
}
