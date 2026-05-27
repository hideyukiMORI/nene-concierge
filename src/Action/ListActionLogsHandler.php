<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/action-logs
 *
 * Query params:
 *   adapter     http | email | slack | chatwork   (optional)
 *   status      success | failure                 (optional)
 *   scenario_id integer                           (optional)
 *   limit       integer, default 50, max 200      (optional)
 *   offset      integer, default 0               (optional)
 */
final readonly class ListActionLogsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ActionLogRepositoryInterface $repository,
        private JsonResponseFactory          $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId  = (int) $request->getAttribute('nene2.org.id', 0);
        $params = $request->getQueryParams();

        $adapter    = isset($params['adapter'])     && $params['adapter']     !== '' ? (string) $params['adapter'] : null;
        $status     = isset($params['status'])      && $params['status']      !== '' ? (string) $params['status'] : null;
        $scenarioId = isset($params['scenario_id']) && $params['scenario_id'] !== '' ? (int) $params['scenario_id'] : null;
        $limit      = min(200, max(1, (int) ($params['limit']  ?? 50)));
        $offset     = max(0, (int) ($params['offset'] ?? 0));

        $logs  = $this->repository->listByOrganization($orgId, $adapter, $status, $scenarioId, $limit, $offset);
        $total = $this->repository->countByOrganization($orgId, $adapter, $status, $scenarioId);

        return $this->response->create([
            'data'  => array_map(
                static fn (ActionLog $l): array => [
                    'id'            => $l->id,
                    'session_id'    => $l->sessionId,
                    'scenario_id'   => $l->scenarioId,
                    'node_id'       => $l->nodeId,
                    'adapter'       => $l->adapter,
                    'status'        => $l->status,
                    'error_message' => $l->errorMessage,
                    'executed_at'   => $l->executedAt,
                ],
                $logs,
            ),
            'meta' => [
                'total'  => $total,
                'limit'  => $limit,
                'offset' => $offset,
            ],
        ]);
    }
}
