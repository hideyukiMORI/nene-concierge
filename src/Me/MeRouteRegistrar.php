<?php

declare(strict_types=1);

namespace NeNeConcierge\Me;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class MeRouteRegistrar
{
    public function __construct(
        private GetMeHandler $getMeHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $get = $this->getMeHandler;
        $router->get('/api/v1/me', static fn (ServerRequestInterface $r) => $get->handle($r));
    }
}
