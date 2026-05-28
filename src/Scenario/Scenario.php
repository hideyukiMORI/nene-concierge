<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class Scenario
{
    public function __construct(
        public string         $name,
        public ScenarioStatus $status,
        public int            $organizationId  = 0,
        public ?int           $id              = null,
        public ?string        $description     = null,
        public ?string        $createdAt       = null,
        public ?string        $updatedAt       = null,
        public ?int           $createdByUserId = null,
        public ?int           $updatedByUserId = null,
    ) {
    }
}
