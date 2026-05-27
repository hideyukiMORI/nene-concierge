<?php

declare(strict_types=1);

namespace NeNeConcierge\Session;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/sessions
 *
 * Query params:
 *   outcome         active | completed | dropped | converted   (optional)
 *   has_conversion  0 | 1                                       (optional)
 *   scenario_id     integer                                      (optional)
 *   limit           integer, default 50, max 200                (optional)
 *   offset          integer, default 0                          (optional)
 *
 * Preview sessions are always excluded.
 */
final readonly class ListSessionsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ChatSessionRepositoryInterface $repository,
        private JsonResponseFactory            $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId  = (int) $request->getAttribute('nene2.org.id', 0);
        $params = $request->getQueryParams();

        $outcome       = isset($params['outcome'])     && $params['outcome']     !== '' ? (string) $params['outcome'] : null;
        $scenarioId    = isset($params['scenario_id']) && $params['scenario_id'] !== '' ? (int) $params['scenario_id'] : null;
        $hasConversion = isset($params['has_conversion']) && $params['has_conversion'] !== ''
            ? (bool) (int) $params['has_conversion']
            : null;
        $limit  = min(200, max(1, (int) ($params['limit']  ?? 50)));
        $offset = max(0, (int) ($params['offset'] ?? 0));

        $sessions = $this->repository->listByOrganization($orgId, $outcome, $hasConversion, $scenarioId, $limit, $offset);
        $total    = $this->repository->countByOrganization($orgId, $outcome, $hasConversion, $scenarioId);

        return $this->response->create([
            'data' => array_map(
                static fn (ChatSession $s): array => [
                    'id'             => $s->id,
                    'scenario_id'    => $s->scenarioId,
                    'outcome'        => $s->outcome->value,
                    'has_conversion' => $s->hasConversion,
                    'started_at'     => $s->startedAt,
                    'ended_at'       => $s->endedAt,
                ],
                $sessions,
            ),
            'meta' => [
                'total'  => $total,
                'limit'  => $limit,
                'offset' => $offset,
            ],
        ]);
    }
}
