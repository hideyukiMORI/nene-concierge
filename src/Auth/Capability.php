<?php

declare(strict_types=1);

namespace NeNeConcierge\Auth;

enum Capability
{
    case ManageOrganizations; // superadmin only
    case ManageUsers;         // owner + superadmin
    case ManageScenarios;     // owner + editor + superadmin
    case ViewScenarios;       // all authenticated operators
}
