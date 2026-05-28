<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/scenario-revisions
 *
 * Cross-scenario revision search. Query params:
 *  - scenario_id   (int, optional)
 *  - user_id       (int, optional)
 *  - operation     (string, optional: create / update / graph_save / status_change / delete)
 *  - q             (string, optional — name / user_email LIKE)
 *  - date_from     (ISO 8601 or YYYY-MM-DD, optional)
 *  - date_to       (ISO 8601 or YYYY-MM-DD, optional — exclusive)
 *  - limit         (int, default 50, max 200)
 *  - offset        (int, default 0)
 */
final readonly class ListScenarioRevisionsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListScenarioRevisionsUseCase $useCase,
        private JsonResponseFactory          $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);
        $q     = $request->getQueryParams();

        $limit  = isset($q['limit']) ? max(1, min(200, (int) $q['limit'])) : 50;
        $offset = isset($q['offset']) ? max(0, (int) $q['offset']) : 0;

        $input = new ListScenarioRevisionsInput(
            organizationId: $orgId,
            scenarioId:     isset($q['scenario_id']) && $q['scenario_id'] !== '' ? (int) $q['scenario_id'] : null,
            userId:         isset($q['user_id']) && $q['user_id'] !== '' ? (int) $q['user_id'] : null,
            operation:      isset($q['operation']) && $q['operation'] !== '' ? (string) $q['operation'] : null,
            query:          isset($q['q']) && $q['q'] !== '' ? (string) $q['q'] : null,
            dateFromUnix:   $this->parseDate(isset($q['date_from']) ? (string) $q['date_from'] : ''),
            dateToUnix:     $this->parseDate(isset($q['date_to']) ? (string) $q['date_to'] : ''),
            limit:          $limit,
            offset:         $offset,
        );

        $result = $this->useCase->execute($input);

        $items = array_map(
            static fn (ListScenarioRevisionsItem $i): array => [
                'id'            => $i->id,
                'scenario_id'   => $i->scenarioId,
                'scenario_name' => $i->scenarioName,
                'revision_no'   => $i->revisionNo,
                'user_id'       => $i->userId,
                'user_email'    => $i->userEmail,
                'operation'     => $i->operation,
                'name'          => $i->name,
                'status'        => $i->status,
                'node_count'    => $i->nodeCount,
                'edge_count'    => $i->edgeCount,
                'created_at'    => $i->createdAt,
            ],
            $result->items,
        );

        return $this->response->create([
            'data' => $items,
            'meta' => [
                'total'  => $result->total,
                'limit'  => $limit,
                'offset' => $offset,
            ],
        ]);
    }

    private function parseDate(string $raw): ?int
    {
        if ($raw === '') {
            return null;
        }
        $ts = strtotime($raw);

        return $ts === false ? null : $ts;
    }
}
