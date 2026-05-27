<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ListScenariosUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface $scenarios,
    ) {
    }

    public function execute(int $organizationId, int $limit = 20, int $offset = 0): ListScenariosResult
    {
        $items = $this->scenarios->findAll($organizationId, $limit, $offset);
        $total = $this->scenarios->count($organizationId);

        return new ListScenariosResult($items, $total, $limit, $offset);
    }
}
