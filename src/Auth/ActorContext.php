<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

use Psr\Http\Message\ServerRequestInterface;

final readonly class ActorContext
{
    public function __construct(
        public ?int    $userId,
        public ?string $email,
    ) {
    }

    public static function fromRequest(ServerRequestInterface $request): self
    {
        $claims = (array) ($request->getAttribute('nene2.auth.claims') ?? []);

        $userId = isset($claims['user_id']) ? (int) $claims['user_id'] : null;
        $email  = isset($claims['sub']) ? (string) $claims['sub'] : null;

        return new self($userId, $email);
    }
}
