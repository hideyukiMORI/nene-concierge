<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ListScenarioRevisionsResult
{
    /** @param list<ListScenarioRevisionsItem> $items */
    public function __construct(
        public array $items,
        public int   $total,
    ) {
    }
}
