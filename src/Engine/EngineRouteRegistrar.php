<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Routing\Router;
use NeNeConcierge\Session\GetSessionDetailHandler;
use NeNeConcierge\Session\ListSessionsHandler;
use Psr\Http\Message\ServerRequestInterface;

final readonly class EngineRouteRegistrar
{
    public function __construct(
        private StartSessionHandler    $startHandler,
        private StepSessionHandler     $stepHandler,
        private PreviewStartHandler    $previewStartHandler,
        private PreviewStepHandler     $previewStepHandler,
        private ListSessionsHandler    $listSessionsHandler,
        private GetSessionDetailHandler $getSessionDetailHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $start             = $this->startHandler;
        $step              = $this->stepHandler;
        $previewStart      = $this->previewStartHandler;
        $previewStep       = $this->previewStepHandler;
        $listSessions      = $this->listSessionsHandler;
        $getSessionDetail  = $this->getSessionDetailHandler;

        // Visitor-facing public endpoints (no JWT required)
        $router->post('/api/v1/public/sessions', static fn (ServerRequestInterface $r) => $start->handle($r));
        $router->post('/api/v1/public/sessions/{session_id}/step', static fn (ServerRequestInterface $r) => $step->handle($r));

        // Admin preview endpoints (JWT + ManageScenarios required via CapabilityMiddleware)
        $router->post('/api/v1/scenarios/{id}/preview/start', static fn (ServerRequestInterface $r) => $previewStart->handle($r));
        $router->post('/api/v1/scenarios/{id}/preview/step/{session_id}', static fn (ServerRequestInterface $r) => $previewStep->handle($r));

        // Admin session log endpoints (JWT required)
        $router->get('/api/v1/sessions', static fn (ServerRequestInterface $r) => $listSessions->handle($r));
        $router->get('/api/v1/sessions/{session_id}', static fn (ServerRequestInterface $r) => $getSessionDetail->handle($r));
    }
}
