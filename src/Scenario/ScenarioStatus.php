<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

enum ScenarioStatus: string
{
    case Draft     = 'draft';
    case Published = 'published';
}
