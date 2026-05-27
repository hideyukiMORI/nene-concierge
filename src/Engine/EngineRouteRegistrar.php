<?php

declare(strict_types=1);

namespace NeNeConcierge\Engine;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class EngineRouteRegistrar
{
    public function __construct(
        private StartSessionHandler $startHandler,
        private StepSessionHandler  $stepHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $start = $this->startHandler;
        $step  = $this->stepHandler;

        $router->post('/api/v1/public/sessions', static fn (ServerRequestInterface $r) => $start->handle($r));
        $router->post('/api/v1/public/sessions/{session_id}/step', static fn (ServerRequestInterface $r) => $step->handle($r));
    }
}
