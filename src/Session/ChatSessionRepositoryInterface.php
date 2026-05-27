<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

interface ChatSessionRepositoryInterface
{
    public function findById(string $id, int $organizationId): ?ChatSession;

    public function save(ChatSession $session): void;

    public function update(ChatSession $session): void;
}
