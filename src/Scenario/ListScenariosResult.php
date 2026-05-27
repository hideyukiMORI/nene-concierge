<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ListScenariosResult
{
    /**
     * @param list<Scenario> $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $limit,
        public int $offset,
    ) {
    }
}
