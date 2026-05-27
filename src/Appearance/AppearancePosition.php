<?php

declare(strict_types=1);

namespace NeNeConcierge\Appearance;

enum AppearancePosition: string
{
    case BottomRight = 'bottom-right';
    case BottomLeft  = 'bottom-left';
    case TopRight    = 'top-right';
    case TopLeft     = 'top-left';
}
