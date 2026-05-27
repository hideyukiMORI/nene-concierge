<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

final readonly class StartSessionResult
{
    public function __construct(
        public string   $sessionId,
        public NodeView $node,
    ) {
    }
}
