<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

final readonly class ActionLog
{
    public function __construct(
        public int     $organizationId,
        public string  $sessionId,
        public int     $scenarioId,
        public string  $nodeId,
        public string  $adapter,
        public string  $status,
        public string  $executedAt,
        public ?string $errorMessage = null,
        public ?int    $id           = null,
    ) {
    }
}
