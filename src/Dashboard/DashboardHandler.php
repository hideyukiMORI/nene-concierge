<?php

declare(strict_types=1);

namespace NeNeConcierge\Dashboard;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/dashboard
 *
 * Returns aggregated KPI statistics for the authenticated operator's organization.
 */
final readonly class DashboardHandler implements RequestHandlerInterface
{
    public function __construct(
        private DashboardRepositoryInterface $repository,
        private JsonResponseFactory          $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);

        $stats = $this->repository->getStats($orgId);

        return $this->response->create([
            'data' => [
                'sessions_7d'          => $stats->sessions7d,
                'converted_7d'         => $stats->converted7d,
                'conversion_rate_7d'   => $stats->conversionRate7d,
                'active_sessions'      => $stats->activeSessions,
                'published_scenarios'  => $stats->publishedScenarios,
                'action_failures_24h'  => $stats->actionFailures24h,
                'daily_sessions'       => $stats->dailySessions,
            ],
        ]);
    }
}
