<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

enum SessionOutcome: string
{
    case Active    = 'active';
    case Completed = 'completed';
    case Dropped   = 'dropped';
    case Converted = 'converted';
    case Preview   = 'preview';
}
