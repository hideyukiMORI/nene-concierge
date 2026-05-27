<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Action;

use NeNeConcierge\Action\ActionLog;
use NeNeConcierge\Action\ActionLogRepositoryInterface;

final class InMemoryActionLogRepository implements ActionLogRepositoryInterface
{
    /** @var list<ActionLog> */
    public array $logs = [];

    public function append(ActionLog $log): void
    {
        $this->logs[] = $log;
    }

    /** @return list<ActionLog> */
    public function findBySession(string $sessionId, int $organizationId): array
    {
        return array_values(array_filter(
            $this->logs,
            static fn (ActionLog $l) => $l->sessionId === $sessionId && $l->organizationId === $organizationId,
        ));
    }
}
