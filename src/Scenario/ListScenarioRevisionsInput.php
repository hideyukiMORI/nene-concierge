<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ListScenarioRevisionsInput
{
    public function __construct(
        public int     $organizationId,
        public ?int    $scenarioId    = null,
        public ?int    $userId        = null,
        public ?string $operation     = null,
        public ?string $query         = null,
        public ?int    $dateFromUnix  = null,
        public ?int    $dateToUnix    = null,
        public int     $limit         = 50,
        public int     $offset        = 0,
    ) {
    }
}
