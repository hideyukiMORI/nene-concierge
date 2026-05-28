<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListScenarioHistoryHandler implements RequestHandlerInterface
{
    public function __construct(
        private ListScenarioHistoryUseCase $useCase,
        private JsonResponseFactory        $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $scenarioId = (int) Router::param($request, 'id');

        $query  = $request->getQueryParams();
        $limit  = isset($query['limit']) ? max(1, min(200, (int) $query['limit'])) : 50;
        $offset = isset($query['offset']) ? max(0, (int) $query['offset']) : 0;

        $result = $this->useCase->execute($scenarioId, $orgId, $limit, $offset);

        $items = array_map(
            static fn (ListScenarioHistoryItem $r): array => [
                'id'          => $r->id,
                'revision_no' => $r->revisionNo,
                'user_id'     => $r->userId,
                'user_email'  => $r->userEmail,
                'operation'   => $r->operation,
                'name'        => $r->name,
                'status'      => $r->status,
                'node_count'  => $r->nodeCount,
                'edge_count'  => $r->edgeCount,
                'created_at'  => $r->createdAt,
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
}
