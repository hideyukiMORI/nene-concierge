<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

final readonly class ListUsersOutput
{
    /** @param list<ListUsersItem> $items */
    public function __construct(public array $items)
    {
    }
}
