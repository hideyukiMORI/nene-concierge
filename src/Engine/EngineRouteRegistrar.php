<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class EngineRouteRegistrar
{
    public function __construct(
        private StartSessionHandler  $startHandler,
        private StepSessionHandler   $stepHandler,
        private PreviewStartHandler  $previewStartHandler,
        private PreviewStepHandler   $previewStepHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $start        = $this->startHandler;
        $step         = $this->stepHandler;
        $previewStart = $this->previewStartHandler;
        $previewStep  = $this->previewStepHandler;

        // Visitor-facing public endpoints (no JWT required)
        $router->post('/api/v1/public/sessions', static fn (ServerRequestInterface $r) => $start->handle($r));
        $router->post('/api/v1/public/sessions/{session_id}/step', static fn (ServerRequestInterface $r) => $step->handle($r));

        // Admin preview endpoints (JWT + ManageScenarios required via CapabilityMiddleware)
        $router->post('/api/v1/scenarios/{id}/preview/start', static fn (ServerRequestInterface $r) => $previewStart->handle($r));
        $router->post('/api/v1/scenarios/{id}/preview/step/{session_id}', static fn (ServerRequestInterface $r) => $previewStep->handle($r));
    }
}
