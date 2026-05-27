<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

enum MessageRole: string
{
    case Bot     = 'bot';
    case Visitor = 'visitor';
}

/**
 * A single message in a visitor's chat session.
 */
final readonly class SessionMessage
{
    public function __construct(
        public string      $sessionId,
        public int         $organizationId,
        public MessageRole $role,
        public string      $content,
        public string      $createdAt,
        public ?string     $nodeId = null,
        public ?int        $id     = null,
    ) {
    }
}
