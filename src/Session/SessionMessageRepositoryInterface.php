<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

interface SessionMessageRepositoryInterface
{
    public function append(SessionMessage $message): void;

    /** @return list<SessionMessage> */
    public function findBySession(string $sessionId, int $organizationId): array;
}
