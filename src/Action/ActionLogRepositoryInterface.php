<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

interface ActionLogRepositoryInterface
{
    public function append(ActionLog $log): void;

    /** @return list<ActionLog> */
    public function findBySession(string $sessionId, int $organizationId): array;
}
