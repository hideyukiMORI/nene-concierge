<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

/**
 * A single outgoing edge the visitor can follow.
 */
final readonly class ChoiceView
{
    public function __construct(
        public string  $targetNodeId,
        public ?string $label,
    ) {
    }
}
