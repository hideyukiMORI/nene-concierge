<?php

declare(strict_types=1);

namespace NeNeConcierge\Analytics;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * GET /api/v1/scenarios/{id}/analytics
 *
 * Query params:
 *   period  1d | 7d | 30d | 90d | custom  (default: 7d)
 *   from    Y-m-d  required when period=custom
 *   to      Y-m-d  required when period=custom
 */
final readonly class ScenarioAnalyticsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ScenarioAnalyticsUseCase $useCase,
        private JsonResponseFactory      $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId      = (int) $request->getAttribute('nene2.org.id', 0);
        $scenarioId = (int) $request->getAttribute('id', 0);
        $params     = $request->getQueryParams();

        $period = (string) ($params['period'] ?? '7d');
        $from   = isset($params['from']) && $params['from'] !== '' ? (string) $params['from'] : null;
        $to     = isset($params['to']) && $params['to'] !== '' ? (string) $params['to'] : null;

        $report = $this->useCase->execute($scenarioId, $orgId, $period, $from, $to);

        return $this->response->create([
            'scenario_id'        => $report->scenarioId,
            'period_from'        => $report->periodFrom,
            'period_to'          => $report->periodTo,
            'total_sessions'     => $report->totalSessions,
            'completed_sessions' => $report->completedSessions,
            'converted_sessions' => $report->convertedSessions,
            'nodes'              => array_map(
                static fn (NodeAnalytics $n): array => [
                    'node_id'            => $n->nodeId,
                    'visit_count'        => $n->visitCount,
                    'avg_dwell_ms'       => $n->avgDwellMs,
                    'drop_off_rate'      => $n->dropOffRate,
                    'branch_percentages' => $n->branchPercentages,
                ],
                $report->nodes,
            ),
            'bottlenecks' => $report->bottlenecks,
        ]);
    }
}
