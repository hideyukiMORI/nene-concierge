<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ListScenarioRevisionsUseCase
{
    public function __construct(
        private ScenarioRevisionRepositoryInterface $revisions,
    ) {
    }

    public function execute(ListScenarioRevisionsInput $input): ListScenarioRevisionsResult
    {
        $rows = $this->revisions->searchByOrganization(
            organizationId: $input->organizationId,
            scenarioId:     $input->scenarioId,
            userId:         $input->userId,
            operation:      $input->operation,
            query:          $input->query,
            dateFromUnix:   $input->dateFromUnix,
            dateToUnix:     $input->dateToUnix,
            limit:          $input->limit,
            offset:         $input->offset,
        );

        $items = array_map(
            static fn (array $row): ListScenarioRevisionsItem => new ListScenarioRevisionsItem(
                id:           (int) $row['id'],
                scenarioId:   (int) $row['scenario_id'],
                scenarioName: isset($row['scenario_name']) ? (string) $row['scenario_name'] : null,
                revisionNo:   (int) $row['revision_no'],
                userId:       isset($row['user_id']) ? (int) $row['user_id'] : null,
                userEmail:    isset($row['user_email']) ? (string) $row['user_email'] : null,
                operation:    (string) $row['operation'],
                name:         isset($row['name']) ? (string) $row['name'] : null,
                status:       isset($row['status']) ? (string) $row['status'] : null,
                nodeCount:    (int) ($row['node_count'] ?? 0),
                edgeCount:    (int) ($row['edge_count'] ?? 0),
                createdAt:    isset($row['created_at']) ? (string) $row['created_at'] : null,
            ),
            $rows,
        );

        $total = $this->revisions->countByOrganization(
            organizationId: $input->organizationId,
            scenarioId:     $input->scenarioId,
            userId:         $input->userId,
            operation:      $input->operation,
            query:          $input->query,
            dateFromUnix:   $input->dateFromUnix,
            dateToUnix:     $input->dateToUnix,
        );

        return new ListScenarioRevisionsResult($items, $total);
    }
}
