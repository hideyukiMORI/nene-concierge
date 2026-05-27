<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

enum AppearanceTrigger: string
{
    case PageLoad   = 'page_load';
    case Scroll     = 'scroll';
    case ExitIntent = 'exit_intent';
    case Manual     = 'manual';
}
