<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

enum ScenarioNodeType: string
{
    case Message   = 'message';
    case Condition = 'condition';
    case Action    = 'action';
    case End       = 'end';
}
